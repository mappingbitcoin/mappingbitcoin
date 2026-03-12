import { buildResponse, successObjectResponse } from '@/utils/ApiUtils';
import { NextResponse, type NextRequest } from 'next/server'
import {getVenueCache, getVenueIndexMap, getVenueSlugIndexMap} from "@/app/api/cache/VenueCache";
import {parseStringPromise} from "xml2js";
import {findNearestCity} from "@/app/api/cache/CitiesCache";
import {TAG_CATEGORY_MAP} from "@/constants/PlaceOsmDictionary";
import {getAdmin1Name} from "@/app/api/cache/Admin1Cache";
import {getSession, getOsmToken} from "@/utils/SessionHelper";
import {
    buildTagsFromForm,
    fetchOsmNode,
    buildOsmModifyXML,
    openOsmChangesetForEdit,
    uploadOsmNode,
    closeOsmChangeset
} from "@/utils/OsmHelpers";
import { verifyRecaptcha } from "@/lib/recaptcha";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams
    const preview = searchParams.get('preview')

    if (!slug) return buildResponse('Missing venue slug or ID', 400);

    if (preview === "true") {
        // Preview mode uses changeset ID (numeric)
        const changesetId = parseInt(slug, 10);
        if (isNaN(changesetId)) return buildResponse('Invalid changeset ID for preview', 400);
        try {
            const venue = await fetchVenueFromChangeset(changesetId);
            if (!venue) return buildResponse("Preview venue not found", 404);
            return successObjectResponse(venue);
        } catch {
            return buildResponse('Error getting preview of venue', 500);
        }
    }

    const venues = await getVenueCache();
    const slugIndexMap = await getVenueSlugIndexMap();
    const idIndexMap = await getVenueIndexMap();

    // Try to find by slug first
    let venueIndex = slugIndexMap[slug];

    // If not found by slug, try to find by ID (for backwards compatibility)
    if (venueIndex === undefined) {
        const numericId = parseInt(slug, 10);
        if (!isNaN(numericId)) {
            venueIndex = idIndexMap[numericId];
        }
    }

    if (venueIndex === undefined) return buildResponse("Venue not found", 404);

    return successObjectResponse(venues[venueIndex]);
}

async function fetchVenueFromChangeset(changesetId: number) {
    const url = `https://api.openstreetmap.org/api/0.6/changeset/${changesetId}/download`;

    const res = await fetch(url);

    if (!res.ok) {
        throw new Error(`Failed to fetch changeset ${changesetId}`);
    }

    const xml = await res.text();

    const parsed = await parseStringPromise(xml);

    const elements = parsed?.osmChange?.create[0]?.node || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const node = elements.find((el: any) => el.tag?.some((tag: any) => tag.$.k === "name"));

    if (!node) return null;

    const tags = Object.fromEntries(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        node.tag?.map((tag: any) => [tag.$.k, tag.$.v]) || []
    );

    const cityData = await findNearestCity(Number(node.$.lon), Number(node.$.lat));

    let category;
    let subcategory;
    for (const [key, value] of Object.entries(tags)) {
        const tag = `${key}:${value}`;
        const match = TAG_CATEGORY_MAP[tag];
        if (match) {
            category = match.category;
            subcategory = match.subcategory;
            break;
        }
    }

    return {
        id: Number(node.$.id),
        lon: Number(node.$.lon),
        lat: Number(node.$.lat),
        tags,
        type: "node",
        city: cityData.name,
        state: await getAdmin1Name(cityData.countryCode, cityData.admin1Code),
        country: cityData.countryCode,
        category,
        subcategory
    };
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    let body;
    try {
        body = await request.json();
    } catch (e) {
        console.error("[PUT /api/places] Failed to parse body:", e);
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { venue, captcha } = body;

    if (!slug) return buildResponse('Missing venue slug or ID', 400);

    // Find the venue to get the OSM node ID
    const venues = await getVenueCache();
    const slugIndexMap = await getVenueSlugIndexMap();
    const idIndexMap = await getVenueIndexMap();

    let venueIndex = slugIndexMap[slug];
    if (venueIndex === undefined) {
        const numericId = parseInt(slug, 10);
        if (!isNaN(numericId)) {
            venueIndex = idIndexMap[numericId];
        }
    }

    if (venueIndex === undefined) return buildResponse("Venue not found", 404);

    const existingVenue = venues[venueIndex];
    const osmNodeId = existingVenue.id;

    // 1. Check if user is logged in via OSM
    const user = await getSession();
    const osmToken = await getOsmToken();
    if (!user || !osmToken) {
        return NextResponse.json({ error: "Not logged in with OSM" }, { status: 401 });
    }

    const token = osmToken;

    // 2. Validate CAPTCHA
    if (!captcha) {
        console.error("[PUT /api/places] Missing CAPTCHA token");
        return NextResponse.json({ error: "Security verification required. Please refresh the page." }, { status: 403 });
    }

    const recaptchaResult = await verifyRecaptcha(captcha);
    if (!recaptchaResult.success) {
        console.error("[PUT /api/places] reCAPTCHA failed:", recaptchaResult.error);
        return NextResponse.json({ error: "Security verification failed. Please try again." }, { status: 403 });
    }

    try {
        // 3. Fetch current node from OSM to get version
        const currentNode = await fetchOsmNode(osmNodeId);

        // 4. Build new tags from form
        const newTags = buildTagsFromForm(venue);

        // 5. Merge with existing tags (preserve OSM tags we don't manage)
        const mergedTags = { ...currentNode.tags, ...newTags };

        // 6. Build modify XML
        const xml = buildOsmModifyXML(
            osmNodeId,
            currentNode.version,
            venue.lat || currentNode.lat,
            venue.lon || currentNode.lon,
            mergedTags
        );

        // 7. Open changeset, upload, and close
        const changesetId = await openOsmChangesetForEdit(token);
        await uploadOsmNode(changesetId, xml, token);
        await closeOsmChangeset(changesetId, token);

        return NextResponse.json({ ok: true, changesetId, nodeId: osmNodeId, slug: existingVenue.slug });
    } catch (err) {
        console.error("[PUT /api/places/[slug]] Failed to update venue on OSM:", err);
        return NextResponse.json({ error: "Failed to update venue on OpenStreetMap. Please try again." }, { status: 500 });
    }
}

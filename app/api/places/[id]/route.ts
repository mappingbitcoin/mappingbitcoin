import { buildResponse, successObjectResponse } from '@/utils/ApiUtils';
import { NextResponse, type NextRequest } from 'next/server'
import {getVenueCache, getVenueIndexMap} from "@/app/api/cache/VenueCache";
import {parseStringPromise} from "xml2js";
import {findNearestCity} from "@/app/api/cache/CitiesCache";
import {TAG_CATEGORY_MAP} from "@/constants/PlaceOsmDictionary";
import {getAdmin1Name} from "@/app/api/cache/Admin1Cache";
import {getSession} from "@/utils/SessionHelper";
import {
    buildTagsFromForm,
    fetchOsmNode,
    buildOsmModifyXML,
    openOsmChangesetForEdit,
    uploadOsmNode,
    closeOsmChangeset
} from "@/utils/OsmHelpers";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: number }> }) {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams
    const preview = searchParams.get('preview')

    if (!id) return buildResponse('Missing venue ID', 400);

    if (preview === "true") {
        try {
            const venue = await fetchVenueFromChangeset(id);
            if (!venue) return buildResponse("Preview venue not found", 404);
            return successObjectResponse(venue);
        } catch {
            return buildResponse('Error getting preview of venue', 500);
        }
    }

    const venues = await getVenueCache();
    const venueIndexMap = await getVenueIndexMap()
    const venueId = venueIndexMap[id];

    if (!venueId && venueId !== 0) return buildResponse("Venue not found", 404);

    return successObjectResponse(venues[venueId]);
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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: number }> }) {
    const { id } = await params;
    const { venue, captcha } = await request.json();

    if (!id) return buildResponse('Missing venue ID', 400);

    // 1. Check if user is logged in via OSM
    const user = await getSession();
    if (!user || !user.access_token) {
        return NextResponse.json({ error: "Not logged in with OSM" }, { status: 401 });
    }

    const token = user.access_token;

    // 2. Validate CAPTCHA
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    const verify = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            secret: secret || "",
            response: captcha,
        }),
    });

    const result = await verify.json();
    if (!result.success || result.score < 0.5) {
        return NextResponse.json({ error: "CAPTCHA verification failed" }, { status: 403 });
    }

    try {
        // 3. Fetch current node from OSM to get version
        const currentNode = await fetchOsmNode(Number(id));

        // 4. Build new tags from form
        const newTags = buildTagsFromForm(venue);

        // 5. Merge with existing tags (preserve OSM tags we don't manage)
        const mergedTags = { ...currentNode.tags, ...newTags };

        // 6. Build modify XML
        const xml = buildOsmModifyXML(
            Number(id),
            currentNode.version,
            venue.lat || currentNode.lat,
            venue.lon || currentNode.lon,
            mergedTags
        );

        // 7. Open changeset, upload, and close
        const changesetId = await openOsmChangesetForEdit(token);
        await uploadOsmNode(changesetId, xml, token);
        await closeOsmChangeset(changesetId, token);

        return NextResponse.json({ ok: true, changesetId, nodeId: id });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: "Failed to update venue on OSM: " + message }, { status: 500 });
    }
}

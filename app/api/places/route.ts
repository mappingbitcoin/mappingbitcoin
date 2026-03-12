import { buildResponse, successObjectResponse } from '@/utils/ApiUtils';
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import {getVenueCache, getVenueIndexMap} from "@/app/api/cache/VenueCache";

import { getTileCache } from "@/app/api/cache/TileCache";
import {getSession, getOsmToken} from "@/utils/SessionHelper";
import {
    buildOsmChangeXML,
    buildTagsFromForm,
    closeOsmChangeset,
    openOsmChangeset,
    uploadOsmNode
} from "@/utils/OsmHelpers";
import {TileCluster} from "@/models/TileCluster";
import { serverEnv } from "@/lib/Environment";
import { announceNewVenue } from "@/lib/nostr/bot";
import { verifyRecaptcha } from "@/lib/recaptcha";

export const GET = async (req: Request) => {
    const { searchParams } = new URL(String(req.url));
    const bboxParam = searchParams.get("bbox");
    const zoomParam = searchParams.get("zoom");

    if (!zoomParam) return buildResponse("zoom parameter is required", 400);
    const z = parseInt(zoomParam, 10);
    if (Number.isNaN(z) || z < 1 || z > 16) return buildResponse("invalid zoom", 400);

    const bbox = bboxParam?.split(",").map(Number);
    const bboxFilter = bbox && bbox.length === 4 ? {
        west: bbox[0],
        south: bbox[1],
        east: bbox[2],
        north: bbox[3]
    } : null;

    const tileCache = await getTileCache();
    const map = await getVenueIndexMap();
    const venuesList = await getVenueCache();
    const tiles = tileCache[z] || [];
    const globalCategoryCount: Record<string, number> = {};
    const globalSubcategoryCount: Record<string, number> = {};

    const tilesReturned: Record<string, TileCluster[]> = {};

    for (const tile of tiles) {
        const { x, y, z, country, ids, count, latitude, longitude, categories, subcategories, venues } = tile;

        // Filter tiles by bbox using the tile centroid
        if (bboxFilter && (
            longitude < bboxFilter.west ||
            longitude > bboxFilter.east ||
            latitude < bboxFilter.south ||
            latitude > bboxFilter.north
        )) continue;

        const tileKey = `${z}/${x}/${y}`;

        // Accumulate global counts
        for (const cat in categories) {
            globalCategoryCount[cat] = (globalCategoryCount[cat] || 0) + categories[cat];
        }
        for (const subcat in subcategories) {
            globalSubcategoryCount[subcat] = (globalSubcategoryCount[subcat] || 0) + subcategories[subcat];
        }

        if (z === 16 && count > 1) {
            // Split each venue into its own "tile-like" entry
            for (const venue of venues) {
                const entry = {
                    id: `z${z}-${x}-${y}-${country}-${venue.id}`,
                    x,
                    y,
                    country,
                    latitude: venue.lat,
                    longitude: venue.lon,
                    count: 1,
                    ids: [venue.id],
                    categories: { [venue.category?.toLowerCase() || "other"]: 1 },
                    subcategories: { [venue.subcategory?.toLowerCase() || "other"]: 1 },
                    venues: [venuesList[map[venue.id]]]
                };
                if (!tilesReturned[tileKey]) tilesReturned[tileKey] = [];
                tilesReturned[tileKey].push(entry);
            }
        } else {
            const entry = {
                id: `z${z}-${x}-${y}-${country}`,
                x,
                y,
                country,
                latitude,
                longitude,
                count,
                ids,
                categories,
                subcategories,
                venues: count === 1 ? [venuesList[map[ids[0]]]] : []
            };
            if (!tilesReturned[tileKey]) tilesReturned[tileKey] = [];
            tilesReturned[tileKey].push(entry);
        }
    }

    let updatedAt: string | null;
    try {
        const stateFile = path.resolve(process.cwd(), 'data', 'osm-replication.state');
        const stateRaw = await fs.readFile(stateFile, 'utf-8');
        const parsed = JSON.parse(stateRaw);
        updatedAt = parsed.timestamp ?? null;
    } catch {
        updatedAt = null;
    }

    return NextResponse.json({
        tiles: tilesReturned,
        relevantCategories: globalCategoryCount,
        relevantSubcategories: globalSubcategoryCount,
        updatedAt,
    }, {
        headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
    });
};

export async function POST(req: Request) {
    const { venue, captcha, osmAccountMode = "personal", nostrPubkey } = await req.json();

    // 1. Determine which OSM token to use
    let token: string;

    if (osmAccountMode === "mappingbitcoin") {
        const botToken = serverEnv.osmBotAccessToken;
        if (!botToken) {
            console.error("[POST /api/places] MappingBitcoin OSM bot token not configured");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }
        token = botToken;
    } else {
        const user = await getSession();
        const osmToken = await getOsmToken();
        if (!user || !osmToken) {
            return NextResponse.json({ error: "Not logged in with OSM" }, { status: 401 });
        }
        token = osmToken;
    }

    // 2. Validate CAPTCHA
    if (!captcha) {
        console.error("[POST /api/places] Missing CAPTCHA token");
        return NextResponse.json({ error: "Security verification required. Please refresh the page." }, { status: 403 });
    }

    const recaptchaResult = await verifyRecaptcha(captcha);
    if (!recaptchaResult.success) {
        console.error("[POST /api/places] reCAPTCHA failed:", recaptchaResult.error);
        return NextResponse.json({ error: "Security verification failed. Please try again." }, { status: 403 });
    }

    // 3. Build XML for OSM
    const tags = buildTagsFromForm(venue, { nostrPubkey })

    try {
        const xml = buildOsmChangeXML(venue.lat, venue.lon, tags);
        const changesetId = await openOsmChangeset(token);
        const diffResult = await uploadOsmNode(changesetId, xml, token);
        await closeOsmChangeset(changesetId, token);

        // Parse node ID from OSM diff result (format: <node old_id="-1" new_id="12345" .../>)
        const nodeIdMatch = diffResult.match(/new_id="(\d+)"/);
        const nodeId = nodeIdMatch ? nodeIdMatch[1] : null;

        // Announce new venue on Nostr (non-blocking)
        if (nodeId) {
            announceNewVenue({
                osmId: `node/${nodeId}`,
                name: venue.name || "New venue",
                city: venue.city,
                country: venue.country,
                category: venue.category,
            }, nostrPubkey).catch((err) => console.error("[NostrBot] Announcement failed:", err));
        }

        return NextResponse.json({ ok: true, changesetId, nodeId });
    } catch (err) {
        console.error("[POST /api/places] Failed to upload to OSM:", err);
        const message = err instanceof Error ? err.message : "Unknown error";

        let userMessage = "Failed to upload venue to OpenStreetMap. Please try again.";
        if (message.includes("401") || message.includes("Unauthorized")) {
            userMessage = "Your OpenStreetMap session has expired. Please log in again.";
        } else if (message.includes("409") || message.includes("Conflict")) {
            userMessage = "A conflict occurred with OpenStreetMap. Please try again.";
        } else if (message.includes("429") || message.includes("Too Many")) {
            userMessage = "Too many requests to OpenStreetMap. Please wait a moment and try again.";
        }

        return NextResponse.json({ error: userMessage }, { status: 500 });
    }
}

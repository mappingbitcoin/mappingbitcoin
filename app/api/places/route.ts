import { buildResponse, successObjectResponse } from '@/utils/ApiUtils';
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import {getVenueCache, getVenueIndexMap} from "@/app/api/cache/VenueCache";

import { getTileCache } from "@/app/api/cache/TileCache";
import {getSession} from "@/utils/SessionHelper";
import {
    buildOsmChangeXML,
    buildTagsFromForm,
    closeOsmChangeset,
    openOsmChangeset,
    uploadOsmNode
} from "@/utils/OsmHelpers";
import {TileCluster} from "@/models/TileCluster";

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

    return successObjectResponse({
        tiles: tilesReturned,
        relevantCategories: globalCategoryCount,
        relevantSubcategories: globalSubcategoryCount,
        updatedAt,
    });
};

export async function POST(req: Request) {
    const { venue, captcha } = await req.json();

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

    // 3. Build XML for OSM
    const tags = buildTagsFromForm(venue)

    try {
        const xml = buildOsmChangeXML(venue.lat, venue.lon, tags);
        const changesetId = await openOsmChangeset(token);
        await uploadOsmNode(changesetId, xml, token);
        await closeOsmChangeset(changesetId, token);

        return NextResponse.json({ ok: true, changesetId });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        return NextResponse.json({ error: "Failed to upload to OSM: " + err.message }, { status: 500 });
    }
}

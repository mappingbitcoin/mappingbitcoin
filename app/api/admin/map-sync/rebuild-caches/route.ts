import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import fsSync from "fs";
import path from "path";
import { refreshVenueCache, getVenueCache } from "@/app/api/cache/VenueCache";
import { refreshLocationCache, getLocationCache } from "@/app/api/cache/LocationCache";
import { refreshTileCache, getTileCache } from "@/app/api/cache/TileCache";

function logCacheRebuild(entries: string[]) {
    const now = new Date();
    const logPath = path.join(
        "data",
        "logs",
        now.getFullYear().toString(),
        String(now.getMonth() + 1).padStart(2, "0")
    );
    const logFile = path.join(logPath, `cache_rebuild_${String(now.getDate()).padStart(2, "0")}.log`);
    fsSync.mkdirSync(logPath, { recursive: true });
    fsSync.appendFileSync(logFile, [`=== ${now.toISOString()} ===`, ...entries, ""].join("\n"));
}

/**
 * GET /api/admin/map-sync/rebuild-caches
 * Get current cache status
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        // Get current cache stats (all getters are async)
        const venueCache = await getVenueCache();
        const locationCache = await getLocationCache();
        const tileCache = await getTileCache();

        // TileCache is Record<zoomLevel, Tile[]> - count tiles at zoom 1 as representative
        const tileFeaturesCount = tileCache[1]?.length ?? 0;

        return NextResponse.json({
            caches: {
                venue: {
                    loaded: venueCache.length > 0,
                    count: venueCache.length,
                },
                location: {
                    loaded: Object.keys(locationCache.countries).length > 0,
                    countries: Object.keys(locationCache.countries).length,
                    states: Object.keys(locationCache.states).length,
                    cities: Object.keys(locationCache.cities).length,
                },
                tile: {
                    loaded: tileFeaturesCount > 0,
                    tilesAtZoom1: tileFeaturesCount,
                },
            },
            actions: [
                "Clear and rebuild VenueCache from EnrichedVenues.json",
                "Clear and rebuild LocationCache (country/state/city hierarchy)",
                "Clear and rebuild TileCache (tiles for map rendering)",
            ],
        });
    } catch (error) {
        console.error("Error getting cache status:", error);
        return NextResponse.json(
            { error: "Failed to get cache status" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/map-sync/rebuild-caches
 * Force rebuild all caches from EnrichedVenues.json
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const logs: string[] = [`Admin cache rebuild initiated by: ${authResult.pubkey}`];
        const startTime = Date.now();

        // Rebuild VenueCache
        const venueStart = Date.now();
        await refreshVenueCache();
        const venueCache = await getVenueCache();
        const venueDuration = Date.now() - venueStart;
        logs.push(`✅ VenueCache rebuilt: ${venueCache.length} venues (${venueDuration}ms)`);

        // Rebuild LocationCache
        const locationStart = Date.now();
        await refreshLocationCache();
        const locationCache = await getLocationCache();
        const locationDuration = Date.now() - locationStart;
        const countryCount = Object.keys(locationCache.countries).length;
        logs.push(`✅ LocationCache rebuilt: ${countryCount} countries (${locationDuration}ms)`);

        // Rebuild TileCache
        const tileStart = Date.now();
        await refreshTileCache();
        const tileCache = await getTileCache();
        const tileDuration = Date.now() - tileStart;
        const tileFeaturesCount = tileCache[1]?.length ?? 0;
        logs.push(`✅ TileCache rebuilt: ${tileFeaturesCount} tiles at zoom 1 (${tileDuration}ms)`);

        const totalDuration = Date.now() - startTime;
        logs.push(`Total rebuild time: ${totalDuration}ms`);

        // Log the operation
        logCacheRebuild(logs);

        return NextResponse.json({
            message: "All caches rebuilt successfully",
            stats: {
                venue: {
                    count: venueCache.length,
                    duration: venueDuration,
                },
                location: {
                    countries: countryCount,
                    states: Object.keys(locationCache.states).length,
                    cities: Object.keys(locationCache.cities).length,
                    duration: locationDuration,
                },
                tile: {
                    tilesAtZoom1: tileFeaturesCount,
                    duration: tileDuration,
                },
                totalDuration,
            },
        });
    } catch (error) {
        console.error("Error rebuilding caches:", error);
        return NextResponse.json(
            { error: "Failed to rebuild caches" },
            { status: 500 }
        );
    }
}

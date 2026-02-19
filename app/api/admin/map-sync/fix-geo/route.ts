import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { uploadToStorage, AssetType } from "@/lib/storage";
import { refreshVenueCache } from "@/app/api/cache/VenueCache";
import { refreshLocationCache } from "@/app/api/cache/LocationCache";
import { refreshTileCache } from "@/app/api/cache/TileCache";
import { getCitiesCache } from "@/app/api/cache/CitiesCache";
import { getAdmin1Name } from "@/app/api/cache/Admin1Cache";
import { City } from "@/models/City";
import KDBush from "kdbush";
import { around } from "geokdbush";

const ENRICHED_FILE = path.resolve("data", "EnrichedVenues.json");

interface EnrichedVenue {
    id: number;
    lat?: number;
    lon?: number;
    city?: string;
    country?: string;
    state?: string;
    enrichedAt?: string;
    [key: string]: unknown;
}

function logGeoFix(entries: string[]) {
    const now = new Date();
    const logPath = path.join(
        "data",
        "logs",
        now.getFullYear().toString(),
        String(now.getMonth() + 1).padStart(2, "0")
    );
    const logFile = path.join(logPath, `geo_fix_${String(now.getDate()).padStart(2, "0")}.log`);
    fsSync.mkdirSync(logPath, { recursive: true });
    fsSync.appendFileSync(logFile, [`=== ${now.toISOString()} ===`, ...entries, ""].join("\n"));
}

function buildNearestCityFinder(cities: City[]) {
    const index = new KDBush(cities, p => p.lon, p => p.lat);
    return (lon: number, lat: number): City | null => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nearestIdx = around(index, lon, lat, 1)[0] as any;
        return nearestIdx !== undefined ? cities[nearestIdx] : null;
    };
}

/**
 * POST /api/admin/map-sync/fix-geo
 * Fix venues missing country/city/state fields by looking up nearest city
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        // Check if file exists
        if (!fsSync.existsSync(ENRICHED_FILE)) {
            return NextResponse.json(
                { error: "EnrichedVenues.json not found" },
                { status: 404 }
            );
        }

        // Load cities for geo lookup
        const cities = await getCitiesCache();
        const findNearestCity = buildNearestCityFinder(cities);

        // Load enriched venues
        const enrichedRaw = await fs.readFile(ENRICHED_FILE, "utf8");
        const enrichedVenues: EnrichedVenue[] = JSON.parse(enrichedRaw);

        const logs: string[] = [`Admin geo-fix initiated by: ${authResult.pubkey}`];
        let fixedCount = 0;
        const fixedIds: number[] = [];

        // Fix venues missing geo data
        for (const venue of enrichedVenues) {
            // Skip venues without coordinates
            if (!venue.lat || !venue.lon) continue;

            // Check if missing any geo fields
            const missingCountry = !venue.country;
            const missingCity = !venue.city;
            const missingState = !venue.state;

            if (!missingCountry && !missingCity && !missingState) continue;

            // Look up nearest city
            const nearest = findNearestCity(venue.lon, venue.lat);
            if (!nearest) {
                logs.push(`⚠️ No nearest city found for venue ${venue.id} at (${venue.lon}, ${venue.lat})`);
                continue;
            }

            // Update missing fields
            if (missingCity) venue.city = nearest.name;
            if (missingCountry) venue.country = nearest.countryCode;
            if (missingState) {
                const stateName = await getAdmin1Name(nearest.countryCode, nearest.admin1Code);
                if (stateName) venue.state = stateName;
            }

            venue.enrichedAt = new Date().toISOString();
            fixedCount++;
            fixedIds.push(venue.id);

            const missingFields = [
                missingCountry ? "country" : null,
                missingCity ? "city" : null,
                missingState ? "state" : null,
            ].filter(Boolean).join(", ");

            logs.push(`✅ Fixed ${venue.id} — ${venue.city}, ${venue.state}, ${venue.country} [was missing: ${missingFields}]`);
        }

        // If no venues fixed, return early
        if (fixedCount === 0) {
            return NextResponse.json({
                message: "No venues needed geo fixing. All venues have complete geo data.",
                fixedCount: 0,
                fixedIds: [],
            });
        }

        // Log the operation
        logs.push(`Total fixed: ${fixedCount}`);
        logGeoFix(logs);

        // Save updated data
        await fs.writeFile(ENRICHED_FILE, JSON.stringify(enrichedVenues, null, 2), "utf8");

        // Upload to storage
        await uploadToStorage(ENRICHED_FILE, "EnrichedVenues.json", AssetType.VENUES);

        // Refresh caches
        await refreshVenueCache();
        await refreshLocationCache();
        await refreshTileCache();

        return NextResponse.json({
            message: `Successfully fixed geo data for ${fixedCount} venue${fixedCount !== 1 ? "s" : ""}.`,
            fixedCount,
            fixedIds,
        });
    } catch (error) {
        console.error("Error fixing geo data:", error);
        return NextResponse.json(
            { error: "Failed to fix geo data" },
            { status: 500 }
        );
    }
}

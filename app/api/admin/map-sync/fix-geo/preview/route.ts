import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

const ENRICHED_FILE = path.resolve("data", "EnrichedVenues.json");

interface EnrichedVenue {
    id: number;
    lat?: number;
    lon?: number;
    city?: string;
    country?: string;
    state?: string;
    tags?: {
        name?: string;
        [key: string]: unknown;
    };
    category?: string;
    [key: string]: unknown;
}

/**
 * GET /api/admin/map-sync/fix-geo/preview
 * Preview venues that are missing country/city/state fields
 */
export async function GET(request: NextRequest) {
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

        // Load enriched venues
        const enrichedRaw = await fs.readFile(ENRICHED_FILE, "utf8");
        const enrichedVenues: EnrichedVenue[] = JSON.parse(enrichedRaw);

        // Find venues missing geo data (country, city, or state)
        const missingGeoVenues = enrichedVenues
            .filter(v => {
                // Must have coordinates to be fixable
                if (!v.lat || !v.lon) return false;
                // Is missing geo data if any of these are missing
                return !v.country || !v.city || !v.state;
            })
            .map(v => ({
                id: v.id,
                name: v.tags?.name || "Unnamed",
                lat: v.lat!,
                lon: v.lon!,
                currentCity: v.city || null,
                currentCountry: v.country || null,
                currentState: v.state || null,
                category: v.category || "Uncategorized",
                missingFields: [
                    !v.country ? "country" : null,
                    !v.city ? "city" : null,
                    !v.state ? "state" : null,
                ].filter(Boolean) as string[],
            }));

        // Limit preview to first 100 venues for UI performance
        const hasMore = missingGeoVenues.length > 100;
        const previewVenues = missingGeoVenues.slice(0, 100);

        return NextResponse.json({
            totalVenues: enrichedVenues.length,
            missingGeoCount: missingGeoVenues.length,
            missingGeoVenues: previewVenues,
            hasMore,
            actions: missingGeoVenues.length > 0 ? [
                `Look up nearest city for ${missingGeoVenues.length} venue${missingGeoVenues.length !== 1 ? "s" : ""}`,
                "Update country, city, and state fields from cities database",
                "Upload updated EnrichedVenues.json to storage",
                "Refresh venue, location, and tile caches",
                "Log geo-fix operation to data/logs/",
            ] : [],
        });
    } catch (error) {
        console.error("Error previewing geo fix:", error);
        return NextResponse.json(
            { error: "Failed to preview geo fix" },
            { status: 500 }
        );
    }
}

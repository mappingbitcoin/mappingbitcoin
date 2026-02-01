import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

const ENRICHED_FILE = path.resolve("data", "EnrichedVenues.json");
const SOURCE_FILE = path.resolve("data", "BitcoinVenues.json");
const QUEUE_DIR = path.resolve("data", "queues");

interface EnrichedVenue {
    id: number;
    country?: string;
    category?: string;
    enrichedAt?: string;
}

/**
 * GET /api/admin/map-sync/stats
 * Get sync statistics for map data
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        // Load enriched venues
        let enrichedVenues: EnrichedVenue[] = [];
        if (fsSync.existsSync(ENRICHED_FILE)) {
            const enrichedRaw = await fs.readFile(ENRICHED_FILE, "utf8");
            enrichedVenues = JSON.parse(enrichedRaw);
        }

        // Load source venues
        let sourceVenues: EnrichedVenue[] = [];
        if (fsSync.existsSync(SOURCE_FILE)) {
            const sourceRaw = await fs.readFile(SOURCE_FILE, "utf8");
            sourceVenues = JSON.parse(sourceRaw);
        }

        // Calculate stats
        const sourceIds = new Set(sourceVenues.map(v => v.id));
        const enrichedIds = new Set(enrichedVenues.map(v => v.id));

        // Count orphaned venues (in enriched but not in source)
        const orphanedVenues = enrichedVenues.filter(v => !sourceIds.has(v.id)).length;

        // Count venues by country
        const venuesByCountry: Record<string, number> = {};
        for (const venue of enrichedVenues) {
            const country = venue.country || "Unknown";
            venuesByCountry[country] = (venuesByCountry[country] || 0) + 1;
        }

        // Count venues by category
        const venuesByCategory: Record<string, number> = {};
        for (const venue of enrichedVenues) {
            const category = venue.category || "Uncategorized";
            venuesByCategory[category] = (venuesByCategory[category] || 0) + 1;
        }

        // Count pending batches
        let pendingBatches = 0;
        if (fsSync.existsSync(QUEUE_DIR)) {
            const files = await fs.readdir(QUEUE_DIR);
            pendingBatches = files.filter(f => /^geo-enrichment-\d+\.json$/.test(f)).length;
        }

        // Find last enriched timestamp
        let lastEnrichedAt: string | null = null;
        for (const venue of enrichedVenues) {
            if (venue.enrichedAt) {
                if (!lastEnrichedAt || venue.enrichedAt > lastEnrichedAt) {
                    lastEnrichedAt = venue.enrichedAt;
                }
            }
        }

        return NextResponse.json({
            totalEnrichedVenues: enrichedVenues.length,
            totalSourceVenues: sourceVenues.length,
            orphanedVenues,
            venuesByCountry,
            venuesByCategory,
            pendingBatches,
            lastEnrichedAt,
        });
    } catch (error) {
        console.error("Error fetching sync stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch sync stats" },
            { status: 500 }
        );
    }
}

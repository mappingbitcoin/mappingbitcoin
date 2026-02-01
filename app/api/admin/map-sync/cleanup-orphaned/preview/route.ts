import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

const ENRICHED_FILE = path.resolve("data", "EnrichedVenues.json");
const SOURCE_FILE = path.resolve("data", "BitcoinVenues.json");

interface EnrichedVenue {
    id: number;
    tags?: {
        name?: string;
        [key: string]: unknown;
    };
    city?: string;
    country?: string;
    category?: string;
    [key: string]: unknown;
}

/**
 * GET /api/admin/map-sync/cleanup-orphaned/preview
 * Preview what venues would be removed without actually removing them
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        // Check if files exist
        if (!fsSync.existsSync(ENRICHED_FILE)) {
            return NextResponse.json(
                { error: "EnrichedVenues.json not found" },
                { status: 404 }
            );
        }

        if (!fsSync.existsSync(SOURCE_FILE)) {
            return NextResponse.json(
                { error: "BitcoinVenues.json not found" },
                { status: 404 }
            );
        }

        // Load both files
        const enrichedRaw = await fs.readFile(ENRICHED_FILE, "utf8");
        const enrichedVenues: EnrichedVenue[] = JSON.parse(enrichedRaw);

        const sourceRaw = await fs.readFile(SOURCE_FILE, "utf8");
        const sourceVenues: EnrichedVenue[] = JSON.parse(sourceRaw);

        // Create set of valid IDs from source
        const sourceIds = new Set(sourceVenues.map(v => v.id));

        // Find orphaned venues with details
        const orphanedVenues = enrichedVenues
            .filter(v => !sourceIds.has(v.id))
            .map(v => ({
                id: v.id,
                name: v.tags?.name || "Unnamed",
                city: v.city || "Unknown",
                country: v.country || "Unknown",
                category: v.category || "Uncategorized",
            }));

        return NextResponse.json({
            enrichedCount: enrichedVenues.length,
            sourceCount: sourceVenues.length,
            orphanedCount: orphanedVenues.length,
            orphanedVenues,
            actions: orphanedVenues.length > 0 ? [
                `Remove ${orphanedVenues.length} orphaned venue${orphanedVenues.length !== 1 ? "s" : ""} from EnrichedVenues.json`,
                "Upload updated EnrichedVenues.json to storage",
                "Refresh venue, location, and tile caches",
                "Log cleanup operation to data/logs/",
            ] : [],
        });
    } catch (error) {
        console.error("Error previewing cleanup:", error);
        return NextResponse.json(
            { error: "Failed to preview cleanup" },
            { status: 500 }
        );
    }
}

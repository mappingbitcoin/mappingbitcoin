import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { uploadToStorage, AssetType } from "@/lib/storage";
import { refreshVenueCache } from "@/app/api/cache/VenueCache";
import { refreshLocationCache } from "@/app/api/cache/LocationCache";
import { refreshTileCache } from "@/app/api/cache/TileCache";

const ENRICHED_FILE = path.resolve("data", "EnrichedVenues.json");
const SOURCE_FILE = path.resolve("data", "BitcoinVenues.json");

interface EnrichedVenue {
    id: number;
    [key: string]: unknown;
}

function logCleanup(entries: string[]) {
    const now = new Date();
    const logPath = path.join(
        "data",
        "logs",
        now.getFullYear().toString(),
        String(now.getMonth() + 1).padStart(2, "0")
    );
    const logFile = path.join(logPath, `orphan_cleanup_${String(now.getDate()).padStart(2, "0")}.log`);
    fsSync.mkdirSync(logPath, { recursive: true });
    fsSync.appendFileSync(logFile, [`=== ${now.toISOString()} ===`, ...entries, ""].join("\n"));
}

/**
 * POST /api/admin/map-sync/cleanup-orphaned
 * Remove venues from EnrichedVenues.json that don't exist in BitcoinVenues.json
 * This fixes the bug where deleted OSM points persisted in the enriched data.
 */
export async function POST(request: NextRequest) {
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

        // Find orphaned venues
        const orphanedIds: number[] = [];
        const cleanedVenues: EnrichedVenue[] = [];

        for (const venue of enrichedVenues) {
            if (sourceIds.has(venue.id)) {
                cleanedVenues.push(venue);
            } else {
                orphanedIds.push(venue.id);
            }
        }

        // If no orphaned venues, return early
        if (orphanedIds.length === 0) {
            return NextResponse.json({
                message: "No orphaned venues found. Data is already in sync.",
                removedCount: 0,
                removedIds: [],
            });
        }

        // Log the cleanup
        const logs = [
            `Admin cleanup initiated by: ${authResult.pubkey}`,
            `Original enriched count: ${enrichedVenues.length}`,
            `Source venue count: ${sourceVenues.length}`,
            `Orphaned venues removed: ${orphanedIds.length}`,
            `Removed IDs: ${orphanedIds.join(", ")}`,
        ];
        logCleanup(logs);

        // Save cleaned data
        await fs.writeFile(ENRICHED_FILE, JSON.stringify(cleanedVenues, null, 2), "utf8");

        // Upload to storage
        await uploadToStorage(ENRICHED_FILE, "EnrichedVenues.json", AssetType.VENUES);

        // Refresh caches
        await refreshVenueCache();
        await refreshLocationCache();
        await refreshTileCache();

        return NextResponse.json({
            message: `Successfully removed ${orphanedIds.length} orphaned venue${orphanedIds.length !== 1 ? "s" : ""}.`,
            removedCount: orphanedIds.length,
            removedIds: orphanedIds,
        });
    } catch (error) {
        console.error("Error cleaning up orphaned venues:", error);
        return NextResponse.json(
            { error: "Failed to clean up orphaned venues" },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { uploadToStorage, downloadFromStorage, AssetType } from "@/lib/storage";

const DATA_DIR = path.resolve("data");
const REPLICATION_STATE_FILE = path.join(DATA_DIR, "osm-replication.state");
const SYNC_DATA_FILE = path.join(DATA_DIR, "SyncData.json");

interface ReplicationState {
    sequenceNumber: number;
    timestamp: string;
}

interface SyncStateResponse {
    replicationState: {
        local: ReplicationState | null;
        storage: ReplicationState | null;
    };
    syncData: {
        local: Record<string, string> | null;
        storage: Record<string, string> | null;
    };
}

// GET: Fetch current sync state from local files and storage
export async function GET(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    try {
        const response: SyncStateResponse = {
            replicationState: { local: null, storage: null },
            syncData: { local: null, storage: null },
        };

        // Get local replication state
        if (existsSync(REPLICATION_STATE_FILE)) {
            try {
                const raw = await fs.readFile(REPLICATION_STATE_FILE, "utf-8");
                response.replicationState.local = JSON.parse(raw);
            } catch {
                // File corrupted
            }
        }

        // Get local sync data
        if (existsSync(SYNC_DATA_FILE)) {
            try {
                const raw = await fs.readFile(SYNC_DATA_FILE, "utf-8");
                response.syncData.local = JSON.parse(raw);
            } catch {
                // File corrupted
            }
        }

        // Get storage replication state
        const tempReplicationFile = path.join(DATA_DIR, "osm-replication.state.temp");
        try {
            await downloadFromStorage("osm-replication.state", tempReplicationFile, AssetType.SYNC);
            const raw = await fs.readFile(tempReplicationFile, "utf-8");
            response.replicationState.storage = JSON.parse(raw);
            await fs.unlink(tempReplicationFile).catch(() => {});
        } catch {
            // Storage not available or file doesn't exist
        }

        // Get storage sync data
        const tempSyncDataFile = path.join(DATA_DIR, "SyncData.json.temp");
        try {
            await downloadFromStorage("SyncData.json", tempSyncDataFile, AssetType.SYNC);
            const raw = await fs.readFile(tempSyncDataFile, "utf-8");
            response.syncData.storage = JSON.parse(raw);
            await fs.unlink(tempSyncDataFile).catch(() => {});
        } catch {
            // Storage not available or file doesn't exist
        }

        return NextResponse.json(response);
    } catch (error) {
        console.error("[GET /api/admin/map-sync/sync-state] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch sync state" },
            { status: 500 }
        );
    }
}

// PUT: Update sync state
export async function PUT(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    try {
        const body = await request.json();
        const { replicationState, syncData } = body;

        const results: string[] = [];

        // Update replication state if provided
        if (replicationState !== undefined) {
            const { sequenceNumber } = replicationState;

            if (typeof sequenceNumber !== "number" || sequenceNumber < 0) {
                return NextResponse.json(
                    { error: "Invalid sequence number" },
                    { status: 400 }
                );
            }

            const content = JSON.stringify(
                {
                    sequenceNumber,
                    timestamp: new Date().toISOString(),
                },
                null,
                2
            );

            // Write locally
            await fs.writeFile(REPLICATION_STATE_FILE, content);
            results.push(`Updated local replication state to sequence #${sequenceNumber}`);

            // Upload to storage
            try {
                await uploadToStorage(REPLICATION_STATE_FILE, "osm-replication.state", AssetType.SYNC);
                results.push("Uploaded replication state to storage");
            } catch (err) {
                results.push(`Warning: Failed to upload replication state to storage: ${err}`);
            }
        }

        // Update sync data if provided
        if (syncData !== undefined) {
            if (typeof syncData !== "object" || syncData === null) {
                return NextResponse.json(
                    { error: "Invalid sync data" },
                    { status: 400 }
                );
            }

            const content = JSON.stringify(syncData, null, 2);

            // Write locally
            await fs.writeFile(SYNC_DATA_FILE, content);
            results.push("Updated local SyncData.json");

            // Upload to storage
            try {
                await uploadToStorage(SYNC_DATA_FILE, "SyncData.json", AssetType.SYNC);
                results.push("Uploaded SyncData.json to storage");
            } catch (err) {
                results.push(`Warning: Failed to upload SyncData.json to storage: ${err}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: "Sync state updated successfully",
            results,
        });
    } catch (error) {
        console.error("[PUT /api/admin/map-sync/sync-state] Error:", error);
        return NextResponse.json(
            { error: "Failed to update sync state" },
            { status: 500 }
        );
    }
}

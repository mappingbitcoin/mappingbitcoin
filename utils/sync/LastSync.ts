import fs from 'fs';
import path from 'path';
import { uploadToStorage, downloadFromStorage, AssetType } from "@/lib/storage";

const SYNC_FILE = path.resolve(process.cwd(), 'data/SyncData.json');

let syncData: Record<string, string> = {};

export async function initSyncData() {
    if (!fs.existsSync(SYNC_FILE)) {
        try {
            console.log("📦 SyncData.json not found. Downloading from storage...");
            await downloadFromStorage("SyncData.json", SYNC_FILE, AssetType.SYNC);
        } catch (err) {
            console.warn("⚠️ Could not download SyncData.json from storage:", err);
        }
    }

    try {
        const raw = await fs.promises.readFile(SYNC_FILE, 'utf-8');
        syncData = JSON.parse(raw);
    } catch {
        console.warn("⚠️ Failed to parse SyncData.json. Starting fresh.");
        syncData = {};
    }
}

export function getLastSyncData(): Record<string, string> {
    return syncData;
}

export async function setLastSyncData(key: string, value: string) {
    syncData[key] = value;
    await fs.promises.writeFile(SYNC_FILE, JSON.stringify(syncData, null, 2), 'utf-8');

    try {
        await uploadToStorage(SYNC_FILE, "SyncData.json", AssetType.SYNC);
    } catch (err) {
        console.warn("⚠️ Failed to upload SyncData.json to storage:", err);
    }
}

export async function updateLastSync(date: string) {
    await setLastSyncData("lastSync", date);
}

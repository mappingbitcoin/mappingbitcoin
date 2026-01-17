import fs from 'fs';
import path from 'path';
import { uploadToSpaces, downloadFromSpaces } from "@/utils/DigitalOceanSpacesHelper";

const SYNC_FILE = path.resolve(process.cwd(), 'data/SyncData.json');

let syncData: Record<string, string> = {};

export async function initSyncData() {
    if (!fs.existsSync(SYNC_FILE)) {
        try {
            console.log("📦 SyncData.json not found. Downloading from Spaces...");
            await downloadFromSpaces("SyncData.json", SYNC_FILE);
        } catch (err) {
            console.warn("⚠️ Could not download SyncData.json from Spaces:", err);
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
        await uploadToSpaces(SYNC_FILE, "SyncData.json");
    } catch (err) {
        console.warn("⚠️ Failed to upload SyncData.json to Spaces:", err);
    }
}

export async function updateLastSync(date: string) {
    await setLastSyncData("lastSync", date);
}

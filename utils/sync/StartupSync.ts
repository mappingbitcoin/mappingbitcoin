import { fetchBitcoinUpdates } from './FetchBitcoinUpdates';
import {initSyncData} from "@/utils/sync/LastSync";

export async function startupSync() {
    console.log(`[StartupSync] Beginning Bitcoin venue sync...`);

    try {
        await initSyncData();       // 🔄 Ensure data is loaded or pulled from Spaces
        const updatedVenues = await fetchBitcoinUpdates();
        console.log(`[StartupSync] ✅ Synced ${updatedVenues.length} total venues.`);
    } catch (err) {
        console.error(`[StartupSync] ❌ Sync failed:`, err);
    }
}

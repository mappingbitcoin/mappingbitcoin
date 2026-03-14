import cron from 'node-cron';
import { startupSync } from './StartupSync';
import { processOsmDiffs } from './ProcessOsmDiff';
import {enrichGeoData} from "@/utils/sync/enrich/EnrichGeoData";
import {initOsmReplicationState} from "@/utils/sync/ReplicationFetcher";
import {generateMerchantSlugs} from "@/utils/sync/slugs/MerchantSlugs";
import {generateVenueSlugs} from "@/utils/sync/slugs/VenueSlugs";
import {generateStats} from "@/utils/sync/stats/GenerateStats";
import { isProduction } from "@/lib/Environment";

let started = false;

export async function startBitcoinVenueCron() {
    if (started || !isProduction) return;
    started = true;

    // ✅ Run startup sync ONCE
    console.log('[Startup] Running initial sync...');
    try {
        await startupSync();
        console.log('[Startup] Initial sync complete ✅');
        await generateVenueSlugs();
        console.log('[Startup] Generating venue slugs complete ✅');
        await generateMerchantSlugs()
        console.log('[Startup] Generating initial merchant slugs complete ✅');
        await generateStats()
        console.log('[Startup] Generating initial stats complete ✅');
    } catch (err) {
        console.error('[Startup] Initial sync failed ❌', err);
    }

    // 🕒 Then start cron for incremental updates only
    let isSyncRunningOsmDiffs = false;

    cron.schedule('* * * * *', async () => {
        if (isSyncRunningOsmDiffs) {
            console.log(`[Cron] Diff sync already running, skipping at ${new Date().toISOString()}`);
            return;
        }

        isSyncRunningOsmDiffs = true;
        console.log(`[Cron] Running OSM diff sync at ${new Date().toISOString()}`);

        try {
            await initOsmReplicationState()
            await processOsmDiffs();
        } catch (err) {
            console.error('[Cron] Diff sync error:', err);
        }

        // Run enrichment independently - process any pending queue files
        // even if diff processing failed above
        try {
            await enrichGeoData();
        } catch (err) {
            console.error('[Cron] Geo enrichment error:', err);
        } finally {
            isSyncRunningOsmDiffs = false;
        }
    });

    let isSyncRunningMerchantSlugs = false;

    cron.schedule('*/5 * * * *', async () => {
        if (isSyncRunningMerchantSlugs) {
            console.log(`[Cron] Merchant slug sync already running, skipping at ${new Date().toISOString()}`);
            return;
        }

        isSyncRunningMerchantSlugs = true;
        console.log(`[Cron] Running Merchant slug sync at ${new Date().toISOString()}`);

        try {
            await generateMerchantSlugs()
            await generateStats()
        } catch (err) {
            console.error('[Cron] Merchant slug sync error:', err);
        } finally {
            isSyncRunningMerchantSlugs = false;
        }
    });

}

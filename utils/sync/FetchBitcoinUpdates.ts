import { OverpassElement, OverpassResponse } from "@/models/Overpass";
import { updateLastSync, getLastSyncData, setLastSyncData } from "./LastSync";
import { cacheVenues } from "./CacheBitcoinVenues";

import fs from "fs";
import path from "path";
import {downloadFromSpaces, uploadToSpaces} from "@/utils/DigitalOceanSpacesHelper";

const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";
const BITCOIN_VENUES_PATH = path.resolve("data", "BitcoinVenues.json");
const ENRICHED_VENUES_PATH = path.resolve("data", "EnrichedVenues.json");

async function isCachedVenueFileAvailable(): Promise<boolean> {
    if (!fs.existsSync(BITCOIN_VENUES_PATH)) {
        try {
            console.log("📦 Local BitcoinVenues.json not found. Attempting to download from Spaces...");
            await downloadFromSpaces("BitcoinVenues.json", BITCOIN_VENUES_PATH);

            if (!fs.existsSync(ENRICHED_VENUES_PATH)) {
                try {
                    console.log("📦 Local EnrichedVenues.json not found. Attempting to download from Spaces...");
                    await downloadFromSpaces("EnrichedVenues.json", ENRICHED_VENUES_PATH);
                } catch (err) {
                    console.warn("⚠️ Could not download EnrichedVenues.json from Spaces:", err);
                    return false;
                }
            }
            return true;
        } catch (err) {
            console.warn("⚠️ Could not download BitcoinVenues.json from Spaces:", err);
            return false;
        }
    }

    try {
        const content = fs.readFileSync(BITCOIN_VENUES_PATH, "utf8");
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) && parsed.length > 0;
    } catch {
        return false;
    }
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const TAGS = [
    "payment:bitcoin",
    "payment:lightning",
    "bitcoin",
    "currency:XBT",
];

const TYPES = ["node", "way", "relation"];

export async function fetchBitcoinUpdates(): Promise<OverpassElement[]> {
    if (await isCachedVenueFileAvailable()) {
        console.log("✅ BitcoinVenues.json already exists. Skipping fetch.");
        return [];
    }
    const syncData = getLastSyncData();
    const allElements: OverpassElement[] = [];

    for (const tag of TAGS) {
        for (const type of TYPES) {
            const lastChecked = syncData?.[`${type}_${tag}`] || "2009-01-01T00:00:00Z";

            const query = `
                [out:json][timeout:60];
                (
                  ${type}["${tag}"="yes"](newer:"${lastChecked}");
                );
                out meta;
                >;
                out skel qt;`;

            console.log(`[Overpass] Querying ${type} with tag ${tag} from ${lastChecked}`);

            try {
                const response = await fetch(OVERPASS_API_URL, {
                    method: "POST",
                    body: query,
                });

                if (!response.ok) {
                    console.warn(`Failed to fetch Overpass data for ${type} with tag ${tag}`);
                    continue;
                }

                const data: OverpassResponse = await response.json();
                if (data.elements?.length) {
                    cacheVenues(data.elements);
                    allElements.push(...data.elements);

                    const localPath = path.resolve("data", "BitcoinVenues.json");
                    if (fs.existsSync(localPath)) {
                        await uploadToSpaces(localPath, "BitcoinVenues.json");
                    }
                }

                const now = new Date().toISOString();
                await setLastSyncData(`${type}_${tag}`, now);
                await updateLastSync(now);

            } catch (err) {
                console.error(`Error fetching ${type} with tag ${tag}:`, err);
            }

            await delay(500); // Space out requests slightly
        }
    }

    return allElements;
}

import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { EnrichedVenue } from "@/models/Overpass";
import { getCitiesCache } from "@/app/api/cache/CitiesCache";
import { getAdmin1Name } from "@/app/api/cache/Admin1Cache";
import { TAG_CATEGORY_MAP } from "@/constants/PlaceOsmDictionary";
import { refreshVenueCache } from "@/app/api/cache/VenueCache";
import { refreshLocationCache } from "@/app/api/cache/LocationCache";
import { refreshTileCache } from "@/app/api/cache/TileCache";
import { uploadToSpaces, downloadFromSpaces } from "@/utils/DigitalOceanSpacesHelper";
import { City } from "@/models/City";
import KDBush from "kdbush";
import { around } from "geokdbush";

const ENRICHED_FILE = path.resolve("data", "EnrichedVenues.json");
const FALLBACK_FILE = path.resolve("data", "BitcoinVenues.json");
const QUEUE_DIR = path.resolve("data", "queues");

function logGeoEnrichment(entries: string[]) {
    const now = new Date();
    const logPath = path.join(
        "data",
        "logs",
        now.getFullYear().toString(),
        String(now.getMonth() + 1).padStart(2, "0")
    );
    const logFile = path.join(logPath, `geo_enrich_${String(now.getDate()).padStart(2, "0")}.log`);
    fsSync.mkdirSync(logPath, { recursive: true });
    fsSync.appendFileSync(logFile, [`=== ${now.toISOString()} ===`, ...entries, ""].join("\n"));
}

async function getBatchFiles(): Promise<string[]> {
    const files = await fs.readdir(QUEUE_DIR);
    return files
        .filter(f => /^geo-enrichment-\d+\.json$/.test(f))
        .sort((a, b) => parseInt(a) - parseInt(b));
}

function computeCenterFromNodes(venue: EnrichedVenue, allVenues: EnrichedVenue[], venuesIndex: Record<string, number>) {
    if (!venue.nodes || venue.nodes.length === 0) return null;
    const coords = venue.nodes.map(id => allVenues[venuesIndex[id]]).filter(Boolean);
    if (coords.length === 0) return null;
    const avgLat = coords.reduce((sum, n) => sum + (n?.lat ?? 0), 0) / coords.length;
    const avgLon = coords.reduce((sum, n) => sum + (n?.lon ?? 0), 0) / coords.length;
    return { lat: avgLat, lon: avgLon };
}

function buildNearestCityFinder(cities: City[]) {
    const index = new KDBush(cities, p => p.lon, p => p.lat);
    return (lon: number, lat: number): City => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nearestIdx = around(index, lon, lat, 1)[0] as any;
        return cities[nearestIdx];
    };
}

async function enrichVenue(
    v: EnrichedVenue,
    venues: EnrichedVenue[],
    venuesIndex: Record<string, number>,
    findNearestCity: (lon: number, lat: number) => City,
    existing?: EnrichedVenue
): Promise<EnrichedVenue | null> {
    if ((!v.lat || !v.lon) && v.type === "way") {
        const center = computeCenterFromNodes(v, venues, venuesIndex);
        if (!center) return null;
        v.lat = center.lat;
        v.lon = center.lon;
    }

    if (!v.lat || !v.lon || !v.id || !v.tags) return null;

    let updated = false;

    if (!existing?.country || !existing.city || !existing.state) {
        const nearest = findNearestCity(v.lon, v.lat);
        if (nearest) {
            v.city = nearest.name;
            v.country = nearest.countryCode;
            v.state = await getAdmin1Name(nearest.countryCode, nearest.admin1Code) || existing?.state;
            v.enrichedAt = new Date().toISOString();
            updated = true;
        }
    }

    if ((!existing?.category || !existing.subcategory) && v.tags) {
        for (const [key, value] of Object.entries(v.tags)) {
            const tag = `${key}:${value}`;
            const match = TAG_CATEGORY_MAP[tag];
            if (match) {
                v.category = match.category;
                v.subcategory = match.subcategory;
                v.enrichedCategoryAt = new Date().toISOString();
                updated = true;
                break;
            }
        }
    }

    if (v.type === "way" && v.nodes) delete v.nodes;
    return updated ? v : null;
}

async function saveAndRefresh(venues: EnrichedVenue[], logs: string[]) {
    await fs.writeFile(ENRICHED_FILE, JSON.stringify(venues, null, 2), "utf8");
    await uploadToSpaces(ENRICHED_FILE, "EnrichedVenues.json");
    logGeoEnrichment(logs);
    await refreshVenueCache();
    await refreshLocationCache();
    await refreshTileCache();
}

export async function enrichGeoData() {
    let venues: EnrichedVenue[] = [];
    const cities = await getCitiesCache();
    const findNearestCity = buildNearestCityFinder(cities);
    const _venueIndexMap: Record<string, number> = {};

    let fromFallback = false;

    try {
      if (!fsSync.existsSync(ENRICHED_FILE))
        await downloadFromSpaces("EnrichedVenues.json", ENRICHED_FILE);
    } catch {
      console.log("⚠️ EnrichedVenues.json not found in Spaces. Trying local or fallback...");
    }

    if (!fsSync.existsSync(ENRICHED_FILE)) {
        console.log("⚠️ EnrichedVenues.json not found. Using BitcoinVenues.json...");
        const raw = await fs.readFile(FALLBACK_FILE, "utf8");
        venues = JSON.parse(raw);
        console.log(`BitcoinVenues.json file found with ${venues.length} records..., using fallback to enrich them all.`);
        fromFallback = true;
    } else {
        const raw = await fs.readFile(ENRICHED_FILE, "utf8");
        venues = JSON.parse(raw);
    }

    venues.forEach((v, i) => _venueIndexMap[v.id] = i);
    const logs: string[] = [];
    let enrichedCount = 0;

    if (fromFallback) {
        const byId = new Map<number, EnrichedVenue>();
        for (const v of venues) {
            const enriched = await enrichVenue(v, venues, _venueIndexMap, findNearestCity);
            if (enriched) {
                byId.set(v.id, enriched);
                logs.push(`✅ Enriched ${v.id} — ${enriched.city}, ${enriched.state}, ${enriched.country}`);
                enrichedCount++;
            }
        }
        await saveAndRefresh(Array.from(byId.values()), logs);
        console.log(`✅ Enriched ${enrichedCount} venues from fallback source.`);
        return;
    }

    const byId = new Map<number, EnrichedVenue>(venues.map(v => [v.id, v]));

    const batchFiles = await getBatchFiles();
    if (batchFiles.length === 0) {
        console.log("🟰 No geo enrichment batches found.");
        return;
    }

    for (const file of batchFiles) {
        const fullPath = path.join(QUEUE_DIR, file);
        const queue = JSON.parse(await fs.readFile(fullPath, "utf8")) as EnrichedVenue[];
        let enrichedInFile = 0;

        for (const queued of queue) {
            const enriched = await enrichVenue(queued, venues, _venueIndexMap, findNearestCity, byId.get(queued.id));
            if (enriched) {
                byId.set(queued.id, enriched);
                logs.push(`✅ Enriched ${queued.id} — ${enriched.city}, ${enriched.state}, ${enriched.country}`);
                enrichedCount++;
                enrichedInFile++;
            }
        }

        await fs.unlink(fullPath);
        console.log(`🗂️ Processed ${file} (${enrichedInFile} enriched).`);
    }

    if (enrichedCount > 0) {
        await saveAndRefresh(Array.from(byId.values()), logs);
        console.log(`✅ Enriched ${enrichedCount} venues from queue.`);
    } else {
        console.log("🟰 No venues enriched from queue.");
    }
}

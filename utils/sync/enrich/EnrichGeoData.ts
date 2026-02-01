import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { EnrichedVenue } from "@/models/Overpass";
import { getCitiesCache } from "@/app/api/cache/CitiesCache";
import { getAdmin1Name } from "@/app/api/cache/Admin1Cache";
import { TAG_CATEGORY_MAP, PLACE_TO_OSM_TAG_KEY } from "@/constants/PlaceOsmDictionary";
import { PLACE_SUBTYPE_MAP, PlaceCategory, matchPlaceSubcategory } from "@/constants/PlaceCategories";
import { refreshVenueCache } from "@/app/api/cache/VenueCache";
import { refreshLocationCache } from "@/app/api/cache/LocationCache";
import { refreshTileCache } from "@/app/api/cache/TileCache";
import { uploadToStorage, downloadFromStorage, AssetType } from "@/lib/storage";
import { City } from "@/models/City";
import KDBush from "kdbush";
import { around } from "geokdbush";
import { assignSlugToVenue } from "@/utils/sync/slugs/VenueSlugs";

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
        let categoryMatched = false;

        // First try: TAG_CATEGORY_MAP lookup (standard OSM tag mapping)
        for (const [key, value] of Object.entries(v.tags)) {
            const tag = `${key}:${value}`;
            const match = TAG_CATEGORY_MAP[tag];
            if (match) {
                v.category = match.category;
                v.subcategory = match.subcategory;
                v.enrichedCategoryAt = new Date().toISOString();
                updated = true;
                categoryMatched = true;
                break;
            }
        }

        // Second try: Use custom 'category' tag from MappingBitcoin submissions
        // When venues are created via our platform, we store category in the tags
        if (!categoryMatched && v.tags.category) {
            const categoryTag = v.tags.category as string;

            // Validate it's a known category
            if (categoryTag in PLACE_SUBTYPE_MAP) {
                v.category = categoryTag as PlaceCategory;

                // Try to find subcategory from OSM tags (amenity, shop, tourism, etc.)
                // These are the keys used in PLACE_TO_OSM_TAG_KEY
                const osmTagKeys = ['amenity', 'shop', 'tourism', 'leisure', 'office', 'craft', 'healthcare', 'place'];
                for (const tagKey of osmTagKeys) {
                    const tagValue = v.tags[tagKey];
                    if (tagValue) {
                        // Check if this value is a valid subcategory using matchPlaceSubcategory
                        const subcatMatch = matchPlaceSubcategory(tagValue);
                        if (subcatMatch && subcatMatch.category === categoryTag) {
                            v.subcategory = subcatMatch.subcategory;
                            break;
                        }
                        // Also check if the value directly exists in the category's subcategories
                        const validSubcats = PLACE_SUBTYPE_MAP[categoryTag as PlaceCategory];
                        if (validSubcats && (validSubcats as readonly string[]).includes(tagValue)) {
                            // Safe cast: tagValue was validated against validSubcats
                            v.subcategory = tagValue as typeof v.subcategory;
                            break;
                        }
                    }
                }

                v.enrichedCategoryAt = new Date().toISOString();
                updated = true;
            }
        }
    }

    if (v.type === "way" && v.nodes) delete v.nodes;
    return updated ? v : null;
}

async function saveAndRefresh(venues: EnrichedVenue[], logs: string[]) {
    await fs.writeFile(ENRICHED_FILE, JSON.stringify(venues, null, 2), "utf8");
    await uploadToStorage(ENRICHED_FILE, "EnrichedVenues.json", AssetType.VENUES);
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
    const existingSlugs = new Set<string>();

    let fromFallback = false;

    try {
      if (!fsSync.existsSync(ENRICHED_FILE))
        await downloadFromStorage("EnrichedVenues.json", ENRICHED_FILE, AssetType.VENUES);
    } catch {
      console.log("⚠️ EnrichedVenues.json not found in storage. Trying local or fallback...");
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

    venues.forEach((v, i) => {
        _venueIndexMap[v.id] = i;
        if (v.slug) existingSlugs.add(v.slug);
    });
    const logs: string[] = [];
    let enrichedCount = 0;

    if (fromFallback) {
        const byId = new Map<number, EnrichedVenue>();
        for (const v of venues) {
            const enriched = await enrichVenue(v, venues, _venueIndexMap, findNearestCity);
            if (enriched) {
                assignSlugToVenue(enriched, existingSlugs);
                byId.set(v.id, enriched);
                logs.push(`✅ Enriched ${v.id} — ${enriched.city}, ${enriched.state}, ${enriched.country} [slug: ${enriched.slug}]`);
                enrichedCount++;
            }
        }
        await saveAndRefresh(Array.from(byId.values()), logs);
        console.log(`✅ Enriched ${enrichedCount} venues from fallback source.`);
        return;
    }

    // Load BitcoinVenues.json as source of truth for which venues should exist
    // This syncs deletions from OSM diffs that were applied to BitcoinVenues.json
    let sourceVenueIds: Set<number> | null = null;
    if (fsSync.existsSync(FALLBACK_FILE)) {
        const sourceRaw = await fs.readFile(FALLBACK_FILE, "utf8");
        const sourceVenues = JSON.parse(sourceRaw) as EnrichedVenue[];
        sourceVenueIds = new Set(sourceVenues.map(v => v.id));
    }

    const byId = new Map<number, EnrichedVenue>(venues.map(v => [v.id, v]));

    // Remove venues that no longer exist in BitcoinVenues.json (deleted from OSM)
    let removedCount = 0;
    if (sourceVenueIds) {
        for (const [id] of byId) {
            if (!sourceVenueIds.has(id)) {
                byId.delete(id);
                logs.push(`🗑️ Removed ${id} (deleted from OSM)`);
                removedCount++;
            }
        }
        if (removedCount > 0) {
            console.log(`🗑️ Synced ${removedCount} deletions from BitcoinVenues.json`);
        }
    }

    const batchFiles = await getBatchFiles();
    if (batchFiles.length === 0 && removedCount === 0) {
        console.log("🟰 No geo enrichment batches found.");
        return;
    }

    // If we have deletions but no new batches, still save the changes
    if (batchFiles.length === 0 && removedCount > 0) {
        await saveAndRefresh(Array.from(byId.values()), logs);
        console.log(`✅ Synced ${removedCount} deletions.`);
        return;
    }

    for (const file of batchFiles) {
        const fullPath = path.join(QUEUE_DIR, file);
        const queue = JSON.parse(await fs.readFile(fullPath, "utf8")) as EnrichedVenue[];
        let enrichedInFile = 0;

        for (const queued of queue) {
            const enriched = await enrichVenue(queued, venues, _venueIndexMap, findNearestCity, byId.get(queued.id));
            if (enriched) {
                assignSlugToVenue(enriched, existingSlugs);
                byId.set(queued.id, enriched);
                logs.push(`✅ Enriched ${queued.id} — ${enriched.city}, ${enriched.state}, ${enriched.country} [slug: ${enriched.slug}]`);
                enrichedCount++;
                enrichedInFile++;
            }
        }

        await fs.unlink(fullPath);
        console.log(`🗂️ Processed ${file} (${enrichedInFile} enriched).`);
    }

    if (enrichedCount > 0 || removedCount > 0) {
        await saveAndRefresh(Array.from(byId.values()), logs);
        const parts = [];
        if (enrichedCount > 0) parts.push(`enriched ${enrichedCount}`);
        if (removedCount > 0) parts.push(`removed ${removedCount}`);
        console.log(`✅ ${parts.join(", ")} venues.`);
    } else {
        console.log("🟰 No venues enriched from queue.");
    }
}

import {EnrichedVenue} from "@/models/Overpass";
import {getVenueCache} from "@/app/api/cache/VenueCache";

export type VenueSummary = Pick<EnrichedVenue, "id" | "lat" | "lon" | "category" | "subcategory" | "country">

export type Tile<T extends VenueSummary> = {
    x: number;
    y: number;
    z: number;
    country: string;
    count: number;
    latitude: number;
    longitude: number;
    ids: number[];
    categories: Record<string, number>;
    subcategories: Record<string, number>;
    venues: T[];
};

function lon2tile(lon: number, z: number): number {
    return Math.floor(((lon + 180) / 360) * (1 << z));
}

function lat2tile(lat: number, z: number): number {
    const rad = (lat * Math.PI) / 180;
    return Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * (1 << z));
}

export type TileCache = Record<number, Tile<VenueSummary | EnrichedVenue>[]>;

let _tileCache: TileCache | null = null;

export async function getTileCache(): Promise<TileCache> {
    if (_tileCache) return _tileCache;

    const venues = await getVenueCache();
    const cache: TileCache = {};

    for (let zoom = 1; zoom <= 16; zoom++) {
        const grouped: Record<string, Tile<VenueSummary>> = {};

        for (const venue of venues) {
            const { id, lat, lon, category, subcategory, country } = venue;
            if (!lat || !lon || !country) continue;

            const x = lon2tile(lon, zoom);
            const y = lat2tile(lat, zoom);
            const tileId = `${x}-${y}-${zoom}-${country}`;

            if (!grouped[tileId]) {
                grouped[tileId] = {
                    x,
                    y,
                    z: zoom,
                    country,
                    count: 0,
                    latitude: 0,
                    longitude: 0,
                    ids: [],
                    categories: {},
                    subcategories: {},
                    venues: []
                };
            }

            const tile = grouped[tileId];
            tile.venues.push({ id, lat, lon, category, subcategory, country });
            tile.ids.push(id);
            tile.count += 1;
            tile.latitude += lat;
            tile.longitude += lon;

            const cat = (category || "other").toLowerCase();
            const subcat = (subcategory || "other").toLowerCase();
            tile.categories[cat] = (tile.categories[cat] || 0) + 1;
            tile.subcategories[subcat] = (tile.subcategories[subcat] || 0) + 1;
        }

        // Finalize each tile: average lat/lon
        for (const tile of Object.values(grouped)) {
            tile.latitude /= tile.count;
            tile.longitude /= tile.count;
        }

        cache[zoom] = Object.values(grouped);
    }

    _tileCache = cache;
    return _tileCache;
}

export async function refreshTileCache(): Promise<void> {
    _tileCache = null;
    await getTileCache();
}

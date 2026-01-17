import path from "path";
import fs from "fs/promises";
import {City} from "@/models/City";
import KDBush from "kdbush";
import {around} from "geokdbush";

type CitiesCache = City[];

let _cache: CitiesCache | null = null;

export async function getCitiesCache() {
    if (_cache) return _cache

    const CITIES_FILE = path.resolve(process.cwd(), "data", "cities1000.txt");
    const raw = await fs.readFile(CITIES_FILE, "utf8");
    const lines = raw.split("\n").filter(Boolean);
    const cities = [];

    for (const line of lines) {
        const parts = line.split("\t");
        const name = parts[1];
        const lat = parseFloat(parts[4]);
        const lon = parseFloat(parts[5]);
        const countryCode = parts[8];
        const admin1Code = parts[10];
        const population = parseInt(parts[14], 10) || 0;

        if (!name || isNaN(lat) || isNaN(lon) || !countryCode || !admin1Code) continue;
        cities.push({ name, lat, lon, countryCode, admin1Code, population });
    }

    _cache = cities;
    return _cache
}

export async function findNearestCity(longitude: number, latitude: number): Promise<City> {
    const cities = await getCitiesCache()
    const index = new KDBush(cities, p => p.lon, p => p.lat);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return cities[around(index, longitude, latitude, 1)[0] as any as number];
}

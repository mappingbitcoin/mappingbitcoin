import fs from 'fs/promises';
import path from 'path';
import {EnrichedVenue} from "@/models/Overpass";
import {Place} from "@/models/Place";

type Accumulator = {
    latSum: number;
    lonSum: number;
    count: number;
    label: string;
    country?: string;
};

type LocationCache = {
    cities: Record<string, Place>;
    states: Record<string, Place>;
    countries: Record<string, Place>;
};

let _cache: LocationCache | null = null;

export async function getLocationCache(): Promise<LocationCache> {
    if (_cache) return _cache;

    const file = path.join(process.cwd(), 'data', 'EnrichedVenues.json');
    const txt = await fs.readFile(file, 'utf8');
    const venues = JSON.parse(txt) as EnrichedVenue[];

    const cityAcc: Record<string, Accumulator> = {};
    const stateAcc: Record<string, Accumulator> = {};
    const countryAcc: Record<string, Accumulator> = {};

    for (const v of venues) {
        if (!v.lat || !v.lon) continue;

        const city = v?.city;
        const state = v?.state;
        const country = v?.country;

        if (city) {
            const key = city.toLowerCase();
            if (!cityAcc[key]) {
                cityAcc[key] = {
                    label: city,
                    country: country ?? undefined,
                    latSum: 0,
                    lonSum: 0,
                    count: 0,
                };
            }
            cityAcc[key].latSum += v.lat;
            cityAcc[key].lonSum += v.lon;
            cityAcc[key].count += 1;
        }

        if (state) {
            const key = state.toLowerCase();
            if (!stateAcc[key]) {
                stateAcc[key] = {
                    label: state,
                    country: country ?? undefined,
                    latSum: 0,
                    lonSum: 0,
                    count: 0,
                };
            }
            stateAcc[key].latSum += v.lat;
            stateAcc[key].lonSum += v.lon;
            stateAcc[key].count += 1;
        }

        if (country) {
            const key = country.toLowerCase();
            if (!countryAcc[key]) {
                countryAcc[key] = {
                    label: country,
                    latSum: 0,
                    lonSum: 0,
                    count: 0,
                };
            }
            countryAcc[key].latSum += v.lat;
            countryAcc[key].lonSum += v.lon;
            countryAcc[key].count += 1;
        }
    }

    function finalize(acc: Record<string, Accumulator>): Record<string, Place> {
        const out: Record<string, Place> = {};
        for (const key in acc) {
            const { latSum, lonSum, count, label, country } = acc[key];
            out[key] = {
                label,
                country,
                latitude: latSum / count,
                longitude: lonSum / count,
                count
            };
        }
        return out;
    }

    _cache = {
        cities: finalize(cityAcc),
        states: finalize(stateAcc),
        countries: finalize(countryAcc),
    };

    return _cache;
}

export async function refreshLocationCache(): Promise<void> {
    _cache = null;
    await getLocationCache();
}

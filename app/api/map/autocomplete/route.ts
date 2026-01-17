import {getVenueCache, getVenueSearchIndexMap} from '@/app/api/cache/VenueCache';
import { getLocationCache } from '@/app/api/cache/LocationCache';
import { NextRequest } from 'next/server';
import {AutocompleteResult} from "@/models/Search";
import {Locale} from "@/i18n/types";
import {getLocalizedCountryName} from "@/utils/CountryUtils";
import {tokenizeAndNormalize} from "@/utils/StringUtils";
import {EnrichedVenue} from "@/models/Overpass";

function matchesQuery(labelTokens: string[], query: string): boolean {
    const queryTokens = tokenizeAndNormalize(query);
    return queryTokens.every(q => labelTokens.some(l => l.includes(q)));
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const query = searchParams.get('q') ?? '';
    const locale = (searchParams.get('locale') ?? 'en') as Locale;
    if (query.length < 2) return Response.json([]);

    const lat = parseFloat(searchParams.get('lat') ?? '');
    const lon = parseFloat(searchParams.get('lon') ?? '');
    const hasCoords = !isNaN(lat) && !isNaN(lon);

    const venues = await getVenueCache();
    const venueSearchIndex = await getVenueSearchIndexMap();
    const { cities, states, countries } = await getLocationCache();

    const venueResults: (AutocompleteResult & { distance?: number })[] = [];
    const locationResults: AutocompleteResult[] = [];

    // 📍 VENUE MATCHES (by name, city, or country)
    for (const [index, labelTokens] of Object.entries(venueSearchIndex)) {
        const v: EnrichedVenue = venues[Number(index)]
        if (matchesQuery(labelTokens, query)) {
            const result: AutocompleteResult = {
                resultType: 'venue',
                label: v.tags.name,
                latitude: v.lat,
                longitude: v.lon,
                venue: v,
                city: v.city,
                distance: hasCoords ? getDistanceKm(lat, lon, v.lat, v.lon) : undefined
            };

            venueResults.push(result);
        }
    }

    // 🗺️ LOCATION MATCHES (city, state, country)
    const locationGroups = [
        { group: cities, resultType: 'city' as const },
        { group: states, resultType: 'state' as const },
        { group: countries, resultType: 'country' as const },
    ];

    for (const { group, resultType } of locationGroups) {
        for (const place of Object.values(group)) {
            const countryLabel = resultType === 'country' ? getLocalizedCountryName(locale, place.label) : getLocalizedCountryName(locale, place.country ?? '');
            let fullLabel;
            let searchLabel;

            switch(resultType) {
                case 'city':
                    fullLabel = `${place.label}, ${countryLabel}`;
                    searchLabel = `${place.label}`;
                    break
                case 'state':
                    fullLabel = `${place.label}, ${countryLabel}`;
                    searchLabel = `${place.label}`;
                    break
                case 'country':
                    fullLabel = `${countryLabel}`;
                    searchLabel = `${countryLabel}`;
                    break
            }

            if (matchesQuery(tokenizeAndNormalize(searchLabel), query)) {
                locationResults.push({
                    resultType,
                    label: fullLabel,
                    latitude: place.latitude,
                    longitude: place.longitude,
                    distance: hasCoords ? getDistanceKm(lat, lon, place.latitude, place.longitude) : undefined
                });
            }
        }
    }

    // 🧭 Sort venue results: by distance if coordinates provided, else alphabetically
    venueResults.sort((a, b) => {
        if (hasCoords) {
            return (a.distance ?? Infinity) - (b.distance ?? Infinity);
        }
        const aStr = `${a.label} ${a.city ?? ''} ${a.country ?? ''}`;
        const bStr = `${b.label} ${b.city ?? ''} ${b.country ?? ''}`;
        return aStr.localeCompare(bStr);
    });

    // 🧹 Sort location results alphabetically
    locationResults.sort((a, b) => {
        if (hasCoords) {
            return (a.distance ?? Infinity) - (b.distance ?? Infinity);
        }
        return a.label.localeCompare(b.label)
    });

    // 🎯 Limit final results
    const limited = [
        ...venueResults.slice(0, 10),
        ...locationResults.slice(0, 5),
    ];

    return Response.json(limited);
}

import {NextRequest} from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import levenshtein from 'fast-levenshtein';

const CACHE_DIR = path.resolve(process.cwd(), "data", "google-places");
const REFRESH_DAYS = 10;

const key = String(process.env.GOOGLE_MAPS_APIKEY_BE);

async function getCacheFilePath(id: string) {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    return path.join(CACHE_DIR, `${id}.json`);
}

async function readCache(id: string) {
    try {
        const filePath = await getCacheFilePath(id);
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch {
        return null;
    }
}

async function writeCache(id: string, data: unknown) {
    const filePath = await getCacheFilePath(id);
    await fs.writeFile(filePath, JSON.stringify({ data, updatedAt: new Date().toISOString() }, null, 2));
}

function isFresh(updatedAt: string): boolean {
    const now = new Date();
    const lastUpdated = new Date(updatedAt);
    const diffDays = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays < REFRESH_DAYS;
}

const getPlaceById = async (id: string) => {
    const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    detailsUrl.searchParams.set('place_id', id);
    detailsUrl.searchParams.set('key', key);
    detailsUrl.searchParams.set('fields', [
        'address_components', 'formatted_address', 'formatted_phone_number', 'geometry', 'name',
        'opening_hours', 'photos', 'place_id', 'rating', 'user_ratings_total', 'types',
        'url', 'website', 'reviews'
    ].join(','));

    const detailRes = await fetch(detailsUrl.toString());
    return (await detailRes.json()).result;
}

export async function GET(req: NextRequest) {
    const id = req.nextUrl.searchParams.get('id');
    const placeId = req.nextUrl.searchParams.get('placeId')
    const name = req.nextUrl.searchParams.get('name');
    const country = req.nextUrl.searchParams.get('country');
    const lat = req.nextUrl.searchParams.get('lat');
    const lon = req.nextUrl.searchParams.get('lon');
    const forceRefresh = req.nextUrl.searchParams.get('refresh') === 'true';

    if (!key) return Response.json({ error: 'Missing API key' }, { status: 400 });

    if (!id) return Response.json({ error: 'Missing venue id' }, { status: 400 });

    const cached = await readCache(id);
    if (cached) {
        if (isFresh(cached.updatedAt) && !forceRefresh) {
            return Response.json(cached.data);
        } else {
            const result = await getPlaceById(cached.data.placeId)
            const updatedData = {
                ...result,
                placeId: result.place_id,
                label: result.name,
                address: result.formatted_address,
                latitude: result.geometry.location.lat,
                longitude: result.geometry.location.lng,
                reviews: result.reviews ?? [],
                photos: result.photos ?? [],
                rating: result.rating,
                userRatingsTotal: result.user_ratings_total,
                types: result.types,
            };

            updatedData.reviews = Array.from(new Map([
                ...(cached?.data.reviews || []),
                ...(updatedData.reviews || [])
            ].map(r => [r.author_name + r.time, r])).values());


            updatedData.photos = Array.from(new Map([
                ...(cached?.data.photos || []),
                ...(updatedData.photos || [])
            ].map(p => [p.photo_reference, p])).values());

            await writeCache(id, updatedData);
            return Response.json(updatedData);
        }
    }


    if (!name || !lat || !lon) {
        return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const latitude = Number(lat);
    const longitude = Number(lon);
    if (isNaN(latitude) || isNaN(longitude)) {
        return Response.json({ error: 'Invalid lat/lon' }, { status: 400 });
    }

    async function tryQuery(query: string, placeId?: string | null) {
        if (placeId) {
            const result = await getPlaceById(placeId);
            if (result) {
                const { geometry, name, formatted_address, rating, user_ratings_total, types, photos } = result;

                return {
                    placeId,
                    label: name,
                    address: formatted_address,
                    latitude: geometry.location.lat,
                    longitude: geometry.location.lng,
                    rating,
                    userRatingsTotal: user_ratings_total,
                    types,
                    reviews: result.reviews ?? [],
                    photos: photos ?? [],
                };
            }
        }
        const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
        url.searchParams.set('query', query);
        url.searchParams.set('locationbias', `circle:500@${latitude},${longitude}`);
        url.searchParams.set('key', key);

        const res = await fetch(url.toString());
        const data = await res.json();
        const places = data.results ?? [];

        for (const place of places) {
            const placeLat = place.geometry.location.lat;
            const placeLon = place.geometry.location.lng;
            const label = place.name;

            const distance = getDistanceFromLatLonInKm(latitude, longitude, placeLat, placeLon);
            const nameDistance = levenshtein.get(query.toLowerCase(), label.toLowerCase());
            const maxLength = Math.max(query.length, label.length);
            const similarity = 1 - nameDistance / maxLength;

            const looseMatch = (
                label.toLowerCase().startsWith(query.toLowerCase()) ||
                label.toLowerCase().includes(query.toLowerCase())
            );

            const isMatch =
                (distance <= 0.1 && similarity >= 0.85) ||
                (distance <= 0.25 && similarity >= 0.7 && looseMatch);

            if (isMatch) {
                const result = await getPlaceById(place.place_id)

                return {
                    placeId: place.place_id,
                    label,
                    address: place.formatted_address,
                    latitude: placeLat,
                    longitude: placeLon,
                    rating: place.rating,
                    userRatingsTotal: place.user_ratings_total,
                    types: place.types,
                    reviews: result?.reviews ?? [],
                    photos: place.photos ?? [],
                };
            }
        }

        return null;
    }

    let match = await tryQuery(name, placeId);
    if (!match && country) {
        match = await tryQuery(`${name} ${country}`);
    }

    if (match) {
        await writeCache(id, match);
        return Response.json(match);
    }

    return Response.json({ error: 'Place not found' }, { status: 404 });
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}

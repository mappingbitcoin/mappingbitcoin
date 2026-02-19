import { NextRequest } from 'next/server';
import levenshtein from 'fast-levenshtein';

type OsmElement = {
    id: number;
    type: string;
    tags?: Record<string, string>;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number }; // for ways & relations
};

export async function GET(req: NextRequest) {
    const lat = req.nextUrl.searchParams.get('lat');
    const lon = req.nextUrl.searchParams.get('lon');
    const radius = req.nextUrl.searchParams.get('radius') ?? '100';
    const targetName = req.nextUrl.searchParams.get('name')?.toLowerCase();

    if (!lat || !lon) {
        return Response.json({ error: 'Missing latitude or longitude' }, { status: 400 });
    }

    const overpassQuery = `
    [out:json][timeout:25];
    (
      node(around:${radius}, ${lat}, ${lon});
      way(around:${radius}, ${lat}, ${lon});
      relation(around:${radius}, ${lat}, ${lon});
    );
    out body;
    >;
    out skel qt;
  `;

    try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: overpassQuery,
        });

        if (!res.ok) {
            return Response.json({ error: 'Failed to fetch from Overpass API' }, { status: 502 });
        }

        const json = await res.json();
        let elements: OsmElement[] = json.elements;

        // Optional: filter and sort by name similarity
        if (targetName) {
            elements = elements
                .filter((el) => el.tags?.name)
                .map((el) => ({
                    ...el,
                    distance: levenshtein.get(el.tags!.name.toLowerCase(), targetName),
                }))
                .sort((a, b) => a.distance - b.distance);
        }

        return Response.json({ results: elements });
    } catch (err) {
        console.error("[GET /api/map/nearby-places] Error:", err);
        return Response.json({ error: 'Failed to fetch nearby places. Please try again.' }, { status: 500 });
    }
}

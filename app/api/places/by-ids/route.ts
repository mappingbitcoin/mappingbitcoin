import { NextRequest } from "next/server";
import { getVenueCache, getVenueIndexMap } from "@/app/api/cache/VenueCache";
import { EnrichedVenue } from "@/models/Overpass";

export async function POST(req: NextRequest) {
    const { ids, subcategories } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
        return new Response(JSON.stringify({ error: "Missing or invalid ids" }), { status: 400 });
    }

    const venueCache = await getVenueCache();
    const indexMap = await getVenueIndexMap();

    const filteredVenues: EnrichedVenue[] = [];

    const includeOther = subcategories?.includes("other");

    for (const id of ids) {
        const i = indexMap[id];
        if (i === undefined) continue;

        const venue = venueCache[i];
        if (!venue) continue;

        const subcat = venue.subcategory;

        const matches =
            !subcategories || subcategories.length === 0 || // no filter = include all
            (subcat && subcategories.includes(subcat)) ||  // matches selected subcategory
            (!subcat && includeOther);                     // subcat is null/undefined and "other" is selected

        if (matches) {
            filteredVenues.push(venue);
        }
    }

    return new Response(JSON.stringify({ venues: filteredVenues }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}

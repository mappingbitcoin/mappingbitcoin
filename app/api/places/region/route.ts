import { buildResponse, successObjectResponse } from '@/utils/ApiUtils';
import { getVenueCache } from "@/app/api/cache/VenueCache";
import slugify from "slugify";

export const GET = async (req: Request) => {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country')?.toLowerCase();
    const city = searchParams.get('city')?.toLowerCase();
    const subcategory = searchParams.get('subcategory')?.toLowerCase();

    if (!country) return buildResponse('Missing required parameter: country', 400);

    const venues = await getVenueCache();

    const filtered: typeof venues = [];
    const cityCounts = new Map<string, number>();
    const categorySet = new Set<string>();

    for (const v of venues) {
        const venueCountry = v?.country?.toLowerCase();
        if (!venueCountry || venueCountry !== country) continue;

        // This venue is in the target country -- accumulate country-level stats
        const venueCity = v.city?.trim();
        const venueState = v.state?.trim();

        if (venueCity && venueCity.toLowerCase() !== city?.toLowerCase()) {
            cityCounts.set(venueCity, (cityCounts.get(venueCity) || 0) + 1);
        }

        if (
            venueState &&
            venueState.toLowerCase() !== venueCity?.toLowerCase() &&
            venueState.toLowerCase() !== city?.toLowerCase()
        ) {
            cityCounts.set(venueState, (cityCounts.get(venueState) || 0) + 1);
        }

        const trimmedSubcategory = v.subcategory?.trim();
        if (trimmedSubcategory && trimmedSubcategory.toLowerCase() !== subcategory) {
            categorySet.add(trimmedSubcategory);
        }

        // Check if venue matches city + subcategory filters for the filtered list
        if (city) {
            const cityMatch = v?.city ? slugify(v.city).toLowerCase().includes(slugify(city).toLowerCase()) : false;
            const stateMatch = v?.state ? slugify(v.state).toLowerCase().includes(slugify(city).toLowerCase()) : false;
            if (!cityMatch && !stateMatch) continue;
        }

        if (subcategory && v.subcategory?.toLowerCase() !== subcategory) continue;

        filtered.push(v);
    }

    // Convert to array with counts and sort by count descending
    const availableCities = Array.from(cityCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    const availableCategories = Array.from(categorySet).sort((a, b) => a.localeCompare(b));

    return successObjectResponse({
        venues: filtered,
        availableCities,
        availableCategories,
    });
};

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

    const filtered = venues.filter(v => {

        const venueCountry = v?.country?.toLowerCase();
        if (!venueCountry || venueCountry !== country) return false;

        if (city) {
            const cityMatch = v?.city ? slugify(v?.city).toLowerCase().includes(slugify(city).toLowerCase()) : false;
            const stateMatch = v?.state ? slugify(v?.state).toLowerCase().includes(slugify(city).toLowerCase()) : false;
            if (!cityMatch && !stateMatch) return false;
        }

        return !(subcategory && v.subcategory?.toLowerCase() !== subcategory);
    });

    // All venues in this country
    const countryVenues = venues.filter(v =>
        v.country?.toLowerCase() === country
    );

    // Count venues per city/state
    const cityCounts = new Map<string, number>();
    countryVenues.forEach(v => {
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
    });

    // Convert to array with counts and sort by count descending
    const availableCities = Array.from(cityCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    const availableCategories = Array.from(
        new Set(
            countryVenues
                .map(v => v.subcategory?.trim())
                .filter(c => c && c.toLowerCase() !== subcategory)
        )
    ).sort((a, b) => a!.localeCompare(b!));

    return successObjectResponse({
        venues: filtered,
        availableCities,
        availableCategories,
    });
};

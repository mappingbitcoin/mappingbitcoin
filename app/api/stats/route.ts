import { NextResponse } from 'next/server';
import { getVenueCache } from '@/app/api/cache/VenueCache';

export async function GET() {
    const venues = await getVenueCache();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    let newThisMonth = 0;
    let newLastMonth = 0;
    const countriesSet = new Set<string>();

    for (const venue of venues) {
        if (venue.country) {
            countriesSet.add(venue.country);
        }

        const venueDate = venue.enrichedAt ? new Date(venue.enrichedAt) : null;
        if (venueDate) {
            if (venueDate >= startOfMonth) {
                newThisMonth++;
            } else if (venueDate >= startOfLastMonth && venueDate <= endOfLastMonth) {
                newLastMonth++;
            }
        }
    }

    const growthPercent = newLastMonth > 0
        ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100)
        : 0;

    return NextResponse.json({
        totalVenues: venues.length,
        newThisMonth,
        countries: countriesSet.size,
        growthPercent: Math.max(0, growthPercent),
    });
}

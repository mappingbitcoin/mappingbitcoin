import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import slugify from 'slugify';
import { EnrichedVenue } from '@/models/Overpass';
import { uploadToSpaces } from '@/utils/DigitalOceanSpacesHelper';
import { refreshVenueCache } from '@/app/api/cache/VenueCache';

const ENRICHED_FILE = path.resolve('data', 'EnrichedVenues.json');

function generateSlugFromName(name: string): string {
    return slugify(name, { lower: true, strict: true });
}

function generateVenueSlug(
    venue: EnrichedVenue,
    existingSlugs: Set<string>
): string {
    const name = venue.tags?.name || venue.tags?.['name:en'] || `venue-${venue.id}`;
    const city = venue.city || venue.tags?.['addr:city'];
    const address = venue.tags?.['addr:street'] || venue.tags?.['addr:housenumber'];

    // Try just the name
    let slug = generateSlugFromName(name);
    if (!existingSlugs.has(slug)) {
        return slug;
    }

    // Try name + city
    if (city) {
        slug = generateSlugFromName(`${name} ${city}`);
        if (!existingSlugs.has(slug)) {
            return slug;
        }
    }

    // Try name + address + city
    if (address && city) {
        slug = generateSlugFromName(`${name} ${address} ${city}`);
        if (!existingSlugs.has(slug)) {
            return slug;
        }
    }

    // Fallback: add ID to ensure uniqueness
    slug = generateSlugFromName(`${name} ${venue.id}`);
    return slug;
}

export async function generateVenueSlugs(): Promise<number> {
    if (!fsSync.existsSync(ENRICHED_FILE)) {
        console.log('[VenueSlugs] EnrichedVenues.json not found, skipping slug generation.');
        return 0;
    }

    const raw = await fs.readFile(ENRICHED_FILE, 'utf8');
    const venues: EnrichedVenue[] = JSON.parse(raw);

    // Build set of existing slugs
    const existingSlugs = new Set<string>();
    for (const venue of venues) {
        if (venue.slug) {
            existingSlugs.add(venue.slug);
        }
    }

    let updated = 0;

    for (const venue of venues) {
        if (!venue.slug) {
            const slug = generateVenueSlug(venue, existingSlugs);
            venue.slug = slug;
            existingSlugs.add(slug);
            updated++;
        }
    }

    if (updated > 0) {
        await fs.writeFile(ENRICHED_FILE, JSON.stringify(venues, null, 2), 'utf8');
        await uploadToSpaces(ENRICHED_FILE, 'EnrichedVenues.json');
        await refreshVenueCache();
        console.log(`[VenueSlugs] Generated slugs for ${updated} venues.`);
    } else {
        console.log('[VenueSlugs] All venues already have slugs.');
    }

    return updated;
}

export function assignSlugToVenue(
    venue: EnrichedVenue,
    existingSlugs: Set<string>
): string {
    if (venue.slug && !existingSlugs.has(venue.slug)) {
        existingSlugs.add(venue.slug);
        return venue.slug;
    }

    const slug = generateVenueSlug(venue, existingSlugs);
    venue.slug = slug;
    existingSlugs.add(slug);
    return slug;
}

import fs from 'fs';
import path from 'path';
import { OverpassElement } from '@/models/Overpass';
import { uploadToStorage, downloadFromStorage, AssetType } from '@/lib/storage';

const VENUE_CACHE = path.resolve(process.cwd(), 'data/BitcoinVenues.json');

function readExisting(): OverpassElement[] {
    if (!fs.existsSync(VENUE_CACHE)) return [];
    return JSON.parse(fs.readFileSync(VENUE_CACHE, 'utf-8'));
}

export async function initVenueCache() {
    if (!fs.existsSync(VENUE_CACHE)) {
        try {
            console.log('📦 BitcoinVenues.json not found. Downloading from storage...');
            await downloadFromStorage('BitcoinVenues.json', VENUE_CACHE, AssetType.VENUES);
        } catch (err) {
            console.warn('⚠️ Could not download BitcoinVenues.json from storage:', err);
        }
    }
}

export async function cacheVenues(newData: OverpassElement[]) {
    const existing = readExisting();
    const byId = new Map<number, OverpassElement>();

    for (const item of existing) {
        byId.set(item.id, item);
    }

    for (const item of newData) {
        byId.set(item.id, item);
    }

    const merged = Array.from(byId.values());

    if (merged.length === 0 && existing.length > 0) {
        console.warn('⚠️ Skipped writing BitcoinVenues.json — would overwrite with empty list.');
        return;
    }

    const isChanged =
        merged.length !== existing.length ||
        merged.some((v, i) => JSON.stringify(v) !== JSON.stringify(existing[i]));

    if (isChanged) {
        fs.writeFileSync(VENUE_CACHE, JSON.stringify(merged, null, 2));
        console.log('💾 BitcoinVenues.json updated.');

        try {
            await uploadToStorage(VENUE_CACHE, 'BitcoinVenues.json', AssetType.VENUES);
        } catch (err) {
            console.warn('⚠️ Failed to upload BitcoinVenues.json to storage:', err);
        }
    } else {
        console.log('✅ No changes detected — cache not updated.');
    }
}

export function readVenueCache(): OverpassElement[] {
    if (!fs.existsSync(VENUE_CACHE)) return [];
    return JSON.parse(fs.readFileSync(VENUE_CACHE, 'utf-8'));
}

export async function writeVenueCache(data: OverpassElement[]) {
    const existing = readExisting();

    if (data.length === 0 && existing.length > 0) {
        console.warn('⚠️ Skipped writing empty BitcoinVenues.json — existing data present.');
        return;
    }

    const isChanged =
        data.length !== existing.length ||
        data.some((v, i) => JSON.stringify(v) !== JSON.stringify(existing[i]));

    if (isChanged) {
        fs.writeFileSync(VENUE_CACHE, JSON.stringify(data, null, 2));
        console.log('💾 BitcoinVenues.json updated by writeVenueCache().');

        try {
            await uploadToStorage(VENUE_CACHE, 'BitcoinVenues.json', AssetType.VENUES);
        } catch (err) {
            console.warn('⚠️ Failed to upload BitcoinVenues.json to storage:', err);
        }
    } else {
        console.log('✅ No changes in writeVenueCache — skipped write.');
    }
}

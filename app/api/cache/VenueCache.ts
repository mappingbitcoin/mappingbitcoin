import fs from 'fs/promises';
import path from 'path';
import { EnrichedVenue } from '@/models/Overpass';
import {tokenizeAndNormalize} from "@/utils/StringUtils";

let _venueCache: EnrichedVenue[] | null = null;
let _venueIndexMap: Record<number, number> | null = null;
let _venueSearchIndexMap: Record<number, string[]> | null = null;

export async function getVenueCache(): Promise<EnrichedVenue[]> {
    if (_venueCache) return _venueCache;

    const filePath = path.join(process.cwd(), 'data', 'EnrichedVenues.json');
    const raw = await fs.readFile(filePath, 'utf8');
    const venues = JSON.parse(raw) as EnrichedVenue[];

    _venueCache = venues;
    _venueIndexMap = {};
    _venueSearchIndexMap = {};

    for (let i = 0; i < venues.length; i++) {
        const v = venues[i]

        _venueIndexMap[v.id] = i;

        if (!v?.tags?.name || v?.tags?.name === '') {
            continue;
        }

        const venueLabel = v.tags.name ?? '';
        const cityLabel = v?.city ?? '';
        const stateLabel = v?.state ?? '';
        const combinedLabel = `${venueLabel} ${cityLabel} ${stateLabel}`;
        _venueSearchIndexMap[i] = tokenizeAndNormalize(combinedLabel);
    }
    return _venueCache;
}

export async function getVenueIndexMap(): Promise<Record<number, number>> {
    if (_venueIndexMap) return _venueIndexMap;
    await getVenueCache(); // populates both _venueCache and _venueIndexMap
    return _venueIndexMap!;
}

export async function getVenueSearchIndexMap(): Promise<Record<number, string[]>> {
    if (_venueSearchIndexMap) return _venueSearchIndexMap;
    await getVenueCache(); // populates both _venueCache and _venueIndexMap
    return _venueSearchIndexMap!;
}

export async function refreshVenueCache(): Promise<void> {
    _venueCache = null;
    _venueIndexMap = null;
    _venueSearchIndexMap = null;
    await getVenueCache();
}

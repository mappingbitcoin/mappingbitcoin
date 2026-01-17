import {EnrichedVenue} from "@/models/Overpass";

export type AutocompleteResult = {
    resultType: 'venue' | 'city' | 'state' | 'country';
    label: string;
    latitude: number;
    longitude: number;
    id?: string;
    venue?: EnrichedVenue;
    city?: string;
    country?: string;
    distance?: number;
};

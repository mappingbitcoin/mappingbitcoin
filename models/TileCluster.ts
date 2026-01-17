import {EnrichedVenue} from "@/models/Overpass";


export type TileCluster = {
    id: string;
    x: number;
    y: number;
    country: string;
    latitude: number;
    longitude: number;
    count: number;
    ids: number[];
    categories: Record<string, number>;
    subcategories: Record<string, number>;
    venues: EnrichedVenue[];
};

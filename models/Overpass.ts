import {PLACE_SUBTYPE_MAP, PlaceCategory} from "@/constants/PlaceCategories";

export type OsmChangeEntry = {
    id: string;
    type: 'node' | 'way' | 'relation';
    lat?: number;
    lon?: number;
    tags: Record<string, string>;
};

export type OverpassElement = {
    type: 'node' | 'way' | 'relation';
    id: number;
    lat?: number;
    lon?: number;
    user?: string;
    timestamp?: string;
    tags?: Record<string, string>;
    nodes?: number[];
};

export type OverpassResponse = {
    version: number;
    generator: string;
    osm3s: {
        timestamp_osm_base: string;
        copyright: string;
    };
    elements: OverpassElement[];
};

export interface GoogleReview {
    author_name: string;
    rating: number;
    relative_time_description: string;
    text: string;
    time: number;
    profile_photo_url?: string;
}

export type EnrichedVenue<T extends PlaceCategory = PlaceCategory> = OverpassElement & {
    id: number;
    lat: number;
    lon: number;
    tags: Record<string, string>;

    // Geolocation enrichment
    country: string;
    state?: string;
    city: string;
    enrichedAt: string; // Timestamp of basic address enrichment
    formattedAddress: string;

    // Category/subcategory assignment
    category?: T;
    subcategory?: (typeof PLACE_SUBTYPE_MAP)[T][number];
    enrichedCategoryAt?: string; // Timestamp of basic address enrichment

    aiUpdatedAt?: string; // Timestamp of AI fallback enrichment if needed

    // Google Places data (on-demand)
    placeId?: string;
    googleFormattedAddress?: string;
    rating?: number;
    userRatingsTotal?: number;
    reviews?: GoogleReview[];
    googleEnrichedAt?: string; // Timestamp of Google data fetch
};


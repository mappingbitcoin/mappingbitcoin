export interface OrphanedVenue {
    id: number;
    name: string;
    city: string;
    country: string;
    category: string;
}

export interface PreviewData {
    enrichedCount: number;
    sourceCount: number;
    orphanedCount: number;
    orphanedVenues: OrphanedVenue[];
    actions: string[];
}

export interface ExecuteResult {
    success: boolean;
    message: string;
    removedCount?: number;
    fixedCount?: number;
}

export interface FixableVenue {
    id: number;
    name: string;
    city: string;
    country: string;
    currentCategory: string | null;
    currentSubcategory: string | null;
    tagCategory: string;
    tagSubcategory: string | null;
    reason: string;
}

export interface CategoryFixPreviewData {
    totalVenues: number;
    fixableCount: number;
    fixableVenues: FixableVenue[];
    hasMore: boolean;
    actions: string[];
}

export interface ReplicationState {
    sequenceNumber: number;
    timestamp: string;
}

export interface SyncStateData {
    replicationState: {
        local: ReplicationState | null;
        storage: ReplicationState | null;
    };
    syncData: {
        local: Record<string, string> | null;
        storage: Record<string, string> | null;
    };
}

export interface GeoFixableVenue {
    id: number;
    name: string;
    lat: number;
    lon: number;
    currentCity: string | null;
    currentCountry: string | null;
    currentState: string | null;
    category: string;
    missingFields: string[];
}

export interface GeoFixPreviewData {
    totalVenues: number;
    missingGeoCount: number;
    missingGeoVenues: GeoFixableVenue[];
    hasMore: boolean;
    actions: string[];
}

export interface CacheStatus {
    caches: {
        venue: { loaded: boolean; count: number };
        location: { loaded: boolean; countries: number };
        tile: { loaded: boolean; features: number };
    };
    actions: string[];
}

export interface CacheRebuildResult {
    message: string;
    stats: {
        venue: { count: number; duration: number };
        location: { countries: number; duration: number };
        tile: { features: number; duration: number };
        totalDuration: number;
    };
}

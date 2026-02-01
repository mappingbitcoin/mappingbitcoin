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

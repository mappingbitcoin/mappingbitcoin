"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import Button from "@/components/ui/Button";
import {
    RefreshIcon,
    SearchIcon,
    CloseIcon,
    DatabaseIcon,
    ExternalLinkIcon,
} from "@/assets/icons/ui";
import { EnrichedVenue, OverpassElement } from "@/models/Overpass";

type DataSource = "enriched" | "raw";

interface CachedData {
    source: string;
    count: number;
    lastModified: string;
    downloadedAt: string;
    venues: (EnrichedVenue | OverpassElement)[];
}

const STORAGE_KEY_PREFIX = "mb_admin_db_";

function VenueDetailModal({
    venue,
    onClose,
}: {
    venue: EnrichedVenue | OverpassElement;
    onClose: () => void;
}) {
    const enrichedVenue = venue as EnrichedVenue;
    const isEnriched = "enrichedAt" in venue;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-surface border border-border-light rounded-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border-light">
                    <div>
                        <h3 className="text-lg font-semibold text-white">
                            {venue.tags?.name || `Venue #${venue.id}`}
                        </h3>
                        <p className="text-sm text-text-light">
                            {venue.type}/{venue.id}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={`https://www.openstreetmap.org/${venue.type}/${venue.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-accent hover:bg-accent/10 rounded-lg transition-colors"
                        >
                            <ExternalLinkIcon className="w-4 h-4" />
                            OSM
                        </a>
                        <button
                            onClick={onClose}
                            className="p-2 text-text-light hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Basic Info */}
                    <section>
                        <h4 className="text-sm font-medium text-text-light mb-3 uppercase tracking-wider">
                            Basic Info
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <InfoRow label="ID" value={venue.id} />
                            <InfoRow label="Type" value={venue.type} />
                            <InfoRow
                                label="Latitude"
                                value={venue.lat?.toFixed(6) || "N/A"}
                            />
                            <InfoRow
                                label="Longitude"
                                value={venue.lon?.toFixed(6) || "N/A"}
                            />
                            {venue.user && <InfoRow label="User" value={venue.user} />}
                            {venue.timestamp && (
                                <InfoRow
                                    label="OSM Timestamp"
                                    value={new Date(venue.timestamp).toLocaleString()}
                                />
                            )}
                        </div>
                    </section>

                    {/* Enrichment Data (if enriched) */}
                    {isEnriched && (
                        <section>
                            <h4 className="text-sm font-medium text-text-light mb-3 uppercase tracking-wider">
                                Enrichment Data
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <InfoRow label="Slug" value={enrichedVenue.slug || "N/A"} />
                                <InfoRow label="Country" value={enrichedVenue.country} />
                                <InfoRow label="State" value={enrichedVenue.state || "N/A"} />
                                <InfoRow label="City" value={enrichedVenue.city} />
                                <InfoRow
                                    label="Category"
                                    value={enrichedVenue.category || "N/A"}
                                />
                                <InfoRow
                                    label="Subcategory"
                                    value={enrichedVenue.subcategory || "N/A"}
                                />
                                <InfoRow
                                    label="Formatted Address"
                                    value={enrichedVenue.formattedAddress}
                                    fullWidth
                                />
                                <InfoRow
                                    label="Enriched At"
                                    value={
                                        enrichedVenue.enrichedAt
                                            ? new Date(enrichedVenue.enrichedAt).toLocaleString()
                                            : "N/A"
                                    }
                                />
                                {enrichedVenue.enrichedCategoryAt && (
                                    <InfoRow
                                        label="Category Enriched At"
                                        value={new Date(
                                            enrichedVenue.enrichedCategoryAt
                                        ).toLocaleString()}
                                    />
                                )}
                                {enrichedVenue.aiUpdatedAt && (
                                    <InfoRow
                                        label="AI Updated At"
                                        value={new Date(enrichedVenue.aiUpdatedAt).toLocaleString()}
                                    />
                                )}
                                {enrichedVenue.rating && (
                                    <InfoRow label="Rating" value={enrichedVenue.rating} />
                                )}
                            </div>
                        </section>
                    )}

                    {/* Tags */}
                    <section>
                        <h4 className="text-sm font-medium text-text-light mb-3 uppercase tracking-wider">
                            OSM Tags ({Object.keys(venue.tags || {}).length})
                        </h4>
                        {venue.tags && Object.keys(venue.tags).length > 0 ? (
                            <div className="bg-primary/50 rounded-lg border border-border-light overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-white/5">
                                            <th className="text-left px-3 py-2 text-text-light font-medium">
                                                Key
                                            </th>
                                            <th className="text-left px-3 py-2 text-text-light font-medium">
                                                Value
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(venue.tags)
                                            .sort(([a], [b]) => a.localeCompare(b))
                                            .map(([key, value]) => (
                                                <tr
                                                    key={key}
                                                    className="border-t border-border-light hover:bg-white/[0.02]"
                                                >
                                                    <td className="px-3 py-2 text-accent font-mono text-xs">
                                                        {key}
                                                    </td>
                                                    <td className="px-3 py-2 text-white break-all">
                                                        {value}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-text-light text-sm">No tags available</p>
                        )}
                    </section>

                    {/* Nodes (for ways) */}
                    {venue.nodes && venue.nodes.length > 0 && (
                        <section>
                            <h4 className="text-sm font-medium text-text-light mb-3 uppercase tracking-wider">
                                Nodes ({venue.nodes.length})
                            </h4>
                            <div className="bg-primary/50 rounded-lg border border-border-light p-3 max-h-32 overflow-y-auto">
                                <p className="text-xs text-text-light font-mono break-all">
                                    {venue.nodes.join(", ")}
                                </p>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}

function InfoRow({
    label,
    value,
    fullWidth = false,
}: {
    label: string;
    value: string | number | undefined;
    fullWidth?: boolean;
}) {
    return (
        <div className={fullWidth ? "col-span-2" : ""}>
            <p className="text-xs text-text-light mb-0.5">{label}</p>
            <p className="text-sm text-white break-all">
                {value !== undefined && value !== "" ? String(value) : "—"}
            </p>
        </div>
    );
}

export default function DatabaseTab() {
    const { authToken } = useNostrAuth();
    const [source, setSource] = useState<DataSource>("enriched");
    const [cachedData, setCachedData] = useState<CachedData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedVenue, setSelectedVenue] = useState<
        EnrichedVenue | OverpassElement | null
    >(null);
    const [page, setPage] = useState(0);
    const pageSize = 50;

    // Load cached data from localStorage on mount
    useEffect(() => {
        const storageKey = `${STORAGE_KEY_PREFIX}${source}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as CachedData;
                setCachedData(parsed);
            } catch {
                localStorage.removeItem(storageKey);
            }
        } else {
            setCachedData(null);
        }
        setPage(0);
    }, [source]);

    const fetchData = useCallback(async () => {
        if (!authToken) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/admin/map-sync/database?source=${source}`,
                {
                    headers: { Authorization: `Bearer ${authToken}` },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch database");
            }

            const data = await response.json();
            const cacheData: CachedData = {
                source: data.source,
                count: data.count,
                lastModified: data.lastModified,
                downloadedAt: new Date().toISOString(),
                venues: data.venues,
            };

            // Store in localStorage
            const storageKey = `${STORAGE_KEY_PREFIX}${source}`;
            try {
                localStorage.setItem(storageKey, JSON.stringify(cacheData));
            } catch (e) {
                console.warn("Failed to cache data in localStorage:", e);
            }

            setCachedData(cacheData);
            setPage(0);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch data");
        } finally {
            setLoading(false);
        }
    }, [authToken, source]);

    // Filter venues based on search query
    const filteredVenues = useMemo(() => {
        if (!cachedData?.venues) return [];

        if (!searchQuery.trim()) {
            return cachedData.venues;
        }

        const query = searchQuery.toLowerCase().trim();
        const queryParts = query.split(/\s+/);

        return cachedData.venues.filter((venue) => {
            const searchableText = [
                venue.id?.toString(),
                venue.tags?.name,
                (venue as EnrichedVenue).city,
                (venue as EnrichedVenue).country,
                (venue as EnrichedVenue).state,
                (venue as EnrichedVenue).slug,
                (venue as EnrichedVenue).category,
                (venue as EnrichedVenue).subcategory,
                ...Object.values(venue.tags || {}),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return queryParts.every((part) => searchableText.includes(part));
        });
    }, [cachedData?.venues, searchQuery]);

    // Paginated venues
    const paginatedVenues = useMemo(() => {
        const start = page * pageSize;
        return filteredVenues.slice(start, start + pageSize);
    }, [filteredVenues, page]);

    const totalPages = Math.ceil(filteredVenues.length / pageSize);

    const clearCache = () => {
        const storageKey = `${STORAGE_KEY_PREFIX}${source}`;
        localStorage.removeItem(storageKey);
        setCachedData(null);
    };

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Source Selector */}
                    <select
                        value={source}
                        onChange={(e) => setSource(e.target.value as DataSource)}
                        className="bg-surface border border-border-light rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                        <option value="enriched">EnrichedVenues.json</option>
                        <option value="raw">BitcoinVenues.json</option>
                    </select>

                    <Button
                        onClick={fetchData}
                        variant="solid"
                        color="accent"
                        size="sm"
                        leftIcon={<RefreshIcon className="w-4 h-4" />}
                        disabled={loading}
                    >
                        {loading ? "Loading..." : cachedData ? "Refresh" : "Download"}
                    </Button>

                    {cachedData && (
                        <Button
                            onClick={clearCache}
                            variant="ghost"
                            color="neutral"
                            size="sm"
                        >
                            Clear Cache
                        </Button>
                    )}
                </div>

                {/* Cache Info */}
                {cachedData && (
                    <div className="text-sm text-text-light">
                        <span className="text-white font-medium">
                            {cachedData.count.toLocaleString()}
                        </span>{" "}
                        venues • Downloaded{" "}
                        <span className="text-white">
                            {new Date(cachedData.downloadedAt).toLocaleString()}
                        </span>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                    {error}
                </div>
            )}

            {/* No Data State */}
            {!cachedData && !loading && (
                <div className="bg-surface border border-border-light rounded-xl p-12 text-center">
                    <DatabaseIcon className="w-12 h-12 text-text-light mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                        No Data Loaded
                    </h3>
                    <p className="text-text-light mb-4">
                        Download the venue database to search and browse entries locally.
                    </p>
                    <Button
                        onClick={fetchData}
                        variant="solid"
                        color="accent"
                        leftIcon={<RefreshIcon className="w-4 h-4" />}
                    >
                        Download Database
                    </Button>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent mx-auto mb-4" />
                        <p className="text-text-light">Loading venue database...</p>
                    </div>
                </div>
            )}

            {/* Data Table */}
            {cachedData && !loading && (
                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(0);
                            }}
                            placeholder="Search by name, ID, city, country, tags..."
                            className="w-full bg-surface border border-border-light rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-text-light focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-white"
                            >
                                <CloseIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Results Count */}
                    <div className="text-sm text-text-light">
                        Showing{" "}
                        <span className="text-white font-medium">
                            {paginatedVenues.length}
                        </span>{" "}
                        of{" "}
                        <span className="text-white font-medium">
                            {filteredVenues.length.toLocaleString()}
                        </span>{" "}
                        results
                        {searchQuery && ` for "${searchQuery}"`}
                    </div>

                    {/* Table */}
                    <div className="bg-surface border border-border-light rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-white/5 border-b border-border-light">
                                        <th className="text-left px-4 py-3 text-text-light font-medium">
                                            ID
                                        </th>
                                        <th className="text-left px-4 py-3 text-text-light font-medium">
                                            Name
                                        </th>
                                        <th className="text-left px-4 py-3 text-text-light font-medium">
                                            Location
                                        </th>
                                        <th className="text-left px-4 py-3 text-text-light font-medium">
                                            Category
                                        </th>
                                        <th className="text-left px-4 py-3 text-text-light font-medium">
                                            Tags
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedVenues.map((venue) => {
                                        const enriched = venue as EnrichedVenue;
                                        return (
                                            <tr
                                                key={`${venue.type}-${venue.id}`}
                                                onClick={() => setSelectedVenue(venue)}
                                                className="border-t border-border-light hover:bg-white/[0.02] cursor-pointer transition-colors"
                                            >
                                                <td className="px-4 py-3 text-accent font-mono text-xs">
                                                    {venue.type}/{venue.id}
                                                </td>
                                                <td className="px-4 py-3 text-white">
                                                    {venue.tags?.name || (
                                                        <span className="text-text-light italic">
                                                            No name
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-text-light">
                                                    {enriched.city && enriched.country
                                                        ? `${enriched.city}, ${enriched.country}`
                                                        : venue.lat && venue.lon
                                                        ? `${venue.lat.toFixed(4)}, ${venue.lon.toFixed(4)}`
                                                        : "—"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {enriched.category ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-accent/10 text-accent">
                                                            {enriched.category}
                                                            {enriched.subcategory &&
                                                                ` / ${enriched.subcategory}`}
                                                        </span>
                                                    ) : (
                                                        <span className="text-text-light">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-text-light">
                                                    {Object.keys(venue.tags || {}).length} tags
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {paginatedVenues.length === 0 && (
                            <div className="text-center py-8 text-text-light">
                                No venues found matching your search.
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <Button
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                disabled={page === 0}
                                variant="ghost"
                                color="neutral"
                                size="sm"
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-text-light">
                                Page <span className="text-white">{page + 1}</span> of{" "}
                                <span className="text-white">{totalPages}</span>
                            </span>
                            <Button
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                variant="ghost"
                                color="neutral"
                                size="sm"
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Venue Detail Modal */}
            {selectedVenue && (
                <VenueDetailModal
                    venue={selectedVenue}
                    onClose={() => setSelectedVenue(null)}
                />
            )}
        </div>
    );
}

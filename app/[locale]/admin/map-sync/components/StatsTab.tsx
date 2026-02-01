"use client";

import { useEffect, useState, useCallback } from "react";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import Button from "@/components/ui/Button";
import { RefreshIcon, ChartBarIcon, GlobeIcon, FolderIcon, ClockIcon } from "@/assets/icons/ui";

interface SyncStats {
    totalEnrichedVenues: number;
    totalSourceVenues: number;
    venuesByCountry: Record<string, number>;
    venuesByCategory: Record<string, number>;
    pendingBatches: number;
    lastEnrichedAt: string | null;
    orphanedVenues: number; // Venues in enriched but not in source
}

function StatCard({
    label,
    value,
    icon,
    color = "accent"
}: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color?: "accent" | "green" | "red" | "yellow";
}) {
    const colorClasses = {
        accent: "bg-accent/10 text-accent",
        green: "bg-green-500/10 text-green-400",
        red: "bg-red-500/10 text-red-400",
        yellow: "bg-yellow-500/10 text-yellow-400",
    };

    return (
        <div className="bg-surface rounded-xl border border-border-light p-5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-text-light text-sm mb-1">{label}</p>
                    <p className="text-2xl font-bold text-white">{value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

function TopList({
    title,
    items,
    icon
}: {
    title: string;
    items: [string, number][];
    icon: React.ReactNode;
}) {
    return (
        <div className="bg-surface rounded-xl border border-border-light p-5">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    {icon}
                </div>
                <h3 className="font-semibold text-white">{title}</h3>
            </div>
            <div className="space-y-2">
                {items.length === 0 ? (
                    <p className="text-text-light text-sm">No data available</p>
                ) : (
                    items.map(([name, count]) => (
                        <div key={name} className="flex items-center justify-between py-1.5 border-b border-border-light last:border-0">
                            <span className="text-white text-sm">{name || "Unknown"}</span>
                            <span className="text-text-light text-sm font-medium">{count.toLocaleString()}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default function StatsTab() {
    const { authToken } = useNostrAuth();
    const [stats, setStats] = useState<SyncStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        if (!authToken) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/admin/map-sync/stats", {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch sync stats");
            }

            const data = await response.json();
            setStats(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load stats");
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                {error}
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center py-12 text-text-light">
                No stats available
            </div>
        );
    }

    // Prepare top lists
    const topCountries = Object.entries(stats.venuesByCountry)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const topCategories = Object.entries(stats.venuesByCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    return (
        <div className="space-y-6">
            {/* Refresh Button */}
            <div className="flex justify-end">
                <Button
                    onClick={fetchStats}
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    leftIcon={<RefreshIcon className="w-4 h-4" />}
                >
                    Refresh
                </Button>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Enriched Venues"
                    value={stats.totalEnrichedVenues.toLocaleString()}
                    icon={<ChartBarIcon className="w-5 h-5" />}
                    color="accent"
                />
                <StatCard
                    label="Source Venues (OSM)"
                    value={stats.totalSourceVenues.toLocaleString()}
                    icon={<GlobeIcon className="w-5 h-5" />}
                    color="green"
                />
                <StatCard
                    label="Pending Batches"
                    value={stats.pendingBatches}
                    icon={<FolderIcon className="w-5 h-5" />}
                    color={stats.pendingBatches > 0 ? "yellow" : "accent"}
                />
                <StatCard
                    label="Orphaned Venues"
                    value={stats.orphanedVenues}
                    icon={<ClockIcon className="w-5 h-5" />}
                    color={stats.orphanedVenues > 0 ? "red" : "green"}
                />
            </div>

            {/* Last Enriched Info */}
            {stats.lastEnrichedAt && (
                <div className="bg-surface rounded-xl border border-border-light p-4">
                    <p className="text-text-light text-sm">
                        <span className="text-white font-medium">Last enrichment: </span>
                        {new Date(stats.lastEnrichedAt).toLocaleString()}
                    </p>
                </div>
            )}

            {/* Orphaned Venues Warning */}
            {stats.orphanedVenues > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <p className="text-yellow-400 text-sm">
                        <strong>{stats.orphanedVenues}</strong> venues exist in EnrichedVenues.json but not in BitcoinVenues.json.
                        These are likely deleted from OSM and should be cleaned up using the sync tool.
                    </p>
                </div>
            )}

            {/* Top Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopList
                    title="Top Countries"
                    items={topCountries}
                    icon={<GlobeIcon className="w-4 h-4 text-accent" />}
                />
                <TopList
                    title="Top Categories"
                    items={topCategories}
                    icon={<FolderIcon className="w-4 h-4 text-accent" />}
                />
            </div>
        </div>
    );
}

"use client";

import React, { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useNostrAuth } from "@/contexts/NostrAuthContext";

interface GraphStats {
    totalNodes: number;
    nodesByDepth: Record<number, number>;
    lastBuild: {
        status: string;
        startedAt: string;
        completedAt: string | null;
        seedersCount: number | null;
        nodesCount: number | null;
        errorMessage: string | null;
    } | null;
}

interface DashboardData {
    stats: GraphStats;
    seedersCount: number;
    isRunning: boolean;
}

export default function AdminDashboard() {
    const { authToken } = useNostrAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!authToken) return;

            try {
                const [graphRes, seedersRes] = await Promise.all([
                    fetch("/api/admin/graph", {
                        headers: { Authorization: `Bearer ${authToken}` },
                    }),
                    fetch("/api/admin/seeders", {
                        headers: { Authorization: `Bearer ${authToken}` },
                    }),
                ]);

                if (!graphRes.ok || !seedersRes.ok) {
                    throw new Error("Failed to fetch dashboard data");
                }

                const graphData = await graphRes.json();
                const seedersData = await seedersRes.json();

                setData({
                    stats: graphData.stats,
                    isRunning: graphData.isRunning,
                    seedersCount: seedersData.seeders?.length || 0,
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load dashboard");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [authToken]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
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

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-text-light mt-1">Community Trust System Overview</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Seeders Card */}
                <Link
                    href={"/admin/seeders"}
                    className="bg-surface rounded-xl border border-border-light p-6 hover:border-primary transition-colors"
                >
                    <div className="text-sm text-text-light mb-1">Community Seeders</div>
                    <div className="text-3xl font-bold text-white">
                        {data?.seedersCount || 0}
                    </div>
                    <div className="text-sm text-primary mt-2">Manage seeders &rarr;</div>
                </Link>

                {/* Total Nodes Card */}
                <Link
                    href={"/admin/graph"}
                    className="bg-surface rounded-xl border border-border-light p-6 hover:border-primary transition-colors"
                >
                    <div className="text-sm text-text-light mb-1">Trust Graph Nodes</div>
                    <div className="text-3xl font-bold text-white">
                        {data?.stats.totalNodes?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-primary mt-2">View graph &rarr;</div>
                </Link>

                {/* Build Status Card */}
                <div className="bg-surface rounded-xl border border-border-light p-6">
                    <div className="text-sm text-text-light mb-1">Last Build</div>
                    {data?.stats.lastBuild ? (
                        <>
                            <div className="flex items-center space-x-2">
                                <span
                                    className={`inline-block w-2 h-2 rounded-full ${
                                        data.stats.lastBuild.status === "COMPLETED"
                                            ? "bg-green-500"
                                            : data.stats.lastBuild.status === "RUNNING"
                                            ? "bg-yellow-500 animate-pulse"
                                            : "bg-red-500"
                                    }`}
                                />
                                <span className="text-white font-medium">
                                    {data.stats.lastBuild.status}
                                </span>
                            </div>
                            <div className="text-sm text-text-light mt-2">
                                {new Date(data.stats.lastBuild.startedAt).toLocaleString()}
                            </div>
                        </>
                    ) : (
                        <div className="text-text-light">No builds yet</div>
                    )}
                </div>
            </div>

            {/* Nodes by Depth */}
            {data?.stats.nodesByDepth && Object.keys(data.stats.nodesByDepth).length > 0 && (
                <div className="bg-surface rounded-xl border border-border-light p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Nodes by Trust Level</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-surface-light rounded-lg p-4">
                            <div className="text-sm text-text-light">Depth 0 (Seeders)</div>
                            <div className="text-2xl font-bold text-white">
                                {data.stats.nodesByDepth[0]?.toLocaleString() || 0}
                            </div>
                            <div className="text-xs text-green-400">Score: 1.0</div>
                        </div>
                        <div className="bg-surface-light rounded-lg p-4">
                            <div className="text-sm text-text-light">Depth 1 (Direct Follows)</div>
                            <div className="text-2xl font-bold text-white">
                                {data.stats.nodesByDepth[1]?.toLocaleString() || 0}
                            </div>
                            <div className="text-xs text-yellow-400">Score: 0.4</div>
                        </div>
                        <div className="bg-surface-light rounded-lg p-4">
                            <div className="text-sm text-text-light">Depth 2 (2nd Degree)</div>
                            <div className="text-2xl font-bold text-white">
                                {data.stats.nodesByDepth[2]?.toLocaleString() || 0}
                            </div>
                            <div className="text-xs text-orange-400">Score: 0.1</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="bg-surface rounded-xl border border-border-light p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                    <Link
                        href={"/admin/seeders"}
                        className="px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg transition-colors"
                    >
                        Add Seeder
                    </Link>
                    <Link
                        href={"/admin/graph"}
                        className="px-4 py-2 bg-surface-light hover:bg-border-light text-white rounded-lg transition-colors"
                    >
                        Rebuild Graph
                    </Link>
                </div>
            </div>
        </div>
    );
}

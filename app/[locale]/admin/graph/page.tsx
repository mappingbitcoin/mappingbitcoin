"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import Button from "@/components/ui/Button";
import { ChartBarIcon } from "@/assets/icons/ui";

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

interface BuildLog {
    id: string;
    startedAt: string;
    completedAt: string | null;
    status: string;
    seedersCount: number | null;
    nodesCount: number | null;
    errorMessage: string | null;
}

interface GraphData {
    stats: GraphStats;
    history: BuildLog[];
    isRunning: boolean;
}

export default function GraphPage() {
    const { authToken } = useNostrAuth();
    const [data, setData] = useState<GraphData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [building, setBuilding] = useState(false);
    const [buildResult, setBuildResult] = useState<{ success: boolean; message: string } | null>(null);

    const fetchData = useCallback(async () => {
        if (!authToken) return;

        try {
            const response = await fetch("/api/admin/graph", {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch graph data");
            }

            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load graph data");
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Poll for updates while building
    useEffect(() => {
        if (!building && !data?.isRunning) return;

        const interval = setInterval(() => {
            fetchData();
        }, 5000);

        return () => clearInterval(interval);
    }, [building, data?.isRunning, fetchData]);

    const triggerRebuild = async () => {
        if (!authToken) return;

        setBuilding(true);
        setBuildResult(null);

        try {
            const response = await fetch("/api/admin/graph", {
                method: "POST",
                headers: { Authorization: `Bearer ${authToken}` },
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Build failed");
            }

            setBuildResult({
                success: true,
                message: `Graph built successfully with ${result.nodesCount.toLocaleString()} nodes`,
            });
            fetchData();
        } catch (err) {
            setBuildResult({
                success: false,
                message: err instanceof Error ? err.message : "Build failed",
            });
        } finally {
            setBuilding(false);
        }
    };

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

    const isRunning = building || data?.isRunning;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Trust Graph</h1>
                    <p className="text-text-light mt-1">
                        View and manage the community trust graph
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button
                        href="/admin/graph/analytics"
                        variant="soft"
                        color="neutral"
                        leftIcon={<ChartBarIcon className="w-5 h-5" />}
                    >
                        Analytics
                    </Button>
                    <Button
                        onClick={triggerRebuild}
                        disabled={isRunning}
                        loading={isRunning}
                    >
                        {isRunning ? "Building..." : "Rebuild Graph"}
                    </Button>
                </div>
            </div>

            {/* Build Result */}
            {buildResult && (
                <div
                    className={`rounded-lg p-4 ${
                        buildResult.success
                            ? "bg-green-500/10 border border-green-500/30 text-green-400"
                            : "bg-red-500/10 border border-red-500/30 text-red-400"
                    }`}
                >
                    {buildResult.message}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-surface rounded-xl border border-border-light p-6">
                    <div className="text-sm text-text-light mb-1">Total Nodes</div>
                    <div className="text-3xl font-bold text-white">
                        {data?.stats.totalNodes?.toLocaleString() || 0}
                    </div>
                </div>

                <div className="bg-surface rounded-xl border border-border-light p-6">
                    <div className="text-sm text-text-light mb-1">Seeders (1.0)</div>
                    <div className="text-3xl font-bold text-green-400">
                        {data?.stats.nodesByDepth?.[0]?.toLocaleString() || 0}
                    </div>
                </div>

                <div className="bg-surface rounded-xl border border-border-light p-6">
                    <div className="text-sm text-text-light mb-1">Depth 1 (0.4)</div>
                    <div className="text-3xl font-bold text-yellow-400">
                        {data?.stats.nodesByDepth?.[1]?.toLocaleString() || 0}
                    </div>
                </div>

                <div className="bg-surface rounded-xl border border-border-light p-6">
                    <div className="text-sm text-text-light mb-1">Depth 2 (0.1)</div>
                    <div className="text-3xl font-bold text-orange-400">
                        {data?.stats.nodesByDepth?.[2]?.toLocaleString() || 0}
                    </div>
                </div>
            </div>

            {/* Trust Score Explanation */}
            <div className="bg-surface rounded-xl border border-border-light p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Trust Score Calculation</h2>
                <p className="text-text-light text-sm mb-4">
                    Score is calculated based on how many users at each depth level follow you:
                </p>
                <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-border-light">
                        <div>
                            <span className="text-white font-medium">Seeder</span>
                            <span className="text-text-light ml-2">You are a community seeder</span>
                        </div>
                        <span className="text-green-400 font-mono">= 1.0</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border-light">
                        <div>
                            <span className="text-white font-medium">Per Seeder Follower</span>
                            <span className="text-text-light ml-2">Each seeder that follows you</span>
                        </div>
                        <span className="text-primary font-mono">+0.15</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border-light">
                        <div>
                            <span className="text-white font-medium">Per Depth-1 Follower</span>
                            <span className="text-text-light ml-2">Each depth-1 user that follows you</span>
                        </div>
                        <span className="text-yellow-400 font-mono">+0.02</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border-light">
                        <div>
                            <span className="text-white font-medium">Per Depth-2 Follower</span>
                            <span className="text-text-light ml-2">Each depth-2 user that follows you</span>
                        </div>
                        <span className="text-orange-400 font-mono">+0.005</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <div>
                            <span className="text-white font-medium">Unknown</span>
                            <span className="text-text-light ml-2">Not in the graph</span>
                        </div>
                        <span className="text-red-400 font-mono">= 0.02</span>
                    </div>
                </div>
                <p className="text-text-light text-xs mt-4">
                    Example: If 3 seeders + 10 depth-1 users follow you: score = 3 × 0.15 + 10 × 0.02 = 0.65
                </p>
            </div>

            {/* Build History */}
            <div className="bg-surface rounded-xl border border-border-light overflow-hidden">
                <div className="px-6 py-4 border-b border-border-light">
                    <h2 className="text-lg font-semibold text-white">Build History</h2>
                </div>

                {(!data?.history || data.history.length === 0) ? (
                    <div className="p-8 text-center text-text-light">
                        <p>No builds yet. Click &quot;Rebuild Graph&quot; to create the first build.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-surface-light">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Started</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Duration</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Seeders</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Nodes</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Error</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                                {data.history.map((build) => {
                                    const startedAt = new Date(build.startedAt);
                                    const completedAt = build.completedAt ? new Date(build.completedAt) : null;
                                    const duration = completedAt
                                        ? Math.round((completedAt.getTime() - startedAt.getTime()) / 1000)
                                        : null;

                                    return (
                                        <tr key={build.id} className="hover:bg-surface-light/50">
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                                        build.status === "COMPLETED"
                                                            ? "bg-green-500/10 text-green-400"
                                                            : build.status === "RUNNING"
                                                            ? "bg-yellow-500/10 text-yellow-400"
                                                            : "bg-red-500/10 text-red-400"
                                                    }`}
                                                >
                                                    {build.status === "RUNNING" && (
                                                        <span className="w-2 h-2 mr-1 rounded-full bg-yellow-400 animate-pulse" />
                                                    )}
                                                    {build.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-text-light text-sm">
                                                {startedAt.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-text-light text-sm">
                                                {duration !== null ? `${duration}s` : "-"}
                                            </td>
                                            <td className="px-4 py-3 text-white">
                                                {build.seedersCount ?? "-"}
                                            </td>
                                            <td className="px-4 py-3 text-white">
                                                {build.nodesCount?.toLocaleString() ?? "-"}
                                            </td>
                                            <td className="px-4 py-3 text-red-400 text-sm max-w-xs truncate">
                                                {build.errorMessage || "-"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

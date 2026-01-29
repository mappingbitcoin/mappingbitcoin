"use client";

import React, { useEffect, useState } from "react";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { Link } from "@/i18n/navigation";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    LineChart,
    Line,
} from "recharts";

interface AnalyticsData {
    summary: {
        totalNodes: number;
        seederCount: number;
        nonSeederCount: number;
        averages: {
            followedByDepth0: number;
            followedByDepth1: number;
            followedByDepth2: number;
            score: number;
        };
        maximums: {
            followedByDepth0: number;
            followedByDepth1: number;
            followedByDepth2: number;
            score: number;
        };
    };
    distributions: {
        byDepth: { depth: number; count: number }[];
        byScore: { bucket: string; count: number }[];
        bySeederFollowers: { bucket: string; count: number }[];
    };
    topUsers: {
        bySeederFollowers: TopUser[];
        byTotalFollowers: TopUser[];
        byScore: TopUser[];
    };
    buildHistory: BuildLog[];
}

interface TopUser {
    pubkey: string;
    pubkeyShort: string;
    followedByDepth0: number;
    followedByDepth1: number;
    followedByDepth2: number;
    totalTrustFollowers: number;
    score: number;
}

interface BuildLog {
    id: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
    seedersCount: number | null;
    nodesCount: number | null;
    errorMessage: string | null;
}

const COLORS = ["#f7931a", "#4ade80", "#60a5fa", "#f472b6", "#a78bfa", "#fbbf24"];

export default function GraphAnalyticsPage() {
    const { authToken } = useNostrAuth();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "users" | "history">("overview");

    useEffect(() => {
        const fetchData = async () => {
            if (!authToken) return;

            try {
                const response = await fetch("/api/admin/graph/analytics", {
                    headers: { Authorization: `Bearer ${authToken}` },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch analytics");
                }

                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load analytics");
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

    if (error || !data) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                {error || "No data available"}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Trust Graph Analytics</h1>
                    <p className="text-text-light mt-1">Visualizations and insights from the trust graph</p>
                </div>
                <Link
                    href="/admin/graph"
                    className="px-4 py-2 bg-surface-light hover:bg-border-light text-white rounded-lg transition-colors"
                >
                    Back to Graph
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface rounded-xl border border-border-light p-4">
                    <div className="text-sm text-text-light">Total Nodes</div>
                    <div className="text-2xl font-bold text-white">{data.summary.totalNodes.toLocaleString()}</div>
                </div>
                <div className="bg-surface rounded-xl border border-border-light p-4">
                    <div className="text-sm text-text-light">Seeders</div>
                    <div className="text-2xl font-bold text-primary">{data.summary.seederCount}</div>
                </div>
                <div className="bg-surface rounded-xl border border-border-light p-4">
                    <div className="text-sm text-text-light">Avg Score</div>
                    <div className="text-2xl font-bold text-green-400">{data.summary.averages.score.toFixed(3)}</div>
                </div>
                <div className="bg-surface rounded-xl border border-border-light p-4">
                    <div className="text-sm text-text-light">Avg Seeder Followers</div>
                    <div className="text-2xl font-bold text-blue-400">{data.summary.averages.followedByDepth0.toFixed(2)}</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border-light">
                <nav className="flex space-x-4">
                    {[
                        { id: "overview", label: "Overview" },
                        { id: "users", label: "Top Users" },
                        { id: "history", label: "Build History" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === tab.id
                                    ? "border-primary text-primary"
                                    : "border-transparent text-text-light hover:text-white"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Depth Distribution */}
                    <div className="bg-surface rounded-xl border border-border-light p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Distribution by Depth</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.distributions.byDepth}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis
                                    dataKey="depth"
                                    stroke="#888"
                                    tickFormatter={(v) => `Depth ${v}`}
                                />
                                <YAxis stroke="#888" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                                    labelFormatter={(v) => `Depth ${v}`}
                                />
                                <Bar dataKey="count" fill="#f7931a" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Score Distribution */}
                    <div className="bg-surface rounded-xl border border-border-light p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Score Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.distributions.byScore} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis type="number" stroke="#888" />
                                <YAxis dataKey="bucket" type="category" stroke="#888" width={80} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                                />
                                <Bar dataKey="count" fill="#4ade80" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Seeder Followers Distribution */}
                    <div className="bg-surface rounded-xl border border-border-light p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Users by Seeder Followers</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={data.distributions.bySeederFollowers}
                                    dataKey="count"
                                    nameKey="bucket"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                                    labelLine={false}
                                >
                                    {data.distributions.bySeederFollowers.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Averages & Maximums */}
                    <div className="bg-surface rounded-xl border border-border-light p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-text-light uppercase tracking-wider mb-2">Averages</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-text-light">Depth-0 Followers</span>
                                            <span className="text-white">{data.summary.averages.followedByDepth0.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-light">Depth-1 Followers</span>
                                            <span className="text-white">{data.summary.averages.followedByDepth1.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-light">Depth-2 Followers</span>
                                            <span className="text-white">{data.summary.averages.followedByDepth2.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-light">Score</span>
                                            <span className="text-white">{data.summary.averages.score.toFixed(4)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-text-light uppercase tracking-wider mb-2">Maximums</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-text-light">Depth-0 Followers</span>
                                            <span className="text-white">{data.summary.maximums.followedByDepth0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-light">Depth-1 Followers</span>
                                            <span className="text-white">{data.summary.maximums.followedByDepth1}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-light">Depth-2 Followers</span>
                                            <span className="text-white">{data.summary.maximums.followedByDepth2}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-light">Score</span>
                                            <span className="text-white">{data.summary.maximums.score.toFixed(4)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "users" && (
                <div className="space-y-6">
                    {/* Top by Seeder Followers */}
                    <div className="bg-surface rounded-xl border border-border-light p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Top Users by Seeder Followers</h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart
                                data={data.topUsers.bySeederFollowers.slice(0, 10)}
                                layout="vertical"
                                margin={{ left: 100 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis type="number" stroke="#888" />
                                <YAxis dataKey="pubkeyShort" type="category" stroke="#888" width={100} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                                    formatter={(value, name) => {
                                        const labels: Record<string, string> = {
                                            followedByDepth0: "Seeder Followers",
                                            followedByDepth1: "Depth-1 Followers",
                                            followedByDepth2: "Depth-2 Followers",
                                        };
                                        return [value, labels[name as string] || name];
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="followedByDepth0" stackId="a" fill="#f7931a" name="Seeders" />
                                <Bar dataKey="followedByDepth1" stackId="a" fill="#4ade80" name="Depth-1" />
                                <Bar dataKey="followedByDepth2" stackId="a" fill="#60a5fa" name="Depth-2" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Top Users Table */}
                    <div className="bg-surface rounded-xl border border-border-light overflow-hidden">
                        <div className="p-4 border-b border-border-light">
                            <h3 className="text-lg font-semibold text-white">Top 20 by Score</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-surface-light">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Pubkey</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-text-light uppercase tracking-wider">Depth-0</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-text-light uppercase tracking-wider">Depth-1</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-text-light uppercase tracking-wider">Depth-2</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-text-light uppercase tracking-wider">Total</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-text-light uppercase tracking-wider">Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light">
                                    {data.topUsers.byScore.map((user, index) => (
                                        <tr key={user.pubkey} className="hover:bg-surface-light">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-text-light">{index + 1}.</span>
                                                    <code className="text-sm text-white">{user.pubkeyShort}</code>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-primary font-medium">{user.followedByDepth0}</td>
                                            <td className="px-4 py-3 text-right text-green-400">{user.followedByDepth1}</td>
                                            <td className="px-4 py-3 text-right text-blue-400">{user.followedByDepth2}</td>
                                            <td className="px-4 py-3 text-right text-white">{user.totalTrustFollowers}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`font-medium ${user.score >= 0.5 ? "text-green-400" : user.score >= 0.2 ? "text-yellow-400" : "text-text-light"}`}>
                                                    {user.score.toFixed(4)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "history" && (
                <div className="space-y-6">
                    {/* Build History Chart */}
                    {data.buildHistory.length > 1 && (
                        <div className="bg-surface rounded-xl border border-border-light p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Nodes Over Time</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart
                                    data={data.buildHistory
                                        .filter((b) => b.status === "COMPLETED" && b.nodesCount)
                                        .reverse()
                                        .map((b) => ({
                                            date: new Date(b.startedAt).toLocaleDateString(),
                                            nodes: b.nodesCount,
                                            seeders: b.seedersCount,
                                        }))}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="date" stroke="#888" />
                                    <YAxis stroke="#888" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="nodes" stroke="#f7931a" strokeWidth={2} name="Total Nodes" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Build History Table */}
                    <div className="bg-surface rounded-xl border border-border-light overflow-hidden">
                        <div className="p-4 border-b border-border-light">
                            <h3 className="text-lg font-semibold text-white">Recent Builds</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-surface-light">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Started</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Completed</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-text-light uppercase tracking-wider">Seeders</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-text-light uppercase tracking-wider">Nodes</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Error</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light">
                                    {data.buildHistory.map((build) => (
                                        <tr key={build.id} className="hover:bg-surface-light">
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        build.status === "COMPLETED"
                                                            ? "bg-green-500/10 text-green-400"
                                                            : build.status === "RUNNING"
                                                            ? "bg-yellow-500/10 text-yellow-400"
                                                            : "bg-red-500/10 text-red-400"
                                                    }`}
                                                >
                                                    {build.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-text-light">
                                                {new Date(build.startedAt).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-text-light">
                                                {build.completedAt ? new Date(build.completedAt).toLocaleString() : "-"}
                                            </td>
                                            <td className="px-4 py-3 text-right text-white">{build.seedersCount ?? "-"}</td>
                                            <td className="px-4 py-3 text-right text-white">{build.nodesCount?.toLocaleString() ?? "-"}</td>
                                            <td className="px-4 py-3 text-sm text-red-400 truncate max-w-xs">
                                                {build.errorMessage || "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { PageSection } from "@/components/layout";
import {
    ChartBarIcon,
    GlobeIcon,
    FolderIcon,
    TrendingUpIcon,
    VerifiedBadgeIcon,
    SpinnerIcon,
} from "@/assets/icons/ui";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

interface MonthlyData {
    month: string;
    count: number;
    cumulative: number;
}

interface StatsData {
    totalMerchants: number;
    totalCountries: number;
    totalCategories: number;
    verifiedCount: number;
    topCountries: { name: string; count: number }[];
    topCategories: { name: string; count: number }[];
    monthlyGrowth: MonthlyData[];
    verifiedMonthlyGrowth: MonthlyData[];
}

function StatCard({
    label,
    value,
    icon,
    color = "accent",
}: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color?: "accent" | "green" | "blue" | "purple";
}) {
    const colorClasses = {
        accent: "bg-accent/10 text-accent",
        green: "bg-green-500/10 text-green-400",
        blue: "bg-blue-500/10 text-blue-400",
        purple: "bg-purple-500/10 text-purple-400",
    };

    return (
        <div className="bg-surface rounded-2xl border border-border-light p-6">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-text-light text-sm mb-2">{label}</p>
                    <p className="text-3xl font-bold text-white">
                        {typeof value === "number" ? value.toLocaleString() : value}
                    </p>
                </div>
                <div
                    className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center`}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}

function ChartCard({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-surface rounded-2xl border border-border-light p-6">
            <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
            {children}
        </div>
    );
}

function TopList({
    title,
    items,
    icon,
}: {
    title: string;
    items: { name: string; count: number }[];
    icon: React.ReactNode;
}) {
    const maxCount = items.length > 0 ? items[0].count : 0;

    return (
        <div className="bg-surface rounded-2xl border border-border-light p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    {icon}
                </div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>
            <div className="space-y-3">
                {items.map((item, index) => (
                    <div key={item.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-white flex items-center gap-2">
                                <span className="text-text-light w-5">{index + 1}.</span>
                                {item.name}
                            </span>
                            <span className="text-text-light font-medium">
                                {item.count.toLocaleString()}
                            </span>
                        </div>
                        <div className="h-1.5 bg-surface-light rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-500"
                                style={{ width: `${(item.count / maxCount) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Custom tooltip for charts
const CustomTooltip = ({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: { name: string; value: number; color: string }[];
    label?: string;
}) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-surface border border-border-light rounded-lg p-3 shadow-lg">
                <p className="text-white font-medium mb-1">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: {entry.value.toLocaleString()}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function StatsClient() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/stats/detailed");
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Failed to fetch stats");
                }

                setStats(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load stats");
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    if (loading) {
        return (
            <PageSection padding="large" background="gradient" className="min-h-screen">
                <div className="flex items-center justify-center py-20">
                    <SpinnerIcon className="w-8 h-8 text-accent animate-spin" />
                </div>
            </PageSection>
        );
    }

    if (error || !stats) {
        return (
            <PageSection padding="large" background="gradient" className="min-h-screen">
                <div className="max-w-container mx-auto">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                        <p className="text-red-400">{error || "Failed to load stats"}</p>
                    </div>
                </div>
            </PageSection>
        );
    }

    // Combine growth data for the chart
    const combinedGrowthData = stats.monthlyGrowth.map((item, index) => ({
        month: item.month,
        merchants: item.cumulative,
        verified: stats.verifiedMonthlyGrowth[index]?.cumulative || 0,
        newMerchants: item.count,
        newVerified: stats.verifiedMonthlyGrowth[index]?.count || 0,
    }));

    return (
        <PageSection padding="large" background="gradient" className="min-h-screen">
            <div className="max-w-container mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                            <ChartBarIcon className="w-6 h-6 text-accent" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white">
                            Bitcoin Merchant Statistics
                        </h1>
                    </div>
                    <p className="text-lg text-text-light max-w-2xl">
                        Explore the growth of Bitcoin adoption worldwide. Track merchants,
                        verified businesses, and discover where Bitcoin is being accepted.
                    </p>
                </div>

                {/* Key Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        label="Total Merchants"
                        value={stats.totalMerchants}
                        icon={<ChartBarIcon className="w-6 h-6" />}
                        color="accent"
                    />
                    <StatCard
                        label="Countries"
                        value={stats.totalCountries}
                        icon={<GlobeIcon className="w-6 h-6" />}
                        color="blue"
                    />
                    <StatCard
                        label="Categories"
                        value={stats.totalCategories}
                        icon={<FolderIcon className="w-6 h-6" />}
                        color="purple"
                    />
                    <StatCard
                        label="Verified Businesses"
                        value={stats.verifiedCount}
                        icon={<VerifiedBadgeIcon className="w-6 h-6" />}
                        color="green"
                    />
                </div>

                {/* Growth Chart */}
                <ChartCard title="Merchant Growth Over Time">
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={combinedGrowthData}>
                                <defs>
                                    <linearGradient id="merchantGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F7931A" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#F7931A" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="verifiedGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                                <XAxis
                                    dataKey="month"
                                    stroke="#718096"
                                    fontSize={12}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="#718096"
                                    fontSize={12}
                                    tickLine={false}
                                    tickFormatter={(value) => value.toLocaleString()}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    wrapperStyle={{ paddingTop: "20px" }}
                                    formatter={(value) => (
                                        <span className="text-text-light text-sm">{value}</span>
                                    )}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="merchants"
                                    name="Total Merchants"
                                    stroke="#F7931A"
                                    strokeWidth={2}
                                    fill="url(#merchantGradient)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="verified"
                                    name="Verified Businesses"
                                    stroke="#22C55E"
                                    strokeWidth={2}
                                    fill="url(#verifiedGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                {/* Monthly New Additions */}
                <div className="mt-8">
                    <ChartCard title="Monthly New Additions">
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={combinedGrowthData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                                    <XAxis
                                        dataKey="month"
                                        stroke="#718096"
                                        fontSize={12}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        stroke="#718096"
                                        fontSize={12}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        wrapperStyle={{ paddingTop: "20px" }}
                                        formatter={(value) => (
                                            <span className="text-text-light text-sm">{value}</span>
                                        )}
                                    />
                                    <Bar
                                        dataKey="newMerchants"
                                        name="New Merchants"
                                        fill="#F7931A"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="newVerified"
                                        name="New Verified"
                                        fill="#22C55E"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>
                </div>

                {/* Top Lists */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                    <TopList
                        title="Top Countries"
                        items={stats.topCountries}
                        icon={<GlobeIcon className="w-5 h-5 text-accent" />}
                    />
                    <TopList
                        title="Top Categories"
                        items={stats.topCategories}
                        icon={<FolderIcon className="w-5 h-5 text-accent" />}
                    />
                </div>

                {/* Footer Note */}
                <div className="mt-12 text-center">
                    <p className="text-text-light text-sm">
                        Data sourced from OpenStreetMap. Updated hourly.
                    </p>
                </div>
            </div>
        </PageSection>
    );
}

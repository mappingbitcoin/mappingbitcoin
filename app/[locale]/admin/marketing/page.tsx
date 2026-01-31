"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import GuidelinesTab from "./components/GuidelinesTab";
import LinksTab from "./components/LinksTab";
import AssetsTab from "./components/AssetsTab";
import HashtagsTab from "./components/HashtagsTab";
import ExamplePostsTab from "./components/ExamplePostsTab";
import StatsTab from "./components/StatsTab";
import GenerationConfigTab from "./components/GenerationConfigTab";
import {
    DocumentIcon,
    LinkIcon,
    PhotoIcon,
    HashtagIcon,
    ChatIcon,
    ChartBarIcon,
    CalendarIcon,
    QueueIcon,
    EyeIcon,
    ArrowLeftIcon,
    BoltIcon,
} from "@/assets/icons/ui";

// Main sections
type SectionId = "seeder" | "calendar" | "queue" | "review" | "preview";

interface Section {
    id: SectionId;
    label: string;
    icon: React.ReactNode;
    disabled?: boolean;
}

const sections: Section[] = [
    { id: "seeder", label: "Content Seeder", icon: <DocumentIcon className="w-4 h-4" /> },
    { id: "calendar", label: "Calendar", icon: <CalendarIcon className="w-4 h-4" />, disabled: true },
    { id: "queue", label: "Generated Queue", icon: <QueueIcon className="w-4 h-4" />, disabled: true },
    { id: "review", label: "Review Index", icon: <ChatIcon className="w-4 h-4" />, disabled: true },
    { id: "preview", label: "Content Preview", icon: <EyeIcon className="w-4 h-4" />, disabled: true },
];

// Seeder modules
type SeederModuleId = "guidelines" | "links" | "assets" | "hashtags" | "posts" | "stats" | "generation" | null;

interface SeederModule {
    id: Exclude<SeederModuleId, null>;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

const seederModules: SeederModule[] = [
    { id: "guidelines", label: "Guidelines", description: "Brand voice, do's & don'ts", icon: <DocumentIcon className="w-6 h-6" />, color: "blue" },
    { id: "links", label: "Links", description: "Marketing link library", icon: <LinkIcon className="w-6 h-6" />, color: "green" },
    { id: "assets", label: "Assets", description: "Images, videos & files", icon: <PhotoIcon className="w-6 h-6" />, color: "purple" },
    { id: "hashtags", label: "Hashtags", description: "Hashtag sets by network", icon: <HashtagIcon className="w-6 h-6" />, color: "pink" },
    { id: "posts", label: "Example Posts", description: "Sample content templates", icon: <ChatIcon className="w-6 h-6" />, color: "orange" },
    { id: "stats", label: "Stats & Facts", description: "Key metrics & data points", icon: <ChartBarIcon className="w-6 h-6" />, color: "cyan" },
    { id: "generation", label: "Generation Config", description: "n8n automation settings", icon: <BoltIcon className="w-6 h-6" />, color: "yellow" },
];

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
    green: { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
    pink: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/30" },
    orange: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
    cyan: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
    yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30" },
};

interface SeederStats {
    guidelines: { voiceTone: boolean; doCount: number; dontCount: number; valuesCount: number };
    links: number;
    assets: number;
    hashtags: number;
    posts: number;
    stats: number;
}

export default function MarketingPage() {
    const t = useTranslations("admin.marketing");
    const { authToken } = useNostrAuth();
    const [activeSection, setActiveSection] = useState<SectionId>("seeder");
    const [activeModule, setActiveModule] = useState<SeederModuleId>(null);
    const [seederStats, setSeederStats] = useState<SeederStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);

    const fetchSeederStats = useCallback(async () => {
        if (!authToken) return;

        try {
            const [guidelinesRes, linksRes, assetsRes, hashtagsRes, postsRes, statsRes] = await Promise.all([
                fetch("/api/admin/marketing/guidelines", { headers: { Authorization: `Bearer ${authToken}` } }),
                fetch("/api/admin/marketing/links", { headers: { Authorization: `Bearer ${authToken}` } }),
                fetch("/api/admin/marketing/assets", { headers: { Authorization: `Bearer ${authToken}` } }),
                fetch("/api/admin/marketing/hashtags", { headers: { Authorization: `Bearer ${authToken}` } }),
                fetch("/api/admin/marketing/posts", { headers: { Authorization: `Bearer ${authToken}` } }),
                fetch("/api/admin/marketing/stats", { headers: { Authorization: `Bearer ${authToken}` } }),
            ]);

            const [guidelines, links, assets, hashtags, posts, stats] = await Promise.all([
                guidelinesRes.ok ? guidelinesRes.json() : null,
                linksRes.ok ? linksRes.json() : { links: [] },
                assetsRes.ok ? assetsRes.json() : { assets: [] },
                hashtagsRes.ok ? hashtagsRes.json() : { hashtagSets: [] },
                postsRes.ok ? postsRes.json() : { posts: [] },
                statsRes.ok ? statsRes.json() : { stats: [] },
            ]);

            setSeederStats({
                guidelines: {
                    voiceTone: !!guidelines?.guidelines?.voiceTone,
                    doCount: guidelines?.guidelines?.doList?.length || 0,
                    dontCount: guidelines?.guidelines?.dontList?.length || 0,
                    valuesCount: guidelines?.guidelines?.brandValues?.length || 0,
                },
                links: links.links?.length || 0,
                assets: assets.assets?.length || 0,
                hashtags: hashtags.hashtagSets?.length || 0,
                posts: posts.posts?.length || 0,
                stats: stats.stats?.length || 0,
            });
        } catch (error) {
            console.error("Failed to fetch seeder stats:", error);
        } finally {
            setLoadingStats(false);
        }
    }, [authToken]);

    useEffect(() => {
        if (activeSection === "seeder" && !activeModule) {
            fetchSeederStats();
        }
    }, [activeSection, activeModule, fetchSeederStats]);

    const getStatValue = (moduleId: SeederModule["id"]): string => {
        if (!seederStats) return "—";
        switch (moduleId) {
            case "guidelines":
                const g = seederStats.guidelines;
                const total = g.doCount + g.dontCount + g.valuesCount + (g.voiceTone ? 1 : 0);
                return total > 0 ? t("stats.items", { count: total }) : t("stats.notSet");
            case "links":
                return seederStats.links > 0 ? t("stats.links", { count: seederStats.links }) : t("stats.empty");
            case "assets":
                return seederStats.assets > 0 ? t("stats.files", { count: seederStats.assets }) : t("stats.empty");
            case "hashtags":
                return seederStats.hashtags > 0 ? t("stats.sets", { count: seederStats.hashtags }) : t("stats.empty");
            case "posts":
                return seederStats.posts > 0 ? t("stats.examples", { count: seederStats.posts }) : t("stats.empty");
            case "stats":
                return seederStats.stats > 0 ? t("stats.facts", { count: seederStats.stats }) : t("stats.empty");
            case "generation":
                return t("stats.configured");
            default:
                return "—";
        }
    };

    const renderModuleContent = () => {
        switch (activeModule) {
            case "guidelines":
                return <GuidelinesTab />;
            case "links":
                return <LinksTab />;
            case "assets":
                return <AssetsTab />;
            case "hashtags":
                return <HashtagsTab />;
            case "posts":
                return <ExamplePostsTab />;
            case "stats":
                return <StatsTab />;
            case "generation":
                return <GenerationConfigTab />;
            default:
                return null;
        }
    };

    const renderSeederDashboard = () => (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {seederModules.map((module) => {
                const colors = colorClasses[module.color];
                return (
                    <button
                        key={module.id}
                        onClick={() => setActiveModule(module.id)}
                        className={`
                            group p-5 rounded-xl border transition-all text-left
                            bg-surface hover:bg-surface-light border-border-light hover:${colors.border}
                        `}
                    >
                        <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center mb-3`}>
                            <span className={colors.text}>{module.icon}</span>
                        </div>
                        <h3 className="text-white font-medium mb-1">{t(`modules.${module.id}.label`)}</h3>
                        <p className="text-xs text-text-light mb-3">{t(`modules.${module.id}.description`)}</p>
                        <div className={`text-sm font-medium ${colors.text}`}>
                            {loadingStats ? (
                                <span className="text-text-light">{t("common.loading")}</span>
                            ) : (
                                getStatValue(module.id)
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );

    const renderSeederContent = () => {
        if (activeModule) {
            return (
                <div className="space-y-4">
                    {/* Back header */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                setActiveModule(null);
                                fetchSeederStats(); // Refresh stats when going back
                            }}
                            className="flex items-center gap-2 text-text-light hover:text-white transition-colors"
                        >
                            <ArrowLeftIcon className="w-4 h-4" />
                            <span className="text-sm">{t("common.back")}</span>
                        </button>
                        <div className="h-4 w-px bg-border-light" />
                        <h2 className="text-lg font-semibold text-white">{t(`modules.${activeModule}.label`)}</h2>
                    </div>

                    {/* Module content */}
                    {renderModuleContent()}
                </div>
            );
        }

        return renderSeederDashboard();
    };

    const renderSectionContent = () => {
        switch (activeSection) {
            case "seeder":
                return renderSeederContent();
            case "calendar":
            case "queue":
            case "review":
            case "preview":
                return <ComingSoonPlaceholder section={sections.find((s) => s.id === activeSection)!} t={t} />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
                <p className="text-text-light text-sm mt-1">
                    {t("description")}
                </p>
            </div>

            {/* Section Tabs */}
            <div className="border-b border-border-light">
                <nav className="flex gap-1" aria-label="Sections">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => {
                                if (!section.disabled) {
                                    setActiveSection(section.id);
                                    setActiveModule(null);
                                }
                            }}
                            disabled={section.disabled}
                            className={`
                                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors
                                ${activeSection === section.id
                                    ? "border-accent text-accent"
                                    : section.disabled
                                        ? "border-transparent text-text-light/40 cursor-not-allowed"
                                        : "border-transparent text-text-light hover:text-white hover:border-border-light"
                                }
                            `}
                        >
                            {section.icon}
                            <span>{t(`sections.${section.id}`)}</span>
                            {section.disabled && (
                                <span className="px-1.5 py-0.5 text-[10px] bg-surface-light rounded text-text-light/60">
                                    {t("common.soon")}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            <div>{renderSectionContent()}</div>
        </div>
    );
}

function ComingSoonPlaceholder({ section, t }: { section: Section; t: (key: string) => string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-8 bg-surface rounded-xl border border-border-light border-dashed">
            <div className="w-14 h-14 rounded-full bg-surface-light flex items-center justify-center mb-4">
                {section.icon}
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{t(`sections.${section.id}`)}</h3>
            <p className="text-sm text-text-light text-center max-w-md mb-4">
                {t("common.comingSoonDescription")}
            </p>
            <span className="px-3 py-1 text-xs bg-accent/10 text-accent rounded-full">
                {t("common.comingSoon")}
            </span>
        </div>
    );
}

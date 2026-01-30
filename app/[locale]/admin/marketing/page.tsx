"use client";

import React, { useState } from "react";
import GuidelinesTab from "./components/GuidelinesTab";
import LinksTab from "./components/LinksTab";
import AssetsTab from "./components/AssetsTab";
import HashtagsTab from "./components/HashtagsTab";
import ExamplePostsTab from "./components/ExamplePostsTab";
import StatsTab from "./components/StatsTab";
import { DocumentIcon, LinkIcon, PhotoIcon, HashtagIcon, ChatIcon, ChartBarIcon } from "@/assets/icons/ui";

type TabId = "guidelines" | "links" | "assets" | "hashtags" | "posts" | "stats";

interface Tab {
    id: TabId;
    label: string;
    icon: React.ReactNode;
}

const tabs: Tab[] = [
    {
        id: "guidelines",
        label: "Voice & Guidelines",
        icon: <DocumentIcon className="w-4 h-4" />,
    },
    {
        id: "links",
        label: "Link Library",
        icon: <LinkIcon className="w-4 h-4" />,
    },
    {
        id: "assets",
        label: "Asset Library",
        icon: <PhotoIcon className="w-4 h-4" />,
    },
    {
        id: "hashtags",
        label: "Hashtag Sets",
        icon: <HashtagIcon className="w-4 h-4" />,
    },
    {
        id: "posts",
        label: "Example Posts",
        icon: <ChatIcon className="w-4 h-4" />,
    },
    {
        id: "stats",
        label: "Stats & Facts",
        icon: <ChartBarIcon className="w-4 h-4" />,
    },
];

export default function MarketingPage() {
    const [activeTab, setActiveTab] = useState<TabId>("guidelines");

    const renderTabContent = () => {
        switch (activeTab) {
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
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Marketing Content Seeder</h1>
                <p className="text-text-light mt-1">
                    Manage brand content for n8n automation and social media distribution
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-border-light">
                <nav className="-mb-px flex space-x-1 overflow-x-auto" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap
                                border-b-2 transition-colors
                                ${activeTab === tab.id
                                    ? "border-accent text-accent"
                                    : "border-transparent text-text-light hover:text-white hover:border-border-light"
                                }
                            `}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div>{renderTabContent()}</div>
        </div>
    );
}

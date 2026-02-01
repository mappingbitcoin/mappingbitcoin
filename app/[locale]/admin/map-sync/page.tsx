"use client";

import { useState } from "react";
import { RefreshIcon } from "@/assets/icons/ui";
import TabButton from "@/components/ui/TabButton";
import StatsTab from "./components/StatsTab";
import ToolsTab from "./components/ToolsTab";

type TabType = "stats" | "tools";

const tabs: { id: TabType; label: string }[] = [
    { id: "stats", label: "Stats" },
    { id: "tools", label: "Tools" },
];

export default function MapSyncPage() {
    const [activeTab, setActiveTab] = useState<TabType>("stats");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <RefreshIcon className="w-6 h-6 text-accent" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Map Sync</h1>
                    <p className="text-text-light text-sm">
                        Monitor OSM synchronization and manage venue data
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border-light">
                <nav className="flex">
                    {tabs.map((tab) => (
                        <TabButton
                            key={tab.id}
                            active={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="flex-none"
                        >
                            {tab.label}
                        </TabButton>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === "stats" && <StatsTab />}
                {activeTab === "tools" && <ToolsTab />}
            </div>
        </div>
    );
}

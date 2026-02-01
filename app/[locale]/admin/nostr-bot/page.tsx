"use client";

import { useState } from "react";
import { NostrIcon } from "@/assets/icons/social";
import TabButton from "@/components/ui/TabButton";
import ProfileTab from "./components/ProfileTab";
import WallTab from "./components/WallTab";
import PostTab from "./components/PostTab";

type TabType = "profile" | "wall" | "post";

const tabs: { id: TabType; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "wall", label: "Wall" },
    { id: "post", label: "New Post" },
];

export default function NostrBotPage() {
    const [activeTab, setActiveTab] = useState<TabType>("profile");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <NostrIcon className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Nostr Bot</h1>
                    <p className="text-text-light text-sm">
                        Manage the Mapping Bitcoin bot profile and posts
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
                {activeTab === "profile" && <ProfileTab />}
                {activeTab === "wall" && <WallTab />}
                {activeTab === "post" && <PostTab />}
            </div>
        </div>
    );
}

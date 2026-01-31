"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import type { GenerationConfig } from "../types";
import {
    PLATFORMS,
    PLATFORM_LABELS,
    CONTENT_MIX_TYPES,
    CONTENT_MIX_LABELS,
    DAYS_OF_WEEK,
    DAY_LABELS,
    AI_MODELS,
    AI_MODEL_LABELS,
} from "../types";
import { BoltIcon, RefreshIcon, CheckmarkIcon, CloseIcon } from "@/assets/icons/ui";

export default function GenerationConfigTab() {
    const t = useTranslations("admin.marketing");
    const { authToken } = useNostrAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [triggering, setTriggering] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Default values (matches API defaults)
    const defaultPostsPerPlatform = { x: 20, nostr: 15, instagram: 10 };
    const defaultContentMixWeights = { venue_spotlight: 40, education: 30, stats: 20, community: 10 };
    const defaultPostsPerDay = { x: 2, nostr: 1, instagram: 1 };
    const defaultActiveDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

    // Form state with defaults
    const [postsPerPlatform, setPostsPerPlatform] = useState<Record<string, number>>(defaultPostsPerPlatform);
    const [contentMixWeights, setContentMixWeights] = useState<Record<string, number>>(defaultContentMixWeights);
    const [generateImages, setGenerateImages] = useState(false);
    const [aiModel, setAiModel] = useState<"sonnet" | "opus">("sonnet");
    const [postsPerDay, setPostsPerDay] = useState<Record<string, number>>(defaultPostsPerDay);
    const [activeHoursStart, setActiveHoursStart] = useState("12:00");
    const [activeHoursEnd, setActiveHoursEnd] = useState("22:00");
    const [timezone, setTimezone] = useState("UTC");
    const [activeDays, setActiveDays] = useState<string[]>(defaultActiveDays);
    const [webhookUrl, setWebhookUrl] = useState("");
    const [webhookSecret, setWebhookSecret] = useState("");
    const [lastTriggeredAt, setLastTriggeredAt] = useState<string | null>(null);

    const fetchConfig = useCallback(async () => {
        if (!authToken) return;

        try {
            const response = await fetch("/api/admin/marketing/generation-config", {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch config");
            }

            const data = await response.json();
            const config: GenerationConfig = data.config;

            setPostsPerPlatform(config.postsPerPlatform && Object.keys(config.postsPerPlatform).length > 0 ? config.postsPerPlatform : defaultPostsPerPlatform);
            setContentMixWeights(config.contentMixWeights && Object.keys(config.contentMixWeights).length > 0 ? config.contentMixWeights : defaultContentMixWeights);
            setGenerateImages(config.generateImages ?? false);
            setAiModel(config.aiModel || "sonnet");
            setPostsPerDay(config.postsPerDay && Object.keys(config.postsPerDay).length > 0 ? config.postsPerDay : defaultPostsPerDay);
            setActiveHoursStart(config.activeHoursStart || "12:00");
            setActiveHoursEnd(config.activeHoursEnd || "22:00");
            setTimezone(config.timezone || "UTC");
            setActiveDays(config.activeDays && config.activeDays.length > 0 ? config.activeDays : defaultActiveDays);
            setWebhookUrl(config.webhookUrl || "");
            setWebhookSecret(config.webhookSecret || "");
            setLastTriggeredAt(config.lastTriggeredAt);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load config");
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const handleSave = async () => {
        if (!authToken) return;

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch("/api/admin/marketing/generation-config", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    postsPerPlatform,
                    contentMixWeights,
                    generateImages,
                    aiModel,
                    postsPerDay,
                    activeHoursStart,
                    activeHoursEnd,
                    timezone,
                    activeDays,
                    webhookUrl: webhookUrl || null,
                    webhookSecret: webhookSecret || null,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to save config");
            }

            setSuccess("Configuration saved successfully");
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save config");
        } finally {
            setSaving(false);
        }
    };

    const handleTrigger = async () => {
        if (!authToken) return;

        setTriggering(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch("/api/admin/marketing/generation-config/trigger", {
                method: "POST",
                headers: { Authorization: `Bearer ${authToken}` },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to trigger webhook");
            }

            setLastTriggeredAt(new Date().toISOString());
            setSuccess(`Webhook triggered! Sent ${data.payloadSummary.links} links, ${data.payloadSummary.assets} assets, ${data.payloadSummary.examplePosts} example posts`);
            setTimeout(() => setSuccess(null), 5000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to trigger webhook");
        } finally {
            setTriggering(false);
        }
    };

    const toggleDay = (day: string) => {
        if (activeDays.includes(day)) {
            setActiveDays(activeDays.filter((d) => d !== day));
        } else {
            setActiveDays([...activeDays, day]);
        }
    };

    const updatePlatformValue = (
        setter: React.Dispatch<React.SetStateAction<Record<string, number>>>,
        platform: string,
        value: number
    ) => {
        setter((prev) => ({ ...prev, [platform]: value }));
    };

    // Calculate total content mix weight
    const totalWeight = Object.values(contentMixWeights).reduce((sum, w) => sum + (w || 0), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Messages */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
                    <CloseIcon className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm flex items-center gap-2">
                    <CheckmarkIcon className="w-4 h-4 flex-shrink-0" />
                    {success}
                </div>
            )}

            {/* Generation Config */}
            <div className="bg-surface rounded-lg border border-border-light p-5">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <BoltIcon className="w-5 h-5 text-accent" />
                    Generation Config
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Posts per Platform per Cycle */}
                    <div>
                        <label className="block text-sm text-text-light mb-2">Posts per Platform (per cycle)</label>
                        <div className="space-y-2">
                            {PLATFORMS.map((platform) => (
                                <div key={platform} className="flex items-center gap-3">
                                    <span className="text-white text-sm w-24">{PLATFORM_LABELS[platform]}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={postsPerPlatform[platform] || 0}
                                        onChange={(e) => updatePlatformValue(setPostsPerPlatform, platform, parseInt(e.target.value) || 0)}
                                        className="w-20 px-3 py-1.5 bg-surface-light border border-border-light rounded-lg text-white text-sm focus:outline-none focus:border-accent"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Content Mix Weights */}
                    <div>
                        <label className="block text-sm text-text-light mb-2">
                            Content Mix Weights
                            <span className={`ml-2 ${totalWeight === 100 ? "text-green-400" : "text-amber-400"}`}>
                                (Total: {totalWeight}%)
                            </span>
                        </label>
                        <div className="space-y-2">
                            {CONTENT_MIX_TYPES.map((type) => (
                                <div key={type} className="flex items-center gap-3">
                                    <span className="text-white text-sm w-32">{CONTENT_MIX_LABELS[type]}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={contentMixWeights[type] || 0}
                                        onChange={(e) => updatePlatformValue(setContentMixWeights, type, parseInt(e.target.value) || 0)}
                                        className="w-20 px-3 py-1.5 bg-surface-light border border-border-light rounded-lg text-white text-sm focus:outline-none focus:border-accent"
                                    />
                                    <span className="text-text-light text-sm">%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Generate Images */}
                    <div>
                        <label className="block text-sm text-text-light mb-2">Generate Images</label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={generateImages}
                                onChange={(e) => setGenerateImages(e.target.checked)}
                                className="w-5 h-5 rounded border-border-light bg-surface-light text-accent focus:ring-accent"
                            />
                            <span className="text-white text-sm">Enable AI image generation</span>
                        </label>
                    </div>

                    {/* AI Model */}
                    <div>
                        <label className="block text-sm text-text-light mb-2">AI Model</label>
                        <div className="flex gap-3">
                            {AI_MODELS.map((model) => (
                                <button
                                    key={model}
                                    onClick={() => setAiModel(model)}
                                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                                        aiModel === model
                                            ? "bg-accent text-white"
                                            : "bg-surface-light text-text-light hover:text-white"
                                    }`}
                                >
                                    {AI_MODEL_LABELS[model]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Scheduling Config */}
            <div className="bg-surface rounded-lg border border-border-light p-5">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <RefreshIcon className="w-5 h-5 text-accent" />
                    Scheduling Config
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Posts per Day */}
                    <div>
                        <label className="block text-sm text-text-light mb-2">Posts per Day (per platform)</label>
                        <div className="space-y-2">
                            {PLATFORMS.map((platform) => (
                                <div key={platform} className="flex items-center gap-3">
                                    <span className="text-white text-sm w-24">{PLATFORM_LABELS[platform]}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="24"
                                        value={postsPerDay[platform] || 0}
                                        onChange={(e) => updatePlatformValue(setPostsPerDay, platform, parseInt(e.target.value) || 0)}
                                        className="w-20 px-3 py-1.5 bg-surface-light border border-border-light rounded-lg text-white text-sm focus:outline-none focus:border-accent"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Active Hours */}
                    <div>
                        <label className="block text-sm text-text-light mb-2">Active Hours</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="time"
                                value={activeHoursStart}
                                onChange={(e) => setActiveHoursStart(e.target.value)}
                                className="px-3 py-1.5 bg-surface-light border border-border-light rounded-lg text-white text-sm focus:outline-none focus:border-accent"
                            />
                            <span className="text-text-light">to</span>
                            <input
                                type="time"
                                value={activeHoursEnd}
                                onChange={(e) => setActiveHoursEnd(e.target.value)}
                                className="px-3 py-1.5 bg-surface-light border border-border-light rounded-lg text-white text-sm focus:outline-none focus:border-accent"
                            />
                        </div>
                        <div className="mt-3">
                            <label className="block text-sm text-text-light mb-1">Timezone</label>
                            <input
                                type="text"
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                                placeholder="UTC"
                                className="w-full px-3 py-1.5 bg-surface-light border border-border-light rounded-lg text-white text-sm focus:outline-none focus:border-accent"
                            />
                        </div>
                    </div>

                    {/* Active Days */}
                    <div className="lg:col-span-2">
                        <label className="block text-sm text-text-light mb-2">Active Days</label>
                        <div className="flex flex-wrap gap-2">
                            {DAYS_OF_WEEK.map((day) => (
                                <button
                                    key={day}
                                    onClick={() => toggleDay(day)}
                                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                                        activeDays.includes(day)
                                            ? "bg-accent text-white"
                                            : "bg-surface-light text-text-light hover:text-white"
                                    }`}
                                >
                                    {DAY_LABELS[day]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Webhook Config */}
            <div className="bg-surface rounded-lg border border-border-light p-5">
                <h3 className="text-white font-semibold mb-4">n8n Webhook</h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-text-light mb-1">Webhook URL</label>
                        <input
                            type="url"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            placeholder="https://your-n8n-instance.com/webhook/..."
                            className="w-full px-3 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light/50 text-sm focus:outline-none focus:border-accent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-text-light mb-1">Webhook Secret (optional)</label>
                        <input
                            type="password"
                            value={webhookSecret}
                            onChange={(e) => setWebhookSecret(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-3 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light/50 text-sm focus:outline-none focus:border-accent"
                        />
                    </div>
                </div>

                {lastTriggeredAt && (
                    <p className="text-xs text-text-light mt-3">
                        Last triggered: {new Date(lastTriggeredAt).toLocaleString()}
                    </p>
                )}

                <div className="mt-4">
                    <button
                        onClick={handleTrigger}
                        disabled={triggering || !webhookUrl}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
                    >
                        {triggering ? "Triggering..." : "Trigger Webhook Now"}
                    </button>
                    <p className="text-xs text-text-light mt-2">
                        This will send all seed content (guidelines, links, assets, hashtags, example posts, stats) to the webhook.
                    </p>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-accent hover:bg-accent-light disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
                >
                    {saving ? "Saving..." : "Save Configuration"}
                </button>
            </div>
        </div>
    );
}

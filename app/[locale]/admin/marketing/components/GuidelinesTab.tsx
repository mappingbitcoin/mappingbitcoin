"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import type { MarketingGuidelines } from "../types";
import { CheckmarkIcon, CloseIcon, StarIcon } from "@/assets/icons/ui";

export default function GuidelinesTab() {
    const { authToken } = useNostrAuth();
    const [guidelines, setGuidelines] = useState<MarketingGuidelines | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form state
    const [voiceTone, setVoiceTone] = useState("");
    const [doList, setDoList] = useState<string[]>([]);
    const [dontList, setDontList] = useState<string[]>([]);
    const [brandValues, setBrandValues] = useState<string[]>([]);

    // New item inputs
    const [newDo, setNewDo] = useState("");
    const [newDont, setNewDont] = useState("");
    const [newValue, setNewValue] = useState("");

    const fetchGuidelines = useCallback(async () => {
        if (!authToken) return;

        try {
            const response = await fetch("/api/admin/marketing/guidelines", {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch guidelines");
            }

            const data = await response.json();
            if (data.guidelines) {
                setGuidelines(data.guidelines);
                setVoiceTone(data.guidelines.voiceTone || "");
                setDoList(data.guidelines.doList || []);
                setDontList(data.guidelines.dontList || []);
                setBrandValues(data.guidelines.brandValues || []);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load guidelines");
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        fetchGuidelines();
    }, [fetchGuidelines]);

    const handleSave = async () => {
        if (!authToken) return;

        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await fetch("/api/admin/marketing/guidelines", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    voiceTone: voiceTone || null,
                    doList,
                    dontList,
                    brandValues,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to save guidelines");
            }

            const data = await response.json();
            setGuidelines(data.guidelines);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save guidelines");
        } finally {
            setSaving(false);
        }
    };

    const addItem = (list: string[], setList: (items: string[]) => void, value: string, setValue: (v: string) => void) => {
        if (value.trim()) {
            setList([...list, value.trim()]);
            setValue("");
        }
    };

    const removeItem = (list: string[], setList: (items: string[]) => void, index: number) => {
        setList(list.filter((_, i) => i !== index));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-green-400">
                    Guidelines saved successfully!
                </div>
            )}

            {/* Voice & Tone */}
            <div className="bg-surface rounded-xl border border-border-light p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Brand Voice & Tone</h3>
                <textarea
                    value={voiceTone}
                    onChange={(e) => setVoiceTone(e.target.value)}
                    placeholder="Describe your brand's voice and tone. For example: 'Professional yet approachable, technical but accessible. We speak with authority on Bitcoin topics while remaining welcoming to newcomers.'"
                    rows={4}
                    className="w-full px-4 py-3 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary resize-none"
                />
            </div>

            {/* Do List */}
            <div className="bg-surface rounded-xl border border-border-light p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <CheckmarkIcon className="w-5 h-5 text-green-400" />
                    Do This
                </h3>
                <div className="space-y-3">
                    {doList.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <span className="flex-1 px-3 py-2 bg-surface-light rounded-lg text-white text-sm">
                                {item}
                            </span>
                            <button
                                onClick={() => removeItem(doList, setDoList, index)}
                                className="p-2 text-text-light hover:text-red-400 transition-colors"
                            >
                                <CloseIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newDo}
                            onChange={(e) => setNewDo(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addItem(doList, setDoList, newDo, setNewDo)}
                            placeholder="Add a 'do' guideline..."
                            className="flex-1 px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary text-sm"
                        />
                        <button
                            onClick={() => addItem(doList, setDoList, newDo, setNewDo)}
                            className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>

            {/* Don't List */}
            <div className="bg-surface rounded-xl border border-border-light p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <CloseIcon className="w-5 h-5 text-red-400" />
                    Don&apos;t Do This
                </h3>
                <div className="space-y-3">
                    {dontList.map((item, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <span className="flex-1 px-3 py-2 bg-surface-light rounded-lg text-white text-sm">
                                {item}
                            </span>
                            <button
                                onClick={() => removeItem(dontList, setDontList, index)}
                                className="p-2 text-text-light hover:text-red-400 transition-colors"
                            >
                                <CloseIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newDont}
                            onChange={(e) => setNewDont(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addItem(dontList, setDontList, newDont, setNewDont)}
                            placeholder="Add a 'don't' guideline..."
                            className="flex-1 px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary text-sm"
                        />
                        <button
                            onClick={() => addItem(dontList, setDontList, newDont, setNewDont)}
                            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>

            {/* Brand Values */}
            <div className="bg-surface rounded-xl border border-border-light p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <StarIcon className="w-5 h-5 text-primary" />
                    Brand Values
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                    {brandValues.map((value, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm"
                        >
                            {value}
                            <button
                                onClick={() => removeItem(brandValues, setBrandValues, index)}
                                className="hover:text-red-400 transition-colors"
                            >
                                <CloseIcon className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addItem(brandValues, setBrandValues, newValue, setNewValue)}
                        placeholder="Add a brand value..."
                        className="flex-1 px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary text-sm"
                    />
                    <button
                        onClick={() => addItem(brandValues, setBrandValues, newValue, setNewValue)}
                        className="px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors text-sm"
                    >
                        Add
                    </button>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-primary hover:bg-primary-light text-white rounded-lg transition-colors disabled:opacity-50"
                >
                    {saving ? "Saving..." : "Save Guidelines"}
                </button>
            </div>

            {/* Last Updated */}
            {guidelines && (
                <p className="text-sm text-text-light text-right">
                    Last updated: {new Date(guidelines.updatedAt).toLocaleString()}
                </p>
            )}
        </div>
    );
}

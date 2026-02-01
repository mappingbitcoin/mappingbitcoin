"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import type { MarketingGuidelines } from "../types";
import { CheckmarkIcon, CloseIcon, StarIcon } from "@/assets/icons/ui";
import Button, { IconButton, TagRemoveButton } from "@/components/ui/Button";

export default function GuidelinesTab() {
    const t = useTranslations("admin.marketing");
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

            if (!response.ok) throw new Error("Failed to fetch guidelines");

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
                body: JSON.stringify({ voiceTone: voiceTone || null, doList, dontList, brandValues }),
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
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm">
                    {t("guidelines.successMessage")}
                </div>
            )}

            {/* Voice & Tone + Brand Values row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Voice & Tone */}
                <div className="bg-surface rounded-lg border border-border-light p-4">
                    <h3 className="text-sm font-semibold text-white mb-2">{t("guidelines.title")}</h3>
                    <textarea
                        value={voiceTone}
                        onChange={(e) => setVoiceTone(e.target.value)}
                        placeholder={t("guidelines.voicePlaceholder")}
                        rows={5}
                        className="w-full px-3 py-2 text-sm bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-accent resize-none"
                    />
                </div>

                {/* Brand Values */}
                <div className="bg-surface rounded-lg border border-border-light p-4">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <StarIcon className="w-4 h-4 text-accent" />
                        {t("guidelines.valuesTitle")}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mb-3 max-h-32 overflow-y-auto">
                        {brandValues.map((value, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-accent/20 text-accent rounded-full text-xs"
                            >
                                {value}
                                <TagRemoveButton
                                    onClick={() => removeItem(brandValues, setBrandValues, index)}
                                    aria-label={`Remove ${value}`}
                                />
                            </span>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addItem(brandValues, setBrandValues, newValue, setNewValue)}
                            placeholder={t("guidelines.addValue")}
                            className="flex-1 px-3 py-1.5 text-xs bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-accent"
                        />
                        <Button
                            onClick={() => addItem(brandValues, setBrandValues, newValue, setNewValue)}
                            variant="soft"
                            size="xs"
                        >
                            {t("common.add")}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Do/Don't row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Do List */}
                <div className="bg-surface rounded-lg border border-border-light p-4">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <CheckmarkIcon className="w-4 h-4 text-green-400" />
                        {t("guidelines.doTitle")}
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {doList.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 group">
                                <span className="flex-1 px-2 py-1.5 bg-surface-light rounded text-white text-xs">
                                    {item}
                                </span>
                                <TagRemoveButton
                                    onClick={() => removeItem(doList, setDoList, index)}
                                    aria-label={`Remove ${item}`}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                        <input
                            type="text"
                            value={newDo}
                            onChange={(e) => setNewDo(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addItem(doList, setDoList, newDo, setNewDo)}
                            placeholder={t("guidelines.addGuideline")}
                            className="flex-1 px-3 py-1.5 text-xs bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-accent"
                        />
                        <Button
                            onClick={() => addItem(doList, setDoList, newDo, setNewDo)}
                            variant="soft"
                            color="success"
                            size="xs"
                        >
                            {t("common.add")}
                        </Button>
                    </div>
                </div>

                {/* Don't List */}
                <div className="bg-surface rounded-lg border border-border-light p-4">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <CloseIcon className="w-4 h-4 text-red-400" />
                        {t("guidelines.dontTitle")}
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {dontList.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 group">
                                <span className="flex-1 px-2 py-1.5 bg-surface-light rounded text-white text-xs">
                                    {item}
                                </span>
                                <TagRemoveButton
                                    onClick={() => removeItem(dontList, setDontList, index)}
                                    aria-label={`Remove ${item}`}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                        <input
                            type="text"
                            value={newDont}
                            onChange={(e) => setNewDont(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addItem(dontList, setDontList, newDont, setNewDont)}
                            placeholder={t("guidelines.addGuideline")}
                            className="flex-1 px-3 py-1.5 text-xs bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-accent"
                        />
                        <Button
                            onClick={() => addItem(dontList, setDontList, newDont, setNewDont)}
                            variant="soft"
                            color="danger"
                            size="xs"
                        >
                            {t("common.add")}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
                {guidelines && (
                    <p className="text-xs text-text-light">
                        {t("guidelines.updated")} {new Date(guidelines.updatedAt).toLocaleString()}
                    </p>
                )}
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    loading={saving}
                >
                    {saving ? t("common.saving") : t("guidelines.saveButton")}
                </Button>
            </div>
        </div>
    );
}

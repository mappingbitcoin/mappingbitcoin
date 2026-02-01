"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import type { MarketingStat } from "../types";

export default function StatsTab() {
    const t = useTranslations("admin.marketing");
    const { authToken } = useNostrAuth();
    const [stats, setStats] = useState<MarketingStat[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [showExpired, setShowExpired] = useState(false);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStat, setEditingStat] = useState<MarketingStat | null>(null);
    const [formData, setFormData] = useState({
        label: "",
        value: "",
        source: "",
        category: "",
        expiresAt: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        if (!authToken) return;

        try {
            const params = new URLSearchParams();
            if (selectedCategory) params.set("category", selectedCategory);
            if (showExpired) params.set("includeExpired", "true");

            const response = await fetch(`/api/admin/marketing/stats?${params}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch stats");
            }

            const data = await response.json();
            setStats(data.stats || []);
            setCategories(data.categories || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load stats");
        } finally {
            setLoading(false);
        }
    }, [authToken, selectedCategory, showExpired]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const openCreateModal = () => {
        setEditingStat(null);
        setFormData({
            label: "",
            value: "",
            source: "",
            category: "",
            expiresAt: "",
        });
        setFormError(null);
        setIsModalOpen(true);
    };

    const openEditModal = (stat: MarketingStat) => {
        setEditingStat(stat);
        setFormData({
            label: stat.label,
            value: stat.value,
            source: stat.source || "",
            category: stat.category,
            expiresAt: stat.expiresAt ? stat.expiresAt.split("T")[0] : "",
        });
        setFormError(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingStat(null);
        setFormError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);

        try {
            if (editingStat) {
                const response = await fetch(`/api/admin/marketing/stats/${editingStat.id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authToken}`,
                    },
                    body: JSON.stringify({
                        label: formData.label,
                        value: formData.value,
                        source: formData.source || null,
                        category: formData.category,
                        expiresAt: formData.expiresAt || null,
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Failed to update stat");
                }
            } else {
                const response = await fetch("/api/admin/marketing/stats", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authToken}`,
                    },
                    body: JSON.stringify({
                        label: formData.label,
                        value: formData.value,
                        source: formData.source || null,
                        category: formData.category,
                        expiresAt: formData.expiresAt || null,
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Failed to create stat");
                }
            }

            closeModal();
            fetchStats();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "Operation failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (stat: MarketingStat) => {
        if (!confirm(t("confirm.deleteStat", { name: stat.label }))) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/marketing/stats/${stat.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || t("errors.failedToDelete"));
            }

            fetchStats();
        } catch (err) {
            alert(err instanceof Error ? err.message : t("errors.failedToDelete"));
        }
    };

    const isExpired = (stat: MarketingStat) => {
        if (!stat.expiresAt) return false;
        return new Date(stat.expiresAt) < new Date();
    };

    const isExpiringSoon = (stat: MarketingStat) => {
        if (!stat.expiresAt) return false;
        const expiry = new Date(stat.expiresAt);
        const now = new Date();
        const daysUntil = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntil > 0 && daysUntil <= 7;
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

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white focus:outline-none focus:border-accent"
                    >
                        <option value="">{t("statsTab.allCategories")}</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                    <label className="flex items-center gap-2 text-sm text-text-light">
                        <input
                            type="checkbox"
                            checked={showExpired}
                            onChange={(e) => setShowExpired(e.target.checked)}
                            className="w-4 h-4 rounded border-border-light bg-surface-light text-accent focus:ring-primary"
                        />
                        {t("statsTab.showExpired")}
                    </label>
                </div>
                <Button onClick={openCreateModal}>
                    {t("statsTab.addButton")}
                </Button>
            </div>

            {/* Stats Table */}
            <div className="bg-surface rounded-xl border border-border-light overflow-hidden">
                {stats.length === 0 ? (
                    <div className="p-8 text-center text-text-light">
                        <p>{t("statsTab.emptyMessage")}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-surface-light">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">{t("statsTab.fields.label")}</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">{t("statsTab.fields.value")}</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">{t("statsTab.fields.category")}</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">{t("statsTab.fields.source")}</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">{t("statsTab.fields.expires")}</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-text-light">{t("common.actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                                {stats.map((stat) => (
                                    <tr
                                        key={stat.id}
                                        className={`hover:bg-surface-light/50 ${isExpired(stat) ? "opacity-50" : ""}`}
                                    >
                                        <td className="px-4 py-3 text-white font-medium">{stat.label}</td>
                                        <td className="px-4 py-3">
                                            <span className="text-accent font-semibold">{stat.value}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-surface-light rounded text-sm text-text-light">
                                                {stat.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-text-light">
                                            {stat.source || <span className="italic">{t("statsTab.noSource")}</span>}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {stat.expiresAt ? (
                                                <span
                                                    className={`${
                                                        isExpired(stat)
                                                            ? "text-red-400"
                                                            : isExpiringSoon(stat)
                                                            ? "text-amber-400"
                                                            : "text-text-light"
                                                    }`}
                                                >
                                                    {new Date(stat.expiresAt).toLocaleDateString()}
                                                    {isExpired(stat) && ` ${t("statsTab.expired")}`}
                                                    {isExpiringSoon(stat) && ` ${t("statsTab.expiringSoon")}`}
                                                </span>
                                            ) : (
                                                <span className="text-text-light italic">{t("statsTab.never")}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-1">
                                            <Button
                                                onClick={() => openEditModal(stat)}
                                                variant="ghost"
                                                color="accent"
                                                size="xs"
                                            >
                                                {t("common.edit")}
                                            </Button>
                                            <Button
                                                onClick={() => handleDelete(stat)}
                                                variant="ghost"
                                                color="danger"
                                                size="xs"
                                            >
                                                {t("common.delete")}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingStat ? t("statsTab.editTitle") : t("statsTab.addTitle")}
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {formError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                            {formError}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-1">
                            {t("statsTab.fields.label")}
                        </label>
                        <input
                            type="text"
                            value={formData.label}
                            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                            placeholder={t("statsTab.placeholders.label")}
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-accent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-1">
                            {t("statsTab.fields.value")}
                        </label>
                        <input
                            type="text"
                            value={formData.value}
                            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                            placeholder={t("statsTab.placeholders.value")}
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-accent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-1">
                            {t("statsTab.fields.category")}
                        </label>
                        <input
                            type="text"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            placeholder={t("statsTab.placeholders.category")}
                            list="stat-category-suggestions"
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-accent"
                            required
                        />
                        <datalist id="stat-category-suggestions">
                            {categories.map((cat) => (
                                <option key={cat} value={cat} />
                            ))}
                        </datalist>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-1">
                            {t("statsTab.fields.sourceOptional")}
                        </label>
                        <input
                            type="text"
                            value={formData.source}
                            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                            placeholder={t("statsTab.placeholders.source")}
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-accent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-1">
                            {t("statsTab.fields.expiresOptional")}
                        </label>
                        <input
                            type="date"
                            value={formData.expiresAt}
                            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white focus:outline-none focus:border-accent"
                        />
                        <p className="text-xs text-text-light mt-1">
                            {t("statsTab.expiresHelper")}
                        </p>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            onClick={closeModal}
                            variant="ghost"
                            color="neutral"
                        >
                            {t("common.cancel")}
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            loading={submitting}
                        >
                            {submitting ? t("common.saving") : editingStat ? t("common.update") : t("statsTab.addStat")}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

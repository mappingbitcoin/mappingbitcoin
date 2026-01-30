"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import Modal from "@/components/ui/Modal";
import type { MarketingStat } from "../types";

export default function StatsTab() {
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
        if (!confirm(`Are you sure you want to delete "${stat.label}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/marketing/stats/${stat.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete stat");
            }

            fetchStats();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete stat");
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
                        className="px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white focus:outline-none focus:border-primary"
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                    <label className="flex items-center gap-2 text-sm text-text-light">
                        <input
                            type="checkbox"
                            checked={showExpired}
                            onChange={(e) => setShowExpired(e.target.checked)}
                            className="w-4 h-4 rounded border-border-light bg-surface-light text-primary focus:ring-primary"
                        />
                        Show expired
                    </label>
                </div>
                <button
                    onClick={openCreateModal}
                    className="px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg transition-colors"
                >
                    Add Stat
                </button>
            </div>

            {/* Stats Table */}
            <div className="bg-surface rounded-xl border border-border-light overflow-hidden">
                {stats.length === 0 ? (
                    <div className="p-8 text-center text-text-light">
                        <p>No stats yet. Add your first marketing stat or fact.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-surface-light">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Label</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Value</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Category</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Source</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Expires</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-text-light">Actions</th>
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
                                            <span className="text-primary font-semibold">{stat.value}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-surface-light rounded text-sm text-text-light">
                                                {stat.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-text-light">
                                            {stat.source || <span className="italic">No source</span>}
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
                                                    {isExpired(stat) && " (expired)"}
                                                    {isExpiringSoon(stat) && " (soon)"}
                                                </span>
                                            ) : (
                                                <span className="text-text-light italic">Never</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <button
                                                onClick={() => openEditModal(stat)}
                                                className="px-3 py-1 text-sm text-primary hover:text-primary-light transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(stat)}
                                                className="px-3 py-1 text-sm text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                Delete
                                            </button>
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
                title={editingStat ? "Edit Stat" : "Add Stat"}
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
                            Label
                        </label>
                        <input
                            type="text"
                            value={formData.label}
                            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                            placeholder="e.g., Active Users, Countries Served"
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-1">
                            Value
                        </label>
                        <input
                            type="text"
                            value={formData.value}
                            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                            placeholder="e.g., 10,000+, 50 countries"
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-1">
                            Category
                        </label>
                        <input
                            type="text"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            placeholder="e.g., growth, engagement, reach"
                            list="stat-category-suggestions"
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary"
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
                            Source (optional)
                        </label>
                        <input
                            type="text"
                            value={formData.source}
                            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                            placeholder="e.g., Internal analytics, Q4 2024 report"
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-1">
                            Expires (optional)
                        </label>
                        <input
                            type="date"
                            value={formData.expiresAt}
                            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white focus:outline-none focus:border-primary"
                        />
                        <p className="text-xs text-text-light mt-1">
                            Set an expiration date to be reminded to update this stat
                        </p>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 text-text-light hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            {submitting ? "Saving..." : editingStat ? "Update" : "Add Stat"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

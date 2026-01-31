"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import Modal from "@/components/ui/Modal";
import type { MarketingLink } from "../types";

export default function LinksTab() {
    const t = useTranslations("admin.marketing");
    const { authToken } = useNostrAuth();
    const [links, setLinks] = useState<MarketingLink[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLink, setEditingLink] = useState<MarketingLink | null>(null);
    const [formData, setFormData] = useState({ title: "", url: "", description: "", category: "" });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const fetchLinks = useCallback(async () => {
        if (!authToken) return;

        try {
            const params = new URLSearchParams();
            if (selectedCategory) params.set("category", selectedCategory);

            const response = await fetch(`/api/admin/marketing/links?${params}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) throw new Error("Failed to fetch links");

            const data = await response.json();
            setLinks(data.links || []);
            setCategories(data.categories || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load links");
        } finally {
            setLoading(false);
        }
    }, [authToken, selectedCategory]);

    useEffect(() => {
        fetchLinks();
    }, [fetchLinks]);

    const openCreateModal = () => {
        setEditingLink(null);
        setFormData({ title: "", url: "", description: "", category: "" });
        setFormError(null);
        setIsModalOpen(true);
    };

    const openEditModal = (link: MarketingLink) => {
        setEditingLink(link);
        setFormData({
            title: link.title,
            url: link.url,
            description: link.description || "",
            category: link.category,
        });
        setFormError(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingLink(null);
        setFormError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);

        try {
            const url = editingLink
                ? `/api/admin/marketing/links/${editingLink.id}`
                : "/api/admin/marketing/links";

            const response = await fetch(url, {
                method: editingLink ? "PATCH" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    title: formData.title,
                    url: formData.url,
                    description: formData.description || null,
                    category: formData.category,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Operation failed");
            }

            closeModal();
            fetchLinks();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "Operation failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (link: MarketingLink) => {
        if (!confirm(t("confirm.deleteLink", { name: link.title }))) return;

        try {
            const response = await fetch(`/api/admin/marketing/links/${link.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || t("errors.failedToDelete"));
            }

            fetchLinks();
        } catch (err) {
            alert(err instanceof Error ? err.message : t("errors.failedToDelete"));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-1.5 text-sm bg-surface-light border border-border-light rounded-lg text-white focus:outline-none focus:border-accent"
                >
                    <option value="">{t("links.allCategories")}</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <button
                    onClick={openCreateModal}
                    className="px-3 py-1.5 text-sm bg-accent hover:bg-accent-light text-white rounded-lg transition-colors"
                >
                    {t("links.addButton")}
                </button>
            </div>

            {/* Links Table */}
            <div className="bg-surface rounded-lg border border-border-light overflow-hidden">
                {links.length === 0 ? (
                    <div className="p-6 text-center text-text-light text-sm">
                        {t("links.emptyMessage")}
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-surface-light text-left">
                            <tr>
                                <th className="px-3 py-2 font-medium text-text-light">{t("links.fields.title")}</th>
                                <th className="px-3 py-2 font-medium text-text-light">{t("links.fields.url")}</th>
                                <th className="px-3 py-2 font-medium text-text-light">{t("links.fields.category")}</th>
                                <th className="px-3 py-2 font-medium text-text-light text-right">{t("common.actions")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-light">
                            {links.map((link) => (
                                <tr key={link.id} className="hover:bg-surface-light/50">
                                    <td className="px-3 py-2">
                                        <span className="text-white font-medium">{link.title}</span>
                                        {link.description && (
                                            <p className="text-xs text-text-light truncate max-w-xs">{link.description}</p>
                                        )}
                                    </td>
                                    <td className="px-3 py-2">
                                        <a
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-accent hover:text-accent-light text-xs truncate max-w-[200px] block"
                                        >
                                            {link.url}
                                        </a>
                                    </td>
                                    <td className="px-3 py-2">
                                        <span className="px-2 py-0.5 bg-surface-light rounded text-xs text-text-light">
                                            {link.category}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <button
                                            onClick={() => openEditModal(link)}
                                            className="px-2 py-1 text-xs text-accent hover:text-accent-light transition-colors"
                                        >
                                            {t("common.edit")}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(link)}
                                            className="px-2 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            {t("common.delete")}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingLink ? t("links.editTitle") : t("links.addTitle")} maxWidth="max-w-md">
                <form onSubmit={handleSubmit} className="p-4 space-y-3">
                    {formError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-red-400 text-xs">
                            {formError}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-text-light mb-1">{t("links.fields.title")}</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder={t("links.placeholders.title")}
                            className="w-full px-3 py-2 text-sm bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-accent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-text-light mb-1">{t("links.fields.url")}</label>
                        <input
                            type="url"
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            placeholder={t("links.placeholders.url")}
                            className="w-full px-3 py-2 text-sm bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-accent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-text-light mb-1">{t("links.fields.description")}</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder={t("links.placeholders.description")}
                            rows={2}
                            className="w-full px-3 py-2 text-sm bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-accent resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-text-light mb-1">{t("links.fields.category")}</label>
                        <input
                            type="text"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            placeholder={t("links.placeholders.category")}
                            list="category-suggestions"
                            className="w-full px-3 py-2 text-sm bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-accent"
                            required
                        />
                        <datalist id="category-suggestions">
                            {categories.map((cat) => (
                                <option key={cat} value={cat} />
                            ))}
                        </datalist>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-3 py-1.5 text-sm text-text-light hover:text-white transition-colors"
                        >
                            {t("common.cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-3 py-1.5 text-sm bg-accent hover:bg-accent-light text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            {submitting ? t("common.saving") : editingLink ? t("common.update") : t("common.add")}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

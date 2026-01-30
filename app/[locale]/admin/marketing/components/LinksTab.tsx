"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import Modal from "@/components/ui/Modal";
import type { MarketingLink } from "../types";

export default function LinksTab() {
    const { authToken } = useNostrAuth();
    const [links, setLinks] = useState<MarketingLink[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLink, setEditingLink] = useState<MarketingLink | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        url: "",
        description: "",
        category: "",
    });
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

            if (!response.ok) {
                throw new Error("Failed to fetch links");
            }

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
            if (editingLink) {
                const response = await fetch(`/api/admin/marketing/links/${editingLink.id}`, {
                    method: "PATCH",
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
                    throw new Error(data.error || "Failed to update link");
                }
            } else {
                const response = await fetch("/api/admin/marketing/links", {
                    method: "POST",
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
                    throw new Error(data.error || "Failed to create link");
                }
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
        if (!confirm(`Are you sure you want to delete "${link.title}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/marketing/links/${link.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete link");
            }

            fetchLinks();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete link");
        }
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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
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
                </div>
                <button
                    onClick={openCreateModal}
                    className="px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg transition-colors"
                >
                    Add Link
                </button>
            </div>

            {/* Links Table */}
            <div className="bg-surface rounded-xl border border-border-light overflow-hidden">
                {links.length === 0 ? (
                    <div className="p-8 text-center text-text-light">
                        <p>No links yet. Add your first marketing link.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-surface-light">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Title</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">URL</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Category</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-text-light">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                                {links.map((link) => (
                                    <tr key={link.id} className="hover:bg-surface-light/50">
                                        <td className="px-4 py-3">
                                            <div className="text-white font-medium">{link.title}</div>
                                            {link.description && (
                                                <div className="text-sm text-text-light mt-1">{link.description}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <a
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:text-primary-light text-sm truncate max-w-xs block"
                                            >
                                                {link.url}
                                            </a>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-surface-light rounded text-sm text-text-light">
                                                {link.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <button
                                                onClick={() => openEditModal(link)}
                                                className="px-3 py-1 text-sm text-primary hover:text-primary-light transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(link)}
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
                title={editingLink ? "Edit Link" : "Add Link"}
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
                            Title
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Company Website"
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-1">
                            URL
                        </label>
                        <input
                            type="url"
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            placeholder="https://example.com"
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-1">
                            Description (optional)
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of what this link is for..."
                            rows={2}
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary resize-none"
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
                            placeholder="e.g., website, social, resources"
                            list="category-suggestions"
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary"
                            required
                        />
                        <datalist id="category-suggestions">
                            {categories.map((cat) => (
                                <option key={cat} value={cat} />
                            ))}
                        </datalist>
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
                            {submitting ? "Saving..." : editingLink ? "Update" : "Add Link"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

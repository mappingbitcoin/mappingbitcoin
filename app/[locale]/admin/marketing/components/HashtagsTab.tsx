"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import Modal from "@/components/ui/Modal";
import TagInput from "./TagInput";
import type { HashtagSet, SocialNetwork } from "../types";
import { SOCIAL_NETWORKS, SOCIAL_NETWORK_LABELS } from "../types";
import { EditIcon, TrashIcon } from "@/assets/icons/ui";

export default function HashtagsTab() {
    const t = useTranslations("admin.marketing");
    const { authToken } = useNostrAuth();
    const [hashtagSets, setHashtagSets] = useState<HashtagSet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSet, setEditingSet] = useState<HashtagSet | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        hashtags: [] as string[],
        socialNetworks: [] as SocialNetwork[],
        description: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const fetchHashtagSets = useCallback(async () => {
        if (!authToken) return;

        try {
            const response = await fetch("/api/admin/marketing/hashtags", {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch hashtag sets");
            }

            const data = await response.json();
            setHashtagSets(data.hashtagSets || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load hashtag sets");
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        fetchHashtagSets();
    }, [fetchHashtagSets]);

    const openCreateModal = () => {
        setEditingSet(null);
        setFormData({
            name: "",
            hashtags: [],
            socialNetworks: [],
            description: "",
        });
        setFormError(null);
        setIsModalOpen(true);
    };

    const openEditModal = (set: HashtagSet) => {
        setEditingSet(set);
        setFormData({
            name: set.name,
            hashtags: set.hashtags,
            socialNetworks: set.socialNetworks,
            description: set.description || "",
        });
        setFormError(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSet(null);
        setFormError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.hashtags.length === 0) {
            setFormError(t("hashtags.atLeastOneHashtag"));
            return;
        }

        setSubmitting(true);
        setFormError(null);

        try {
            if (editingSet) {
                const response = await fetch(`/api/admin/marketing/hashtags/${editingSet.id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authToken}`,
                    },
                    body: JSON.stringify({
                        name: formData.name,
                        hashtags: formData.hashtags,
                        socialNetworks: formData.socialNetworks,
                        description: formData.description || null,
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Failed to update hashtag set");
                }
            } else {
                const response = await fetch("/api/admin/marketing/hashtags", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authToken}`,
                    },
                    body: JSON.stringify({
                        name: formData.name,
                        hashtags: formData.hashtags,
                        socialNetworks: formData.socialNetworks,
                        description: formData.description || null,
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Failed to create hashtag set");
                }
            }

            closeModal();
            fetchHashtagSets();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "Operation failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (set: HashtagSet) => {
        if (!confirm(t("confirm.deleteHashtagSet", { name: set.name }))) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/marketing/hashtags/${set.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || t("errors.failedToDelete"));
            }

            fetchHashtagSets();
        } catch (err) {
            alert(err instanceof Error ? err.message : t("errors.failedToDelete"));
        }
    };

    const toggleNetwork = (network: SocialNetwork) => {
        if (formData.socialNetworks.includes(network)) {
            setFormData({
                ...formData,
                socialNetworks: formData.socialNetworks.filter((n) => n !== network),
            });
        } else {
            setFormData({
                ...formData,
                socialNetworks: [...formData.socialNetworks, network],
            });
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
                <p className="text-text-light">
                    {t("hashtags.description")}
                </p>
                <button
                    onClick={openCreateModal}
                    className="px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-lg transition-colors"
                >
                    {t("hashtags.addButton")}
                </button>
            </div>

            {/* Hashtag Sets */}
            {hashtagSets.length === 0 ? (
                <div className="bg-surface rounded-xl border border-border-light p-8 text-center text-text-light">
                    <p>{t("hashtags.emptyMessage")}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hashtagSets.map((set) => (
                        <div
                            key={set.id}
                            className="bg-surface rounded-xl border border-border-light p-5 space-y-4"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className="text-white font-semibold">{set.name}</h4>
                                    {set.description && (
                                        <p className="text-sm text-text-light mt-1">{set.description}</p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEditModal(set)}
                                        className="p-2 text-text-light hover:text-accent transition-colors"
                                    >
                                        <EditIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(set)}
                                        className="p-2 text-text-light hover:text-red-400 transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Hashtags */}
                            <div className="flex flex-wrap gap-1.5">
                                {set.hashtags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-1 bg-primary/20 text-accent rounded text-sm"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>

                            {/* Social Networks */}
                            {set.socialNetworks.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {set.socialNetworks.map((network) => (
                                        <span
                                            key={network}
                                            className="px-2 py-0.5 bg-surface-light text-text-light rounded text-xs"
                                        >
                                            {SOCIAL_NETWORK_LABELS[network]}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingSet ? t("hashtags.editTitle") : t("hashtags.addTitle")}
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
                            {t("hashtags.fields.name")}
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder={t("hashtags.placeholders.name")}
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-accent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-1">
                            {t("hashtags.fields.hashtags")}
                        </label>
                        <TagInput
                            tags={formData.hashtags}
                            onChange={(tags) => setFormData({ ...formData, hashtags: tags })}
                            placeholder={t("hashtags.placeholders.hashtags")}
                        />
                        <p className="text-xs text-text-light mt-1">{t("hashtags.pressEnter")}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-2">
                            {t("hashtags.fields.socialNetworks")}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {SOCIAL_NETWORKS.map((network) => (
                                <button
                                    key={network}
                                    type="button"
                                    onClick={() => toggleNetwork(network)}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                        formData.socialNetworks.includes(network)
                                            ? "bg-blue-500/30 text-blue-400 border border-blue-500/50"
                                            : "bg-surface-light text-text-light border border-transparent hover:border-border-light"
                                    }`}
                                >
                                    {SOCIAL_NETWORK_LABELS[network]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-1">
                            {t("hashtags.fields.description")}
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder={t("hashtags.placeholders.description")}
                            rows={2}
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-accent resize-none"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 text-text-light hover:text-white transition-colors"
                        >
                            {t("common.cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            {submitting ? t("common.saving") : editingSet ? t("common.update") : t("hashtags.addSet")}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

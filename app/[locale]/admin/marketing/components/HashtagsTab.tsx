"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/Modal/ConfirmModal";
import Button, { IconButton, ToggleButton } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import FormField from "@/components/ui/FormField";
import TagInput from "@/components/ui/TagInput";
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

    // Delete modal state
    const [deleteTarget, setDeleteTarget] = useState<HashtagSet | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

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

    const handleDelete = async () => {
        if (!deleteTarget || !authToken) return;

        setDeleting(true);
        setDeleteError(null);

        try {
            const response = await fetch(`/api/admin/marketing/hashtags/${deleteTarget.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || t("errors.failedToDelete"));
            }

            setDeleteTarget(null);
            fetchHashtagSets();
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : t("errors.failedToDelete"));
        } finally {
            setDeleting(false);
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
                <Button onClick={openCreateModal}>
                    {t("hashtags.addButton")}
                </Button>
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
                                <div className="flex gap-1">
                                    <IconButton
                                        onClick={() => openEditModal(set)}
                                        icon={<EditIcon />}
                                        aria-label="Edit"
                                        variant="ghost"
                                        color="accent"
                                        size="sm"
                                    />
                                    <IconButton
                                        onClick={() => setDeleteTarget(set)}
                                        icon={<TrashIcon />}
                                        aria-label="Delete"
                                        variant="ghost"
                                        color="danger"
                                        size="sm"
                                    />
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

                    <FormField label={t("hashtags.fields.name")} required>
                        <Input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder={t("hashtags.placeholders.name")}
                            required
                        />
                    </FormField>

                    <FormField label={t("hashtags.fields.hashtags")} helpText={t("hashtags.pressEnter")} required>
                        <TagInput
                            tags={formData.hashtags}
                            onChange={(tags) => setFormData({ ...formData, hashtags: tags })}
                            placeholder={t("hashtags.placeholders.hashtags")}
                            tagPrefix="#"
                        />
                    </FormField>

                    <FormField label={t("hashtags.fields.socialNetworks")}>
                        <div className="flex flex-wrap gap-2">
                            {SOCIAL_NETWORKS.map((network) => (
                                <ToggleButton
                                    key={network}
                                    selected={formData.socialNetworks.includes(network)}
                                    onClick={() => toggleNetwork(network)}
                                >
                                    {SOCIAL_NETWORK_LABELS[network]}
                                </ToggleButton>
                            ))}
                        </div>
                    </FormField>

                    <FormField label={t("hashtags.fields.description")}>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder={t("hashtags.placeholders.description")}
                            rows={2}
                        />
                    </FormField>

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
                            {submitting ? t("common.saving") : editingSet ? t("common.update") : t("hashtags.addSet")}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => {
                    setDeleteTarget(null);
                    setDeleteError(null);
                }}
                onConfirm={handleDelete}
                title={t("hashtags.deleteTitle")}
                description={t("confirm.deleteHashtagSet", { name: deleteTarget?.name || "" })}
                preview={
                    deleteTarget ? (
                        <div>
                            <p className="text-white text-sm font-medium">{deleteTarget.name}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {deleteTarget.hashtags.slice(0, 5).map((tag, i) => (
                                    <span key={i} className="text-xs text-accent">#{tag}</span>
                                ))}
                                {deleteTarget.hashtags.length > 5 && (
                                    <span className="text-xs text-text-light">+{deleteTarget.hashtags.length - 5} more</span>
                                )}
                            </div>
                        </div>
                    ) : undefined
                }
                confirmText={t("common.delete")}
                loading={deleting}
                error={deleteError}
                variant="danger"
            />
        </div>
    );
}

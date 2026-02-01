"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/Modal/ConfirmModal";
import Button, { IconButton } from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import FormField from "@/components/ui/FormField";
import TagInput from "@/components/ui/TagInput";
import type { ExamplePost, SocialNetwork } from "../types";
import { SOCIAL_NETWORKS, SOCIAL_NETWORK_LABELS } from "../types";
import { EditIcon, TrashIcon } from "@/assets/icons/ui";

export default function ExamplePostsTab() {
    const t = useTranslations("admin.marketing");
    const { authToken } = useNostrAuth();
    const [posts, setPosts] = useState<ExamplePost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedNetwork, setSelectedNetwork] = useState<SocialNetwork | "">("");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<ExamplePost | null>(null);
    const [formData, setFormData] = useState({
        socialNetwork: "" as SocialNetwork | "",
        content: "",
        hashtags: [] as string[],
        notes: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Delete modal state
    const [deleteTarget, setDeleteTarget] = useState<ExamplePost | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const fetchPosts = useCallback(async () => {
        if (!authToken) return;

        try {
            const params = new URLSearchParams();
            if (selectedNetwork) params.set("socialNetwork", selectedNetwork);

            const response = await fetch(`/api/admin/marketing/posts?${params}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch posts");
            }

            const data = await response.json();
            setPosts(data.posts || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load posts");
        } finally {
            setLoading(false);
        }
    }, [authToken, selectedNetwork]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const openCreateModal = () => {
        setEditingPost(null);
        setFormData({
            socialNetwork: "",
            content: "",
            hashtags: [],
            notes: "",
        });
        setFormError(null);
        setIsModalOpen(true);
    };

    const openEditModal = (post: ExamplePost) => {
        setEditingPost(post);
        setFormData({
            socialNetwork: post.socialNetwork,
            content: post.content,
            hashtags: post.hashtags,
            notes: post.notes || "",
        });
        setFormError(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPost(null);
        setFormError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.socialNetwork) {
            setFormError(t("posts.selectNetwork"));
            return;
        }

        setSubmitting(true);
        setFormError(null);

        try {
            if (editingPost) {
                const response = await fetch(`/api/admin/marketing/posts/${editingPost.id}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authToken}`,
                    },
                    body: JSON.stringify({
                        socialNetwork: formData.socialNetwork,
                        content: formData.content,
                        hashtags: formData.hashtags,
                        notes: formData.notes || null,
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Failed to update post");
                }
            } else {
                const response = await fetch("/api/admin/marketing/posts", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authToken}`,
                    },
                    body: JSON.stringify({
                        socialNetwork: formData.socialNetwork,
                        content: formData.content,
                        hashtags: formData.hashtags,
                        notes: formData.notes || null,
                    }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Failed to create post");
                }
            }

            closeModal();
            fetchPosts();
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
            const response = await fetch(`/api/admin/marketing/posts/${deleteTarget.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || t("errors.failedToDelete"));
            }

            setDeleteTarget(null);
            fetchPosts();
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : t("errors.failedToDelete"));
        } finally {
            setDeleting(false);
        }
    };

    // Group posts by social network
    const groupedPosts = SOCIAL_NETWORKS.reduce((acc, network) => {
        acc[network] = posts.filter((p) => p.socialNetwork === network);
        return acc;
    }, {} as Record<SocialNetwork, ExamplePost[]>);

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
                <Select
                    value={selectedNetwork}
                    onChange={(e) => setSelectedNetwork(e.target.value as SocialNetwork | "")}
                    size="md"
                    fullWidth={false}
                    placeholder={t("posts.allNetworks")}
                    options={SOCIAL_NETWORKS.map((network) => ({ value: network, label: SOCIAL_NETWORK_LABELS[network] }))}
                />
                <Button onClick={openCreateModal}>
                    {t("posts.addButton")}
                </Button>
            </div>

            {/* Posts by Network */}
            {posts.length === 0 ? (
                <div className="bg-surface rounded-xl border border-border-light p-8 text-center text-text-light">
                    <p>{t("posts.emptyMessage")}</p>
                </div>
            ) : selectedNetwork ? (
                // Single network view
                <div className="space-y-4">
                    {groupedPosts[selectedNetwork]?.map((post) => (
                        <PostCard key={post.id} post={post} onEdit={openEditModal} onDelete={setDeleteTarget} />
                    ))}
                </div>
            ) : (
                // Grouped view
                <div className="space-y-8">
                    {SOCIAL_NETWORKS.filter((network) => groupedPosts[network].length > 0).map((network) => (
                        <div key={network}>
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary" />
                                {SOCIAL_NETWORK_LABELS[network]}
                                <span className="text-sm font-normal text-text-light">
                                    ({t("posts.postsCount", { count: groupedPosts[network].length })})
                                </span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {groupedPosts[network].map((post) => (
                                    <PostCard key={post.id} post={post} onEdit={openEditModal} onDelete={setDeleteTarget} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingPost ? t("posts.editTitle") : t("posts.addTitle")}
                maxWidth="max-w-2xl"
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {formError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                            {formError}
                        </div>
                    )}

                    <FormField label={t("posts.fields.socialNetwork")} required>
                        <Select
                            value={formData.socialNetwork}
                            onChange={(e) => setFormData({ ...formData, socialNetwork: e.target.value as SocialNetwork })}
                            placeholder={t("posts.placeholders.selectNetwork")}
                            options={SOCIAL_NETWORKS.map((network) => ({ value: network, label: SOCIAL_NETWORK_LABELS[network] }))}
                            required
                        />
                    </FormField>

                    <FormField
                        label={t("posts.fields.content")}
                        helpText={`${formData.content.length} ${t("posts.characters")}`}
                        required
                    >
                        <Textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder={t("posts.placeholders.content")}
                            rows={6}
                            className="font-mono"
                            required
                        />
                    </FormField>

                    <FormField label={t("posts.fields.hashtags")}>
                        <TagInput
                            tags={formData.hashtags}
                            onChange={(tags) => setFormData({ ...formData, hashtags: tags })}
                            placeholder={t("posts.placeholders.hashtags")}
                            tagPrefix="#"
                        />
                    </FormField>

                    <FormField label={t("posts.fields.notes")}>
                        <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder={t("posts.placeholders.notes")}
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
                            {submitting ? t("common.saving") : editingPost ? t("common.update") : t("posts.addPost")}
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
                title={t("posts.deleteTitle")}
                description={t("confirm.deletePost")}
                preview={
                    deleteTarget ? (
                        <div>
                            <span className="px-2 py-0.5 bg-primary/20 text-accent rounded text-xs font-medium">
                                {SOCIAL_NETWORK_LABELS[deleteTarget.socialNetwork]}
                            </span>
                            <p className="text-white text-sm mt-2 whitespace-pre-wrap line-clamp-3">
                                {deleteTarget.content}
                            </p>
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

function PostCard({
    post,
    onEdit,
    onDelete,
}: {
    post: ExamplePost;
    onEdit: (post: ExamplePost) => void;
    onDelete: (post: ExamplePost) => void;
}) {
    return (
        <div className="bg-surface rounded-xl border border-border-light p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
                <span className="px-2 py-1 bg-primary/20 text-accent rounded text-xs font-medium">
                    {SOCIAL_NETWORK_LABELS[post.socialNetwork]}
                </span>
                <div className="flex gap-1">
                    <IconButton
                        onClick={() => onEdit(post)}
                        icon={<EditIcon className="w-4 h-4" />}
                        aria-label="Edit"
                        variant="ghost"
                        color="accent"
                        size="sm"
                    />
                    <IconButton
                        onClick={() => onDelete(post)}
                        icon={<TrashIcon className="w-4 h-4" />}
                        aria-label="Delete"
                        variant="ghost"
                        color="danger"
                        size="sm"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="text-white whitespace-pre-wrap text-sm leading-relaxed">
                {post.content}
            </div>

            {/* Hashtags */}
            {post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {post.hashtags.map((tag, index) => (
                        <span
                            key={index}
                            className="text-accent text-sm"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Notes */}
            {post.notes && (
                <div className="pt-3 border-t border-border-light">
                    <p className="text-xs text-text-light italic">{post.notes}</p>
                </div>
            )}
        </div>
    );
}

"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import Modal from "@/components/ui/Modal";
import TagInput from "./TagInput";
import type { ExamplePost, SocialNetwork } from "../types";
import { SOCIAL_NETWORKS, SOCIAL_NETWORK_LABELS } from "../types";
import { EditIcon, TrashIcon } from "@/assets/icons/ui";

export default function ExamplePostsTab() {
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
            setFormError("Please select a social network");
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

    const handleDelete = async (post: ExamplePost) => {
        if (!confirm("Are you sure you want to delete this example post?")) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/marketing/posts/${post.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete post");
            }

            fetchPosts();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete post");
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
                <div className="flex items-center gap-4">
                    <select
                        value={selectedNetwork}
                        onChange={(e) => setSelectedNetwork(e.target.value as SocialNetwork | "")}
                        className="px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white focus:outline-none focus:border-primary"
                    >
                        <option value="">All Networks</option>
                        {SOCIAL_NETWORKS.map((network) => (
                            <option key={network} value={network}>{SOCIAL_NETWORK_LABELS[network]}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={openCreateModal}
                    className="px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-lg transition-colors"
                >
                    Add Example Post
                </button>
            </div>

            {/* Posts by Network */}
            {posts.length === 0 ? (
                <div className="bg-surface rounded-xl border border-border-light p-8 text-center text-text-light">
                    <p>No example posts yet. Add your first example post.</p>
                </div>
            ) : selectedNetwork ? (
                // Single network view
                <div className="space-y-4">
                    {groupedPosts[selectedNetwork]?.map((post) => (
                        <PostCard key={post.id} post={post} onEdit={openEditModal} onDelete={handleDelete} />
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
                                    ({groupedPosts[network].length} posts)
                                </span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {groupedPosts[network].map((post) => (
                                    <PostCard key={post.id} post={post} onEdit={openEditModal} onDelete={handleDelete} />
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
                title={editingPost ? "Edit Example Post" : "Add Example Post"}
                maxWidth="max-w-2xl"
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {formError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                            {formError}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-1">
                            Social Network
                        </label>
                        <select
                            value={formData.socialNetwork}
                            onChange={(e) => setFormData({ ...formData, socialNetwork: e.target.value as SocialNetwork })}
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white focus:outline-none focus:border-primary"
                            required
                        >
                            <option value="">Select network...</option>
                            {SOCIAL_NETWORKS.map((network) => (
                                <option key={network} value={network}>{SOCIAL_NETWORK_LABELS[network]}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-1">
                            Post Content
                        </label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="Write the example post content..."
                            rows={6}
                            className="w-full px-4 py-3 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary resize-none font-mono text-sm"
                            required
                        />
                        <p className="text-xs text-text-light mt-1">
                            {formData.content.length} characters
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-1">
                            Hashtags
                        </label>
                        <TagInput
                            tags={formData.hashtags}
                            onChange={(tags) => setFormData({ ...formData, hashtags: tags })}
                            placeholder="Add hashtags..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-1">
                            Notes (optional)
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Internal notes about why this post works well..."
                            rows={2}
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary resize-none"
                        />
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
                            {submitting ? "Saving..." : editingPost ? "Update" : "Add Post"}
                        </button>
                    </div>
                </form>
            </Modal>
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
                <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-medium">
                    {SOCIAL_NETWORK_LABELS[post.socialNetwork]}
                </span>
                <div className="flex gap-1">
                    <button
                        onClick={() => onEdit(post)}
                        className="p-1.5 text-text-light hover:text-primary transition-colors"
                    >
                        <EditIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(post)}
                        className="p-1.5 text-text-light hover:text-red-400 transition-colors"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
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
                            className="text-primary text-sm"
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

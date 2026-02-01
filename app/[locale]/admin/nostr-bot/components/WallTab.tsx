"use client";

import { useState, useEffect, useCallback } from "react";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { RefreshIcon, ExternalLinkIcon, TrashIcon } from "@/assets/icons";
import Button from "@/components/ui/Button";
import TextLink from "@/components/ui/TextLink";
import ConfirmModal from "@/components/ui/Modal/ConfirmModal";

interface NostrPost {
    id: string;
    pubkey: string;
    created_at: number;
    content: string;
    tags: string[][];
}

export default function WallTab() {
    const { authToken } = useNostrAuth();
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState<NostrPost[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [postToDelete, setPostToDelete] = useState<NostrPost | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const fetchPosts = useCallback(async () => {
        if (!authToken) return;

        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/nostr-bot/posts?limit=50", {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to fetch posts");
            }
            const data = await res.json();
            setPosts(data.posts);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch posts");
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleDelete = async () => {
        if (!postToDelete || !authToken) return;

        setDeleting(true);
        setDeleteError(null);

        try {
            const res = await fetch("/api/admin/nostr-bot/posts", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    eventId: postToDelete.id,
                    reason: "Deleted by admin",
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to delete post");
            }

            // Remove from local state
            setPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
            setPostToDelete(null);
        } catch (err) {
            setDeleteError(err instanceof Error ? err.message : "Failed to delete post");
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString();
    };

    const extractHashtags = (tags: string[][]): string[] => {
        return tags
            .filter((tag) => tag[0] === "t")
            .map((tag) => tag[1]);
    };

    const getNostrClientUrl = (eventId: string) => {
        return `https://njump.me/${eventId}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
                <Button
                    onClick={fetchPosts}
                    variant="soft"
                    color="danger"
                    size="sm"
                    className="mt-3"
                >
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-white">Recent Posts</h2>
                    <p className="text-sm text-text-light">{posts.length} posts loaded</p>
                </div>
                <Button
                    onClick={fetchPosts}
                    variant="outline"
                    color="neutral"
                    size="sm"
                    leftIcon={<RefreshIcon className="w-4 h-4" />}
                >
                    Refresh
                </Button>
            </div>

            {/* Posts */}
            {posts.length === 0 ? (
                <div className="bg-surface border border-border-light rounded-lg p-8 text-center">
                    <p className="text-text-light">No posts found</p>
                    <p className="text-sm text-text-light mt-1">
                        The bot hasn&apos;t posted anything yet.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => {
                        const hashtags = extractHashtags(post.tags);
                        return (
                            <div
                                key={post.id}
                                className="bg-surface border border-border-light rounded-lg p-4"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white whitespace-pre-wrap break-words">
                                            {post.content}
                                        </p>

                                        {hashtags.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {hashtags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded"
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 mt-3 text-xs">
                                            <span className="text-text-light">{formatDate(post.created_at)}</span>
                                            <TextLink
                                                href={getNostrClientUrl(post.id)}
                                                external
                                                className="inline-flex items-center gap-1 text-xs"
                                            >
                                                View on Nostr
                                                <ExternalLinkIcon className="w-3 h-3" />
                                            </TextLink>
                                            <Button
                                                onClick={() => setPostToDelete(post)}
                                                variant="ghost"
                                                color="danger"
                                                size="xs"
                                                leftIcon={<TrashIcon className="w-3 h-3" />}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={!!postToDelete}
                onClose={() => {
                    setPostToDelete(null);
                    setDeleteError(null);
                }}
                onConfirm={handleDelete}
                title="Delete Post"
                description="Are you sure you want to delete this post? This will publish a NIP-09 deletion event to all relays."
                preview={
                    postToDelete ? (
                        <p className="text-sm text-white whitespace-pre-wrap break-words">
                            {postToDelete.content.slice(0, 200)}
                            {postToDelete.content.length > 200 && "..."}
                        </p>
                    ) : undefined
                }
                confirmText="Delete Post"
                loading={deleting}
                error={deleteError}
                variant="danger"
            />
        </div>
    );
}

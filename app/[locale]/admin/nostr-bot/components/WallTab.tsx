"use client";

import { useState, useEffect } from "react";
import { RefreshIcon, ExternalLinkIcon } from "@/assets/icons/ui";

interface NostrPost {
    id: string;
    pubkey: string;
    created_at: number;
    content: string;
    tags: string[][];
}

export default function WallTab() {
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState<NostrPost[]>([]);
    const [error, setError] = useState<string | null>(null);

    const fetchPosts = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/nostr-bot/posts?limit=50");
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
    };

    useEffect(() => {
        fetchPosts();
    }, []);

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
                <button
                    onClick={fetchPosts}
                    className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition-colors"
                >
                    Try Again
                </button>
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
                <button
                    onClick={fetchPosts}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-surface-light hover:bg-border-light rounded-lg text-sm text-white transition-colors"
                >
                    <RefreshIcon className="w-4 h-4" />
                    Refresh
                </button>
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

                                        <div className="flex items-center gap-4 mt-3 text-xs text-text-light">
                                            <span>{formatDate(post.created_at)}</span>
                                            <a
                                                href={getNostrClientUrl(post.id)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-accent hover:text-accent-light transition-colors"
                                            >
                                                View on Nostr
                                                <ExternalLinkIcon className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { SendIcon, PlusIcon, CloseIcon } from "@/assets/icons/ui";

export default function PostTab() {
    const [content, setContent] = useState("");
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [hashtagInput, setHashtagInput] = useState("");
    const [url, setUrl] = useState("");
    const [posting, setPosting] = useState(false);
    const [lastResult, setLastResult] = useState<{
        success: boolean;
        eventId?: string;
        relays?: { success: number; failed: number };
        error?: string;
    } | null>(null);

    const addHashtag = () => {
        const tag = hashtagInput.replace(/^#/, "").trim().toLowerCase();
        if (tag && !hashtags.includes(tag)) {
            setHashtags([...hashtags, tag]);
        }
        setHashtagInput("");
    };

    const removeHashtag = (tag: string) => {
        setHashtags(hashtags.filter((t) => t !== tag));
    };

    const handleSubmit = async () => {
        if (!content.trim()) {
            toast.error("Content is required");
            return;
        }

        setPosting(true);
        setLastResult(null);

        try {
            const res = await fetch("/api/admin/nostr-bot/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: content.trim(),
                    hashtags,
                    url: url.trim() || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to post");
            }

            setLastResult({
                success: true,
                eventId: data.eventId,
                relays: data.relays,
            });

            toast.success(`Posted! Published to ${data.relays.success} relays`);

            // Clear form
            setContent("");
            setHashtags([]);
            setUrl("");
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to post";
            setLastResult({ success: false, error: errorMessage });
            toast.error(errorMessage);
        } finally {
            setPosting(false);
        }
    };

    const characterCount = content.length;
    const maxChars = 5000;

    return (
        <div className="space-y-6">
            {/* Post Form */}
            <div className="bg-surface border border-border-light rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Create New Post</h2>

                <div className="space-y-4">
                    {/* Content */}
                    <div>
                        <label className="block text-sm text-text-light mb-1">Content</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What's happening in the Bitcoin world?"
                            rows={6}
                            maxLength={maxChars}
                            className="w-full px-3 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light/50 focus:outline-none focus:border-accent resize-none"
                        />
                        <div className="flex justify-end mt-1">
                            <span
                                className={`text-xs ${
                                    characterCount > maxChars * 0.9
                                        ? "text-amber-400"
                                        : "text-text-light"
                                }`}
                            >
                                {characterCount}/{maxChars}
                            </span>
                        </div>
                    </div>

                    {/* Hashtags */}
                    <div>
                        <label className="block text-sm text-text-light mb-1">Hashtags</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={hashtagInput}
                                onChange={(e) => setHashtagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addHashtag();
                                    }
                                }}
                                placeholder="bitcoin"
                                className="flex-1 px-3 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light/50 focus:outline-none focus:border-accent"
                            />
                            <button
                                onClick={addHashtag}
                                className="px-3 py-2 bg-surface-light hover:bg-border-light border border-border-light rounded-lg transition-colors"
                            >
                                <PlusIcon className="w-5 h-5 text-white" />
                            </button>
                        </div>
                        {hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {hashtags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-accent/20 text-accent text-sm rounded"
                                    >
                                        #{tag}
                                        <button
                                            onClick={() => removeHashtag(tag)}
                                            className="hover:text-white transition-colors"
                                        >
                                            <CloseIcon className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* URL Reference */}
                    <div>
                        <label className="block text-sm text-text-light mb-1">
                            URL Reference (optional)
                        </label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://mappingbitcoin.com/..."
                            className="w-full px-3 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light/50 focus:outline-none focus:border-accent"
                        />
                        <p className="text-xs text-text-light mt-1">
                            Will be added as an &quot;r&quot; tag for client link previews
                        </p>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleSubmit}
                            disabled={posting || !content.trim()}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-accent hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                        >
                            {posting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                                    Posting...
                                </>
                            ) : (
                                <>
                                    <SendIcon className="w-4 h-4" />
                                    Post to Nostr
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Last Result */}
            {lastResult && (
                <div
                    className={`rounded-lg p-4 ${
                        lastResult.success
                            ? "bg-green-500/10 border border-green-500/30"
                            : "bg-red-500/10 border border-red-500/30"
                    }`}
                >
                    {lastResult.success ? (
                        <div>
                            <p className="text-green-400 font-medium">Post Published!</p>
                            <div className="mt-2 space-y-1 text-sm">
                                <p className="text-text-light">
                                    Event ID:{" "}
                                    <code className="text-white">{lastResult.eventId}</code>
                                </p>
                                <p className="text-text-light">
                                    Relays: {lastResult.relays?.success} succeeded,{" "}
                                    {lastResult.relays?.failed} failed
                                </p>
                                <a
                                    href={`https://njump.me/${lastResult.eventId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block mt-2 text-accent hover:text-accent-light transition-colors"
                                >
                                    View on Nostr →
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p className="text-red-400 font-medium">Failed to Post</p>
                            <p className="text-sm text-text-light mt-1">{lastResult.error}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Quick Templates */}
            <div className="bg-surface border border-border-light rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Quick Templates</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <button
                        onClick={() => {
                            setContent(
                                `New Bitcoin spot just dropped! [Name] in [City, Country] now accepts sats. Check it out on the map: https://mappingbitcoin.com/places/[slug]`
                            );
                            setHashtags(["bitcoin", "bitcoinmerchant", "mappingbitcoin"]);
                        }}
                        className="p-3 bg-surface-light hover:bg-border-light border border-border-light rounded-lg text-left transition-colors"
                    >
                        <p className="text-white font-medium text-sm">New Place</p>
                        <p className="text-text-light text-xs mt-1">
                            Announce a new merchant on the map
                        </p>
                    </button>

                    <button
                        onClick={() => {
                            setContent(
                                `Verified! [Name] in [City, Country] is officially confirmed. Trust, but verify. https://mappingbitcoin.com/places/[slug]`
                            );
                            setHashtags(["bitcoin", "bitcoinmerchant", "verified", "mappingbitcoin"]);
                        }}
                        className="p-3 bg-surface-light hover:bg-border-light border border-border-light rounded-lg text-left transition-colors"
                    >
                        <p className="text-white font-medium text-sm">Verified Place</p>
                        <p className="text-text-light text-xs mt-1">
                            Announce a verified merchant
                        </p>
                    </button>

                    <button
                        onClick={() => {
                            setContent(
                                `The circular economy grows stronger every day.\n\nThis week: [X] new merchants added across [Y] countries.\n\nHelp us map them all → https://mappingbitcoin.com/places/create`
                            );
                            setHashtags(["bitcoin", "circulareconomy"]);
                        }}
                        className="p-3 bg-surface-light hover:bg-border-light border border-border-light rounded-lg text-left transition-colors"
                    >
                        <p className="text-white font-medium text-sm">Weekly Update</p>
                        <p className="text-text-light text-xs mt-1">
                            Weekly growth statistics
                        </p>
                    </button>

                    <button
                        onClick={() => {
                            setContent(
                                `GM, Bitcoin plebs! ☀️\n\nReminder that every time you spend Bitcoin at a local merchant, you're:\n\n1. Proving Bitcoin works as money\n2. Giving that merchant a reason to keep accepting\n3. Building the future you want to see\n\nFind a place to spend today: https://mappingbitcoin.com/map`
                            );
                            setHashtags(["gm", "bitcoin", "spendbitcoin"]);
                        }}
                        className="p-3 bg-surface-light hover:bg-border-light border border-border-light rounded-lg text-left transition-colors"
                    >
                        <p className="text-white font-medium text-sm">GM Post</p>
                        <p className="text-text-light text-xs mt-1">
                            Morning motivation post
                        </p>
                    </button>
                </div>
            </div>
        </div>
    );
}

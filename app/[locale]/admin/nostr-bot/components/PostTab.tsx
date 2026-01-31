"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { SendIcon, PlusIcon, CloseIcon, SearchIcon, CircleCheckIcon, PinIcon } from "@/assets/icons/ui";

type PostType = "manual" | "new" | "verified" | "created";
type PlaceFilter = "all" | "verified" | "unverified";

interface PlaceSearchResult {
    id: number;
    osmId: string;
    name: string;
    city: string;
    state?: string;
    country: string;
    category?: string;
    subcategory?: string;
    slug?: string;
    lat: number;
    lon: number;
    isVerified: boolean;
    verificationMethod?: string;
    verifierPubkey?: string;
    creatorPubkey?: string;
}

export default function PostTab() {
    const { authToken } = useNostrAuth();

    // Post type selection
    const [postType, setPostType] = useState<PostType>("manual");

    // Place search
    const [placeQuery, setPlaceQuery] = useState("");
    const [placeFilter, setPlaceFilter] = useState<PlaceFilter>("all");
    const [places, setPlaces] = useState<PlaceSearchResult[]>([]);
    const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(null);
    const [searchingPlaces, setSearchingPlaces] = useState(false);
    const [showPlaceDropdown, setShowPlaceDropdown] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Content
    const [content, setContent] = useState("");
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [hashtagInput, setHashtagInput] = useState("");
    const [url, setUrl] = useState("");
    const [useTemplate, setUseTemplate] = useState(true);

    // Submission
    const [posting, setPosting] = useState(false);
    const [lastResult, setLastResult] = useState<{
        success: boolean;
        eventId?: string;
        content?: string;
        relays?: { success: number; failed: number };
        error?: string;
        isDuplicate?: boolean;
        existingPostId?: string;
        existingPostDate?: string;
    } | null>(null);

    // Search for places
    const searchPlaces = useCallback(async (query: string, filter: PlaceFilter) => {
        if (!authToken) return;

        setSearchingPlaces(true);
        try {
            const params = new URLSearchParams({
                q: query,
                filter,
                limit: "15",
            });

            const res = await fetch(`/api/admin/nostr-bot/places?${params}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (res.ok) {
                const data = await res.json();
                setPlaces(data.places);
            }
        } catch (err) {
            console.error("Failed to search places:", err);
        } finally {
            setSearchingPlaces(false);
        }
    }, [authToken]);

    // Debounced search
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            searchPlaces(placeQuery, placeFilter);
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [placeQuery, placeFilter, searchPlaces]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowPlaceDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Update filter based on post type
    useEffect(() => {
        if (postType === "verified") {
            setPlaceFilter("verified");
        } else if (postType === "new" || postType === "created") {
            setPlaceFilter("all");
        }
    }, [postType]);

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

    const selectPlace = (place: PlaceSearchResult) => {
        setSelectedPlace(place);
        setPlaceQuery(place.name);
        setShowPlaceDropdown(false);

        // Auto-set default hashtags based on place
        const defaultHashtags = ["bitcoin", "mappingbitcoin"];
        if (place.isVerified && postType === "verified") {
            defaultHashtags.push("verified");
        }
        if (place.country) {
            defaultHashtags.push(place.country.toLowerCase().replace(/\s+/g, ""));
        }
        setHashtags(defaultHashtags);
    };

    const clearSelectedPlace = () => {
        setSelectedPlace(null);
        setPlaceQuery("");
        setPlaces([]);
    };

    const handleSubmit = async () => {
        if (!authToken) {
            toast.error("Authentication required");
            return;
        }

        // Validate based on post type
        if (postType === "manual") {
            if (!content.trim()) {
                toast.error("Content is required");
                return;
            }
        } else {
            if (!selectedPlace) {
                toast.error("Please select a place");
                return;
            }
            if (!useTemplate && !content.trim()) {
                toast.error("Content is required when not using template");
                return;
            }
        }

        setPosting(true);
        setLastResult(null);

        try {
            let body: Record<string, unknown>;

            if (postType === "manual") {
                body = {
                    content: content.trim(),
                    hashtags,
                    url: url.trim() || undefined,
                };
            } else {
                body = {
                    postType,
                    place: selectedPlace,
                    useTemplate,
                    customContent: useTemplate ? undefined : content.trim(),
                    hashtags: useTemplate ? undefined : hashtags,
                };
            }

            const res = await fetch("/api/admin/nostr-bot/posts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                // Handle duplicate post error specially
                if (res.status === 409 && data.existingPostId) {
                    setLastResult({
                        success: false,
                        error: data.error,
                        isDuplicate: true,
                        existingPostId: data.existingPostId,
                        existingPostDate: data.existingPostDate,
                    });
                    toast.error("This post already exists!");
                    return;
                }
                throw new Error(data.error || "Failed to post");
            }

            setLastResult({
                success: true,
                eventId: data.eventId,
                content: data.content,
                relays: data.relays,
            });

            toast.success(`Posted! Published to ${data.relays.success} relays`);

            // Clear form
            setContent("");
            setHashtags([]);
            setUrl("");
            setSelectedPlace(null);
            setPlaceQuery("");
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

    const isPlaceBasedPost = postType !== "manual";

    return (
        <div className="space-y-6">
            {/* Post Type Selection */}
            <div className="bg-surface border border-border-light rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Post Type</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                        onClick={() => {
                            setPostType("manual");
                            clearSelectedPlace();
                        }}
                        className={`p-3 rounded-lg border transition-colors text-left ${
                            postType === "manual"
                                ? "bg-accent/20 border-accent text-accent"
                                : "bg-surface-light border-border-light text-text-light hover:border-accent/50"
                        }`}
                    >
                        <p className="font-medium text-sm">Manual Post</p>
                        <p className="text-xs mt-1 opacity-70">Write custom content</p>
                    </button>

                    <button
                        onClick={() => {
                            setPostType("new");
                            clearSelectedPlace();
                        }}
                        className={`p-3 rounded-lg border transition-colors text-left ${
                            postType === "new"
                                ? "bg-accent/20 border-accent text-accent"
                                : "bg-surface-light border-border-light text-text-light hover:border-accent/50"
                        }`}
                    >
                        <p className="font-medium text-sm">New Place</p>
                        <p className="text-xs mt-1 opacity-70">Announce a listing</p>
                    </button>

                    <button
                        onClick={() => {
                            setPostType("verified");
                            clearSelectedPlace();
                        }}
                        className={`p-3 rounded-lg border transition-colors text-left ${
                            postType === "verified"
                                ? "bg-green-500/20 border-green-500 text-green-400"
                                : "bg-surface-light border-border-light text-text-light hover:border-green-500/50"
                        }`}
                    >
                        <div className="flex items-center gap-1">
                            <CircleCheckIcon className="w-4 h-4" />
                            <p className="font-medium text-sm">Verified Place</p>
                        </div>
                        <p className="text-xs mt-1 opacity-70">Announce verification</p>
                    </button>

                    <button
                        onClick={() => {
                            setPostType("created");
                            clearSelectedPlace();
                        }}
                        className={`p-3 rounded-lg border transition-colors text-left ${
                            postType === "created"
                                ? "bg-blue-500/20 border-blue-500 text-blue-400"
                                : "bg-surface-light border-border-light text-text-light hover:border-blue-500/50"
                        }`}
                    >
                        <div className="flex items-center gap-1">
                            <PinIcon className="w-4 h-4" />
                            <p className="font-medium text-sm">Created Place</p>
                        </div>
                        <p className="text-xs mt-1 opacity-70">New submission</p>
                    </button>
                </div>
            </div>

            {/* Place Search (for place-based posts) */}
            {isPlaceBasedPost && (
                <div className="bg-surface border border-border-light rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Select Place</h2>

                    {/* Filter tabs for verified status */}
                    {postType !== "verified" && (
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setPlaceFilter("all")}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                    placeFilter === "all"
                                        ? "bg-accent text-white"
                                        : "bg-surface-light text-text-light hover:bg-border-light"
                                }`}
                            >
                                All Places
                            </button>
                            <button
                                onClick={() => setPlaceFilter("verified")}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                    placeFilter === "verified"
                                        ? "bg-green-500 text-white"
                                        : "bg-surface-light text-text-light hover:bg-border-light"
                                }`}
                            >
                                Verified Only
                            </button>
                            <button
                                onClick={() => setPlaceFilter("unverified")}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                    placeFilter === "unverified"
                                        ? "bg-amber-500 text-white"
                                        : "bg-surface-light text-text-light hover:bg-border-light"
                                }`}
                            >
                                Unverified Only
                            </button>
                        </div>
                    )}

                    {/* Selected Place Display */}
                    {selectedPlace ? (
                        <div className="flex items-center gap-3 p-3 bg-surface-light border border-accent rounded-lg">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-medium">{selectedPlace.name}</span>
                                    {selectedPlace.isVerified && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                                            <CircleCheckIcon className="w-3 h-3" />
                                            {selectedPlace.verificationMethod}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-text-light mt-0.5">
                                    {[selectedPlace.city, selectedPlace.state, selectedPlace.country]
                                        .filter(Boolean)
                                        .join(", ")}
                                </p>
                                <p className="text-xs text-text-light/60 mt-1">
                                    OSM ID: {selectedPlace.osmId}
                                    {selectedPlace.category && ` • ${selectedPlace.category}`}
                                </p>
                            </div>
                            <button
                                onClick={clearSelectedPlace}
                                className="p-2 hover:bg-border-light rounded-lg transition-colors"
                            >
                                <CloseIcon className="w-4 h-4 text-text-light" />
                            </button>
                        </div>
                    ) : (
                        <div ref={dropdownRef} className="relative">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                                <input
                                    type="text"
                                    value={placeQuery}
                                    onChange={(e) => {
                                        setPlaceQuery(e.target.value);
                                        setShowPlaceDropdown(true);
                                    }}
                                    onFocus={() => setShowPlaceDropdown(true)}
                                    placeholder="Search for a place..."
                                    className="w-full pl-10 pr-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light/50 focus:outline-none focus:border-accent"
                                />
                                {searchingPlaces && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-accent" />
                                    </div>
                                )}
                            </div>

                            {/* Dropdown */}
                            {showPlaceDropdown && places.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-surface border border-border-light rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                    {places.map((place) => (
                                        <button
                                            key={place.osmId}
                                            onClick={() => selectPlace(place)}
                                            className="w-full px-4 py-3 text-left hover:bg-surface-light transition-colors border-b border-border-light last:border-b-0"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-medium">{place.name}</span>
                                                {place.isVerified && (
                                                    <CircleCheckIcon className="w-4 h-4 text-green-400" />
                                                )}
                                            </div>
                                            <p className="text-sm text-text-light">
                                                {[place.city, place.country].filter(Boolean).join(", ")}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Template Toggle */}
                    {selectedPlace && (
                        <div className="mt-4 flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={useTemplate}
                                    onChange={(e) => setUseTemplate(e.target.checked)}
                                    className="w-4 h-4 rounded border-border-light bg-surface-light text-accent focus:ring-accent focus:ring-offset-0"
                                />
                                <span className="text-sm text-text-light">
                                    Use random template (1 of 30 variations)
                                </span>
                            </label>
                        </div>
                    )}
                </div>
            )}

            {/* Content Form */}
            <div className="bg-surface border border-border-light rounded-lg p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                    {isPlaceBasedPost && useTemplate ? "Preview (template will be generated)" : "Content"}
                </h2>

                <div className="space-y-4">
                    {/* Content textarea - only shown if manual or not using template */}
                    {(!isPlaceBasedPost || !useTemplate) && (
                        <div>
                            <label className="block text-sm text-text-light mb-1">Content</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={
                                    isPlaceBasedPost
                                        ? "Write your custom announcement..."
                                        : "What's happening in the Bitcoin world?"
                                }
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
                    )}

                    {/* Template preview for place-based posts */}
                    {isPlaceBasedPost && useTemplate && selectedPlace && (
                        <div className="p-4 bg-surface-light rounded-lg border border-border-light">
                            <p className="text-xs text-text-light mb-2">Template Preview (example):</p>
                            <p className="text-white text-sm">
                                {postType === "verified"
                                    ? `Verified! ${selectedPlace.name} in ${selectedPlace.city}, ${selectedPlace.country} is officially confirmed via ${selectedPlace.verificationMethod?.toLowerCase() || "verification"}. Trust, but verify. https://mappingbitcoin.com/places/${selectedPlace.slug || selectedPlace.osmId}`
                                    : `New Bitcoin spot just dropped! ${selectedPlace.name} in ${selectedPlace.city}, ${selectedPlace.country} now accepts sats. Check it out on the map: https://mappingbitcoin.com/places/${selectedPlace.slug || selectedPlace.osmId}`}
                            </p>
                            <p className="text-xs text-text-light/60 mt-2 italic">
                                Actual content will be randomly selected from 30 template variations
                            </p>
                        </div>
                    )}

                    {/* Hashtags - shown for manual or when not using template */}
                    {(!isPlaceBasedPost || !useTemplate) && (
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
                    )}

                    {/* Tags info for template posts */}
                    {isPlaceBasedPost && useTemplate && selectedPlace && (
                        <div>
                            <label className="block text-sm text-text-light mb-2">Nostr Tags (auto-generated)</label>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                                    osm: {selectedPlace.osmId}
                                </span>
                                <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded">
                                    post-type: {postType}
                                </span>
                                {postType === "verified" && selectedPlace.verificationMethod && (
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                                        verification-method: {selectedPlace.verificationMethod.toLowerCase()}
                                    </span>
                                )}
                                <span className="px-2 py-1 bg-accent/20 text-accent text-xs rounded">#bitcoin</span>
                                <span className="px-2 py-1 bg-accent/20 text-accent text-xs rounded">#mappingbitcoin</span>
                                <span className="px-2 py-1 bg-accent/20 text-accent text-xs rounded">#bitcoinmerchant</span>
                                {postType === "verified" && (
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">#verified</span>
                                )}
                                {selectedPlace.country && (
                                    <span className="px-2 py-1 bg-accent/20 text-accent text-xs rounded">
                                        #{selectedPlace.country.toLowerCase().replace(/\s+/g, "")}
                                    </span>
                                )}
                                {selectedPlace.verifierPubkey && postType === "verified" && (
                                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                                        p: {selectedPlace.verifierPubkey.slice(0, 8)}...
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-text-light/60 mt-2">
                                Duplicate detection: Posts are matched by OSM ID, post type, verifier, and verification method
                            </p>
                        </div>
                    )}

                    {/* URL Reference - only for manual posts */}
                    {!isPlaceBasedPost && (
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
                    )}

                    {/* Submit */}
                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleSubmit}
                            disabled={
                                posting ||
                                (postType === "manual" && !content.trim()) ||
                                (isPlaceBasedPost && !selectedPlace)
                            }
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
                            : lastResult.isDuplicate
                            ? "bg-amber-500/10 border border-amber-500/30"
                            : "bg-red-500/10 border border-red-500/30"
                    }`}
                >
                    {lastResult.success ? (
                        <div>
                            <p className="text-green-400 font-medium">Post Published!</p>
                            <div className="mt-2 space-y-2 text-sm">
                                {lastResult.content && (
                                    <div className="p-3 bg-surface-light rounded border border-border-light">
                                        <p className="text-xs text-text-light mb-1">Posted Content:</p>
                                        <p className="text-white text-sm">{lastResult.content}</p>
                                    </div>
                                )}
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
                    ) : lastResult.isDuplicate ? (
                        <div>
                            <p className="text-amber-400 font-medium">Duplicate Post Detected</p>
                            <p className="text-sm text-text-light mt-1">{lastResult.error}</p>
                            {lastResult.existingPostId && (
                                <div className="mt-3 p-3 bg-surface-light rounded border border-border-light">
                                    <p className="text-xs text-text-light mb-1">Existing Post:</p>
                                    <p className="text-white text-sm font-mono break-all">
                                        {lastResult.existingPostId}
                                    </p>
                                    {lastResult.existingPostDate && (
                                        <p className="text-xs text-text-light mt-1">
                                            Posted on: {new Date(lastResult.existingPostDate).toLocaleString()}
                                        </p>
                                    )}
                                    <a
                                        href={`https://njump.me/${lastResult.existingPostId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block mt-2 text-accent hover:text-accent-light transition-colors text-sm"
                                    >
                                        View existing post →
                                    </a>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <p className="text-red-400 font-medium">Failed to Post</p>
                            <p className="text-sm text-text-light mt-1">{lastResult.error}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Quick Templates - only for manual posts */}
            {postType === "manual" && (
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
                                    `GM, Bitcoin plebs!\n\nReminder that every time you spend Bitcoin at a local merchant, you're:\n\n1. Proving Bitcoin works as money\n2. Giving that merchant a reason to keep accepting\n3. Building the future you want to see\n\nFind a place to spend today: https://mappingbitcoin.com/map`
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
            )}
        </div>
    );
}

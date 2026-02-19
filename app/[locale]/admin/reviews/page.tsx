"use client";

import { useState, useEffect, useCallback } from "react";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import Button from "@/components/ui/Button";
import {
    StarIcon,
    CheckmarkIcon,
    WarningIcon,
    TrashIcon,
    RefreshIcon,
    ExternalLinkIcon,
    CopyIcon,
} from "@/assets/icons/ui";
import toast from "react-hot-toast";

interface Review {
    id: string;
    eventId: string;
    venueId: string;
    authorPubkey: string;
    rating: number | null;
    content: string | null;
    eventCreatedAt: string;
    indexedAt: string;
    spamScore: number | null;
    spamStatus: "PENDING" | "APPROVED" | "FLAGGED" | "BLOCKED";
    spamReasons: string[];
    wotDistance: number | null;
    wotPathCount: number | null;
    imageUrls: string[];
    thumbnailUrls: string[];
    author: {
        pubkey: string;
        name: string | null;
        picture: string | null;
        nip05: string | null;
    };
    venue: {
        id: string;
    };
}

interface ReviewsResponse {
    reviews: Review[];
    total: number;
    page: number;
    pageSize: number;
}

type FilterStatus = "all" | "PENDING" | "FLAGGED" | "APPROVED" | "BLOCKED";

export default function AdminReviewsPage() {
    const { authToken } = useNostrAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
    const [updatingReview, setUpdatingReview] = useState<string | null>(null);

    const fetchReviews = useCallback(async () => {
        if (!authToken) return;

        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: "20",
            });
            if (filterStatus !== "all") {
                params.set("status", filterStatus);
            }

            const response = await fetch(`/api/admin/reviews?${params}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) throw new Error("Failed to fetch reviews");

            const data: ReviewsResponse = await response.json();
            setReviews(data.reviews);
            setTotal(data.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load reviews");
        } finally {
            setLoading(false);
        }
    }, [authToken, page, filterStatus]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const updateStatus = async (reviewId: string, status: "APPROVED" | "BLOCKED") => {
        if (!authToken) return;

        setUpdatingReview(reviewId);
        try {
            const response = await fetch("/api/admin/reviews/status", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ reviewId, status }),
            });

            if (!response.ok) throw new Error("Failed to update status");

            toast.success(`Review ${status.toLowerCase()}`);
            fetchReviews();
        } catch (err) {
            toast.error("Failed to update review status");
        } finally {
            setUpdatingReview(null);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied`);
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: "bg-gray-500/20 text-gray-400",
            APPROVED: "bg-green-500/20 text-green-400",
            FLAGGED: "bg-amber-500/20 text-amber-400",
            BLOCKED: "bg-red-500/20 text-red-400",
        };
        return styles[status] || styles.PENDING;
    };

    const getWoTBadge = (distance: number | null) => {
        if (distance === null) return { label: "Unknown", class: "bg-gray-500/20 text-gray-400" };
        if (distance === 0) return { label: "You", class: "bg-green-500/20 text-green-400" };
        if (distance === 1) return { label: "Direct", class: "bg-emerald-500/20 text-emerald-400" };
        if (distance === 2) return { label: "2nd", class: "bg-yellow-500/20 text-yellow-400" };
        if (distance === 3) return { label: "3rd", class: "bg-orange-500/20 text-orange-400" };
        return { label: `${distance}+`, class: "bg-gray-500/20 text-gray-400" };
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString();
    };

    const totalPages = Math.ceil(total / 20);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Reviews</h1>
                    <p className="text-text-light">Moderate and view all reviews with event IDs</p>
                </div>
                <Button
                    onClick={fetchReviews}
                    variant="outline"
                    leftIcon={<RefreshIcon className="w-4 h-4" />}
                    disabled={loading}
                >
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <span className="text-sm text-text-light">Filter:</span>
                <div className="flex gap-2">
                    {(["all", "PENDING", "FLAGGED", "APPROVED", "BLOCKED"] as FilterStatus[]).map((status) => (
                        <button
                            key={status}
                            onClick={() => { setFilterStatus(status); setPage(1); }}
                            className={`px-3 py-1 text-sm rounded-full transition-colors ${
                                filterStatus === status
                                    ? "bg-accent text-white"
                                    : "bg-surface-light text-text-light hover:text-white"
                            }`}
                        >
                            {status === "all" ? "All" : status}
                        </button>
                    ))}
                </div>
                <span className="text-sm text-text-light ml-auto">
                    {total} reviews
                </span>
            </div>

            {/* Reviews List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
            ) : error ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                    {error}
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-12 text-text-light">
                    No reviews found
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => {
                        const wotBadge = getWoTBadge(review.wotDistance);
                        return (
                            <div
                                key={review.id}
                                className="bg-surface rounded-xl border border-border-light p-4"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="flex items-center gap-3">
                                        {review.author.picture ? (
                                            <img
                                                src={review.author.picture}
                                                alt=""
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-surface-light flex items-center justify-center text-text-light">
                                                ?
                                            </div>
                                        )}
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-white">
                                                    {review.author.name || review.authorPubkey.slice(0, 12) + "..."}
                                                </span>
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(review.spamStatus)}`}>
                                                    {review.spamStatus}
                                                </span>
                                                <span className={`px-2 py-0.5 text-xs rounded-full ${wotBadge.class}`}>
                                                    WoT: {wotBadge.label}
                                                </span>
                                            </div>
                                            {review.author.nip05 && (
                                                <span className="text-xs text-text-light">{review.author.nip05}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {review.rating !== null && (
                                            <div className="flex items-center gap-1 text-yellow-400">
                                                <StarIcon className="w-4 h-4 fill-current" />
                                                <span>{review.rating}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                {review.content && (
                                    <p className="text-text-light mb-3 whitespace-pre-wrap">
                                        {review.content}
                                    </p>
                                )}

                                {/* Images */}
                                {review.thumbnailUrls.length > 0 && (
                                    <div className="flex gap-2 mb-3 overflow-x-auto">
                                        {review.thumbnailUrls.map((url, i) => (
                                            <img
                                                key={i}
                                                src={url}
                                                alt=""
                                                className="h-16 w-16 object-cover rounded-lg"
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Spam reasons */}
                                {review.spamReasons.length > 0 && (
                                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 mb-3">
                                        <p className="text-xs text-amber-400 font-medium mb-1">Spam reasons:</p>
                                        <ul className="text-xs text-amber-300 list-disc list-inside">
                                            {review.spamReasons.map((reason, i) => (
                                                <li key={i}>{reason}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Event ID and metadata */}
                                <div className="border-t border-border-light pt-3 mt-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-text-light">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Event ID:</span>
                                            <code className="bg-surface-light px-1 rounded">{review.eventId.slice(0, 16)}...</code>
                                            <button
                                                onClick={() => copyToClipboard(review.eventId, "Event ID")}
                                                className="p-1 hover:text-white transition-colors"
                                            >
                                                <CopyIcon className="w-3 h-3" />
                                            </button>
                                            <a
                                                href={`https://njump.me/${review.eventId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1 hover:text-white transition-colors"
                                            >
                                                <ExternalLinkIcon className="w-3 h-3" />
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Venue:</span>
                                            <code className="bg-surface-light px-1 rounded">{review.venueId}</code>
                                            <button
                                                onClick={() => copyToClipboard(review.venueId, "Venue ID")}
                                                className="p-1 hover:text-white transition-colors"
                                            >
                                                <CopyIcon className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div>
                                            <span className="font-medium">Created:</span> {formatDate(review.eventCreatedAt)}
                                        </div>
                                        <div>
                                            <span className="font-medium">Indexed:</span> {formatDate(review.indexedAt)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Author:</span>
                                            <code className="bg-surface-light px-1 rounded">{review.authorPubkey.slice(0, 16)}...</code>
                                            <button
                                                onClick={() => copyToClipboard(review.authorPubkey, "Pubkey")}
                                                className="p-1 hover:text-white transition-colors"
                                            >
                                                <CopyIcon className="w-3 h-3" />
                                            </button>
                                            <a
                                                href={`https://njump.me/${review.authorPubkey}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1 hover:text-white transition-colors"
                                            >
                                                <ExternalLinkIcon className="w-3 h-3" />
                                            </a>
                                        </div>
                                        {review.spamScore !== null && (
                                            <div>
                                                <span className="font-medium">Spam Score:</span> {(review.spamScore * 100).toFixed(1)}%
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                {review.spamStatus !== "APPROVED" && review.spamStatus !== "BLOCKED" && (
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-light">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            color="success"
                                            leftIcon={<CheckmarkIcon className="w-4 h-4" />}
                                            onClick={() => updateStatus(review.id, "APPROVED")}
                                            loading={updatingReview === review.id}
                                            disabled={updatingReview !== null}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            color="danger"
                                            leftIcon={<TrashIcon className="w-4 h-4" />}
                                            onClick={() => updateStatus(review.id, "BLOCKED")}
                                            loading={updatingReview === review.id}
                                            disabled={updatingReview !== null}
                                        >
                                            Block
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-text-light">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || loading}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}

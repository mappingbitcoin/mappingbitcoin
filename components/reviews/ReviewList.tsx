"use client";

import React, { useState } from "react";
import ReviewCard from "./ReviewCard";
import { WeightedRating } from "./TrustBadge";
import { ChatIcon, SpinnerIcon } from "@/assets/icons/ui";
import type { ReviewWithTrust } from "@/lib/db/services/reviews";

interface ReviewListProps {
    reviews: ReviewWithTrust[];
    weightedAverageRating: number | null;
    simpleAverageRating: number | null;
    totalReviews: number;
    isLoading: boolean;
    error: string | null;
    onReply?: (reviewEventId: string, reviewAuthorPubkey: string) => void;
    activeReplyId?: string | null;
    replyForm?: React.ReactNode;
    ownerPubkey?: string;
}

type SortOption = "trust" | "date";

export default function ReviewList({
    reviews,
    weightedAverageRating,
    simpleAverageRating,
    totalReviews,
    isLoading,
    error,
    onReply,
    activeReplyId,
    replyForm,
    ownerPubkey,
}: ReviewListProps) {
    const [sortBy, setSortBy] = useState<SortOption>("trust");

    if (isLoading) {
        return <ReviewListSkeleton />;
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    if (reviews.length === 0) {
        return <EmptyState />;
    }

    const sortedReviews = [...reviews].sort((a, b) => {
        if (sortBy === "date") {
            return new Date(b.eventCreatedAt).getTime() - new Date(a.eventCreatedAt).getTime();
        }
        // Default: sort by trust score
        if (b.trustScore !== a.trustScore) {
            return b.trustScore - a.trustScore;
        }
        return new Date(b.eventCreatedAt).getTime() - new Date(a.eventCreatedAt).getTime();
    });

    return (
        <div className="space-y-6">
            {/* Rating Summary */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <WeightedRating
                    weightedRating={weightedAverageRating}
                    simpleRating={simpleAverageRating}
                    totalReviews={totalReviews}
                />

                {/* Sort Selector */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-text-light">Sort by:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="bg-surface border border-border-light rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                        <option value="trust">Trust Score</option>
                        <option value="date">Most Recent</option>
                    </select>
                </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
                {sortedReviews.map((review) => (
                    <ReviewCard
                        key={review.eventId}
                        review={review}
                        onReply={onReply}
                        showReplyForm={activeReplyId === review.eventId}
                        replyForm={activeReplyId === review.eventId ? replyForm : undefined}
                        ownerPubkey={ownerPubkey}
                    />
                ))}
            </div>
        </div>
    );
}

function ReviewListSkeleton() {
    return (
        <div className="space-y-6">
            {/* Rating Summary Skeleton */}
            <div className="flex items-center gap-4">
                <div className="h-8 w-16 bg-surface-light rounded animate-pulse" />
                <div className="h-4 w-32 bg-surface-light rounded animate-pulse" />
            </div>

            {/* Reviews Skeleton */}
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="bg-surface-light rounded-lg border border-border-light p-4 space-y-3"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-surface animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-4 w-24 bg-surface rounded animate-pulse" />
                                <div className="h-3 w-16 bg-surface rounded animate-pulse" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 w-full bg-surface rounded animate-pulse" />
                            <div className="h-3 w-3/4 bg-surface rounded animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="text-center py-12">
            <ChatIcon className="w-12 h-12 mx-auto text-text-light mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Reviews Yet</h3>
            <p className="text-text-light text-sm max-w-md mx-auto">
                Be the first to share your experience at this venue!
            </p>
        </div>
    );
}

"use client";

import React, { useState, useCallback } from "react";
import ReviewForm from "./ReviewForm";
import ReviewList from "./ReviewList";
import ReplyForm from "./ReplyForm";
import { useReviews } from "@/hooks/useReviews";

interface ReviewsSectionProps {
    osmId: string;
    venueSlug: string;
    ownerPubkey?: string;
    geohash?: string;
}

export default function ReviewsSection({
    osmId,
    venueSlug,
    ownerPubkey,
    geohash,
}: ReviewsSectionProps) {
    const {
        reviews,
        weightedAverageRating,
        simpleAverageRating,
        totalReviews,
        isLoading,
        error,
        submitReview,
        submitReply,
        isSubmitting,
        submitError,
    } = useReviews({ osmId, venueSlug, geohash });

    const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
    const [activeReplyAuthor, setActiveReplyAuthor] = useState<string | null>(null);

    const handleReply = useCallback((reviewEventId: string, reviewAuthorPubkey: string) => {
        if (activeReplyId === reviewEventId) {
            // Toggle off if clicking same review
            setActiveReplyId(null);
            setActiveReplyAuthor(null);
        } else {
            setActiveReplyId(reviewEventId);
            setActiveReplyAuthor(reviewAuthorPubkey);
        }
    }, [activeReplyId]);

    const handleSubmitReply = useCallback(async (content: string): Promise<boolean> => {
        if (!activeReplyId || !activeReplyAuthor) return false;

        const success = await submitReply(activeReplyId, activeReplyAuthor, content);
        if (success) {
            setActiveReplyId(null);
            setActiveReplyAuthor(null);
        }
        return success;
    }, [activeReplyId, activeReplyAuthor, submitReply]);

    const handleCancelReply = useCallback(() => {
        setActiveReplyId(null);
        setActiveReplyAuthor(null);
    }, []);

    return (
        <div className="space-y-8">
            {/* Review Form */}
            <ReviewForm
                onSubmit={submitReview}
                isSubmitting={isSubmitting}
                error={submitError}
            />

            {/* Reviews List */}
            <ReviewList
                reviews={reviews}
                weightedAverageRating={weightedAverageRating}
                simpleAverageRating={simpleAverageRating}
                totalReviews={totalReviews}
                isLoading={isLoading}
                error={error}
                onReply={handleReply}
                activeReplyId={activeReplyId}
                replyForm={
                    <ReplyForm
                        onSubmit={handleSubmitReply}
                        onCancel={handleCancelReply}
                        isSubmitting={isSubmitting}
                        error={submitError}
                    />
                }
                ownerPubkey={ownerPubkey}
            />
        </div>
    );
}

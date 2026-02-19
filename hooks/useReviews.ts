"use client";

import { useState, useEffect, useCallback } from "react";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { useNostrPublish } from "./useNostrPublish";
import { NOSTR_KINDS, createReviewTags, createReviewReplyTags } from "@/lib/nostr/constants";
import type { ReviewWithTrust, ReviewsWithTrustResult } from "@/lib/db/services/reviews";

interface UseReviewsOptions {
    osmId: string;
    venueSlug: string;
    geohash?: string;
}

interface UseReviewsReturn {
    reviews: ReviewWithTrust[];
    weightedAverageRating: number | null;
    simpleAverageRating: number | null;
    totalReviews: number;
    /** Verified owner pubkey - only they can reply to reviews */
    ownerPubkey: string | null;
    isLoading: boolean;
    error: string | null;
    submitReview: (rating: number, content?: string, imageUrls?: string[]) => Promise<boolean>;
    submitReply: (reviewEventId: string, reviewAuthorPubkey: string, content: string) => Promise<boolean>;
    isSubmitting: boolean;
    submitError: string | null;
    refetch: () => Promise<void>;
}

export function useReviews({ osmId, venueSlug, geohash }: UseReviewsOptions): UseReviewsReturn {
    const { user, profile } = useNostrAuth();
    const { publishEvent, isPublishing, error: publishError, clearError } = useNostrPublish();

    const [reviews, setReviews] = useState<ReviewWithTrust[]>([]);
    const [weightedAverageRating, setWeightedAverageRating] = useState<number | null>(null);
    const [simpleAverageRating, setSimpleAverageRating] = useState<number | null>(null);
    const [totalReviews, setTotalReviews] = useState(0);
    const [ownerPubkey, setOwnerPubkey] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Fetch reviews
    const fetchReviews = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/places/${venueSlug}/reviews`);
            if (!response.ok) {
                throw new Error("Failed to fetch reviews");
            }

            const data: ReviewsWithTrustResult & { osmId: string } = await response.json();

            setReviews(data.reviews);
            setWeightedAverageRating(data.weightedAverageRating);
            setSimpleAverageRating(data.simpleAverageRating);
            setTotalReviews(data.totalReviews);
            setOwnerPubkey(data.ownerPubkey);
        } catch (err) {
            console.error("[useReviews] Fetch error:", err);
            setError(err instanceof Error ? err.message : "Failed to load reviews");
        } finally {
            setIsLoading(false);
        }
    }, [venueSlug]);

    // Initial fetch
    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    // Submit a review
    const submitReview = useCallback(async (rating: number, content?: string, imageUrls?: string[]): Promise<boolean> => {
        if (!user || user.mode !== "write") {
            setSubmitError("You must be logged in with write access to submit a review");
            return false;
        }

        setSubmitError(null);
        clearError();

        try {
            // Create the review event with multiple image tags
            const tags = createReviewTags(osmId, rating, geohash, imageUrls);
            const event = {
                kind: NOSTR_KINDS.VENUE_REVIEW,
                tags,
                content: content || "",
            };

            // Sign and publish
            const result = await publishEvent(event);
            if (!result) {
                setSubmitError(publishError || "Failed to publish review");
                return false;
            }

            // Index immediately for instant display
            let thumbnailUrls: string[] = [];
            try {
                const indexResponse = await fetch("/api/reviews/index", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "review",
                        eventId: result.signedEvent.id,
                        osmId,
                        authorPubkey: user.pubkey,
                        rating,
                        content: content || null,
                        eventCreatedAt: result.signedEvent.created_at,
                        authorProfile: profile ? {
                            name: profile.name || profile.display_name,
                            picture: profile.picture,
                            nip05: profile.nip05,
                        } : undefined,
                        imageUrls: imageUrls || [],
                    }),
                });

                if (!indexResponse.ok) {
                    const data = await indexResponse.json();
                    if (data.blocked) {
                        setSubmitError("Your review was flagged as spam. Please try again with different content.");
                        return false;
                    }
                } else {
                    // Get thumbnail URLs from response for optimistic update
                    const data = await indexResponse.json();
                    thumbnailUrls = data.thumbnailUrls || [];
                }
            } catch (indexErr) {
                console.error("[useReviews] Index error (non-fatal):", indexErr);
                // Continue anyway - relay listener will index eventually
            }

            // Optimistic update: add review to list
            const newReview: ReviewWithTrust = {
                id: result.signedEvent.id,
                eventId: result.signedEvent.id,
                authorPubkey: user.pubkey,
                rating,
                content: content || null,
                eventCreatedAt: new Date(result.signedEvent.created_at * 1000),
                indexedAt: new Date(),
                trustScore: 0.02, // Default for new users, will be corrected on refetch
                imageUrls: imageUrls || [],
                thumbnailUrls: thumbnailUrls,
                author: {
                    pubkey: user.pubkey,
                    name: profile?.name || profile?.display_name || null,
                    picture: profile?.picture || null,
                    nip05: profile?.nip05 || null,
                },
                replies: [],
            };

            setReviews((prev) => [newReview, ...prev]);
            setTotalReviews((prev) => prev + 1);

            // Recalculate ratings (simplified - proper calculation would need all reviews)
            if (rating) {
                setSimpleAverageRating((prev) => {
                    if (prev === null) return rating;
                    return (prev * (totalReviews) + rating) / (totalReviews + 1);
                });
                setWeightedAverageRating((prev) => {
                    // Simplified - just use simple average for optimistic update
                    if (prev === null) return rating;
                    return (prev * (totalReviews) + rating) / (totalReviews + 1);
                });
            }

            return true;
        } catch (err) {
            console.error("[useReviews] Submit error:", err);
            setSubmitError(err instanceof Error ? err.message : "Failed to submit review");
            return false;
        }
    }, [user, profile, osmId, geohash, publishEvent, publishError, clearError, totalReviews]);

    // Submit a reply
    const submitReply = useCallback(async (
        reviewEventId: string,
        reviewAuthorPubkey: string,
        content: string
    ): Promise<boolean> => {
        if (!user || user.mode !== "write") {
            setSubmitError("You must be logged in with write access to reply");
            return false;
        }

        if (!content.trim()) {
            setSubmitError("Reply content cannot be empty");
            return false;
        }

        setSubmitError(null);
        clearError();

        try {
            // Create the reply event
            const tags = createReviewReplyTags(reviewEventId, reviewAuthorPubkey, osmId);
            const event = {
                kind: NOSTR_KINDS.REVIEW_REPLY,
                tags,
                content: content.trim(),
            };

            // Sign and publish
            const result = await publishEvent(event);
            if (!result) {
                setSubmitError(publishError || "Failed to publish reply");
                return false;
            }

            // Index immediately
            try {
                await fetch("/api/reviews/index", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "reply",
                        eventId: result.signedEvent.id,
                        osmId,
                        reviewEventId,
                        authorPubkey: user.pubkey,
                        content: content.trim(),
                        eventCreatedAt: result.signedEvent.created_at,
                        authorProfile: profile ? {
                            name: profile.name || profile.display_name,
                            picture: profile.picture,
                            nip05: profile.nip05,
                        } : undefined,
                    }),
                });
            } catch (indexErr) {
                console.error("[useReviews] Reply index error (non-fatal):", indexErr);
            }

            // Optimistic update: add reply to the review
            // Note: Only verified owners can reply, so isOwnerReply is always true
            const newReply = {
                id: result.signedEvent.id,
                eventId: result.signedEvent.id,
                authorPubkey: user.pubkey,
                content: content.trim(),
                isOwnerReply: true,
                eventCreatedAt: new Date(result.signedEvent.created_at * 1000),
                author: {
                    pubkey: user.pubkey,
                    name: profile?.name || profile?.display_name || null,
                    picture: profile?.picture || null,
                    nip05: profile?.nip05 || null,
                },
            };

            setReviews((prev) =>
                prev.map((review) =>
                    review.eventId === reviewEventId
                        ? { ...review, replies: [...review.replies, newReply] }
                        : review
                )
            );

            return true;
        } catch (err) {
            console.error("[useReviews] Reply error:", err);
            setSubmitError(err instanceof Error ? err.message : "Failed to submit reply");
            return false;
        }
    }, [user, profile, osmId, publishEvent, publishError, clearError]);

    return {
        reviews,
        weightedAverageRating,
        simpleAverageRating,
        totalReviews,
        ownerPubkey,
        isLoading,
        error,
        submitReview,
        submitReply,
        isSubmitting: isPublishing,
        submitError: submitError || publishError,
        refetch: fetchReviews,
    };
}

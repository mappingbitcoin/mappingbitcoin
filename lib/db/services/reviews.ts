import prisma from "../prisma";
import { getTrustScores } from "../../trust/graphBuilder";
import { checkReviewSpam, type SpamCheckResult } from "../../spam/reviewFilter";

export interface IndexReviewInput {
    eventId: string;
    osmId: string;
    authorPubkey: string;
    rating?: number | null;
    content?: string | null;
    eventCreatedAt: Date;
    authorProfile?: {
        name?: string | null;
        picture?: string | null;
        nip05?: string | null;
    };
    skipSpamCheck?: boolean;
    // Image support (multiple images)
    imageUrls?: string[];
    thumbnailUrls?: string[];
    thumbnailKeys?: string[];
}

export interface IndexReviewResult {
    review: Awaited<ReturnType<typeof prisma.review.upsert>>;
    spamCheck: SpamCheckResult | null;
    wasBlocked: boolean;
}

export async function indexReview(input: IndexReviewInput): Promise<IndexReviewResult> {
    const { eventId, osmId, authorPubkey, rating, content, eventCreatedAt, authorProfile, skipSpamCheck, imageUrls, thumbnailUrls, thumbnailKeys } = input;

    // Run spam check (unless skipped)
    let spamCheck: SpamCheckResult | null = null;
    if (!skipSpamCheck) {
        spamCheck = await checkReviewSpam(
            authorPubkey,
            osmId,
            content ?? null,
            rating ?? null
        );

        // If blocked, don't index the review
        if (spamCheck.action === "block") {
            console.log(`[SpamFilter] Blocked review from ${authorPubkey.substring(0, 8)}...`, spamCheck.reasons);
            return {
                review: null as unknown as Awaited<ReturnType<typeof prisma.review.upsert>>,
                spamCheck,
                wasBlocked: true,
            };
        }
    }

    // Determine spam status
    const spamStatus = !spamCheck
        ? "APPROVED" as const
        : spamCheck.action === "flag"
        ? "FLAGGED" as const
        : "APPROVED" as const;

    const review = await prisma.$transaction(async (tx) => {
        const venue = await tx.venue.upsert({
            where: { id: osmId },
            update: {},
            create: { id: osmId },
        });

        await tx.user.upsert({
            where: { pubkey: authorPubkey },
            update: authorProfile
                ? {
                      name: authorProfile.name,
                      picture: authorProfile.picture,
                      nip05: authorProfile.nip05,
                      profileUpdatedAt: new Date(),
                  }
                : {},
            create: {
                pubkey: authorPubkey,
                name: authorProfile?.name,
                picture: authorProfile?.picture,
                nip05: authorProfile?.nip05,
                profileUpdatedAt: authorProfile ? new Date() : null,
            },
        });

        return tx.review.upsert({
            where: { eventId },
            update: {
                rating,
                content,
                eventCreatedAt,
                indexedAt: new Date(),
                spamScore: spamCheck?.score ?? null,
                spamStatus,
                spamReasons: spamCheck?.reasons ?? [],
                imageUrls: imageUrls ?? [],
                thumbnailUrls: thumbnailUrls ?? [],
                thumbnailKeys: thumbnailKeys ?? [],
            },
            create: {
                eventId,
                venueId: venue.id,
                authorPubkey,
                rating,
                content,
                eventCreatedAt,
                spamScore: spamCheck?.score ?? null,
                spamStatus,
                spamReasons: spamCheck?.reasons ?? [],
                imageUrls: imageUrls ?? [],
                thumbnailUrls: thumbnailUrls ?? [],
                thumbnailKeys: thumbnailKeys ?? [],
            },
        });
    });

    if (spamCheck?.action === "flag") {
        console.log(`[SpamFilter] Flagged review from ${authorPubkey.substring(0, 8)}...`, spamCheck.reasons);
    }

    return {
        review,
        spamCheck,
        wasBlocked: false,
    };
}

export async function getReviewsByOsmId(osmId: string) {
    const venue = await prisma.venue.findUnique({
        where: { id: osmId },
        include: {
            reviews: {
                include: {
                    author: true,
                    replies: {
                        include: { author: true },
                        orderBy: { eventCreatedAt: "asc" },
                    },
                },
                orderBy: { eventCreatedAt: "desc" },
            },
        },
    });

    return venue?.reviews ?? [];
}

export async function getReviewByEventId(eventId: string) {
    return prisma.review.findUnique({
        where: { eventId },
        include: {
            author: true,
            venue: true,
            replies: {
                include: { author: true },
                orderBy: { eventCreatedAt: "asc" },
            },
        },
    });
}

export interface IndexReviewReplyInput {
    eventId: string;
    reviewEventId: string;
    authorPubkey: string;
    content: string;
    isOwnerReply?: boolean;
    eventCreatedAt: Date;
    authorProfile?: {
        name?: string | null;
        picture?: string | null;
        nip05?: string | null;
    };
}

export async function indexReviewReply(input: IndexReviewReplyInput) {
    const { eventId, reviewEventId, authorPubkey, content, isOwnerReply, eventCreatedAt, authorProfile } = input;

    return prisma.$transaction(async (tx) => {
        const review = await tx.review.findUnique({
            where: { eventId: reviewEventId },
        });

        if (!review) {
            throw new Error(`Parent review not found: ${reviewEventId}`);
        }

        await tx.user.upsert({
            where: { pubkey: authorPubkey },
            update: authorProfile
                ? {
                      name: authorProfile.name,
                      picture: authorProfile.picture,
                      nip05: authorProfile.nip05,
                      profileUpdatedAt: new Date(),
                  }
                : {},
            create: {
                pubkey: authorPubkey,
                name: authorProfile?.name,
                picture: authorProfile?.picture,
                nip05: authorProfile?.nip05,
                profileUpdatedAt: authorProfile ? new Date() : null,
            },
        });

        return tx.reviewReply.upsert({
            where: { eventId },
            update: {
                content,
                isOwnerReply: isOwnerReply ?? false,
                eventCreatedAt,
                indexedAt: new Date(),
            },
            create: {
                eventId,
                reviewId: review.id,
                authorPubkey,
                content,
                isOwnerReply: isOwnerReply ?? false,
                eventCreatedAt,
            },
        });
    });
}

export interface ReviewWithTrust {
    id: string;
    eventId: string;
    authorPubkey: string;
    rating: number | null;
    content: string | null;
    eventCreatedAt: Date;
    indexedAt: Date;
    trustScore: number;
    // Image support (multiple images)
    imageUrls: string[];
    thumbnailUrls: string[];
    author: {
        pubkey: string;
        name: string | null;
        picture: string | null;
        nip05: string | null;
    };
    replies: Array<{
        id: string;
        eventId: string;
        authorPubkey: string;
        content: string;
        isOwnerReply: boolean;
        eventCreatedAt: Date;
        author: {
            pubkey: string;
            name: string | null;
            picture: string | null;
            nip05: string | null;
        };
    }>;
}

export interface ReviewsWithTrustResult {
    reviews: ReviewWithTrust[];
    weightedAverageRating: number | null;
    simpleAverageRating: number | null;
    totalReviews: number;
}

/**
 * Get reviews with trust scores for a venue
 * Returns reviews sorted by trust score (highest first) and calculates weighted average rating
 */
export async function getReviewsWithTrustByOsmId(
    osmId: string,
    includeBlocked: boolean = false
): Promise<ReviewsWithTrustResult> {
    const venue = await prisma.venue.findUnique({
        where: { id: osmId },
        include: {
            reviews: {
                where: includeBlocked
                    ? {}
                    : { spamStatus: { not: "BLOCKED" } },
                include: {
                    author: true,
                    replies: {
                        include: { author: true },
                        orderBy: { eventCreatedAt: "asc" },
                    },
                },
                orderBy: { eventCreatedAt: "desc" },
            },
        },
    });

    if (!venue || venue.reviews.length === 0) {
        return {
            reviews: [],
            weightedAverageRating: null,
            simpleAverageRating: null,
            totalReviews: 0,
        };
    }

    // Get trust scores for all review authors
    const authorPubkeys = venue.reviews.map((r) => r.authorPubkey);
    const trustScores = await getTrustScores(authorPubkeys);

    // Attach trust scores to reviews
    const reviewsWithTrust: ReviewWithTrust[] = venue.reviews.map((review) => ({
        id: review.id,
        eventId: review.eventId,
        authorPubkey: review.authorPubkey,
        rating: review.rating,
        content: review.content,
        eventCreatedAt: review.eventCreatedAt,
        indexedAt: review.indexedAt,
        trustScore: trustScores.get(review.authorPubkey.toLowerCase()) ?? 0.02,
        imageUrls: review.imageUrls,
        thumbnailUrls: review.thumbnailUrls,
        author: {
            pubkey: review.author.pubkey,
            name: review.author.name,
            picture: review.author.picture,
            nip05: review.author.nip05,
        },
        replies: review.replies.map((reply) => ({
            id: reply.id,
            eventId: reply.eventId,
            authorPubkey: reply.authorPubkey,
            content: reply.content,
            isOwnerReply: reply.isOwnerReply,
            eventCreatedAt: reply.eventCreatedAt,
            author: {
                pubkey: reply.author.pubkey,
                name: reply.author.name,
                picture: reply.author.picture,
                nip05: reply.author.nip05,
            },
        })),
    }));

    // Sort by trust score (highest first), then by date
    reviewsWithTrust.sort((a, b) => {
        if (b.trustScore !== a.trustScore) {
            return b.trustScore - a.trustScore;
        }
        return new Date(b.eventCreatedAt).getTime() - new Date(a.eventCreatedAt).getTime();
    });

    // Calculate weighted average rating
    let weightedSum = 0;
    let weightSum = 0;
    let simpleSum = 0;
    let ratingCount = 0;

    for (const review of reviewsWithTrust) {
        if (review.rating !== null) {
            weightedSum += review.rating * review.trustScore;
            weightSum += review.trustScore;
            simpleSum += review.rating;
            ratingCount++;
        }
    }

    const weightedAverageRating = weightSum > 0 ? weightedSum / weightSum : null;
    const simpleAverageRating = ratingCount > 0 ? simpleSum / ratingCount : null;

    return {
        reviews: reviewsWithTrust,
        weightedAverageRating,
        simpleAverageRating,
        totalReviews: reviewsWithTrust.length,
    };
}

// ============================================
// Admin Moderation Functions
// ============================================

export type SpamStatusType = "PENDING" | "APPROVED" | "FLAGGED" | "BLOCKED";

/**
 * Update the spam status of a review (admin moderation)
 */
export async function updateReviewSpamStatus(
    reviewId: string,
    status: SpamStatusType,
    reason?: string
) {
    const existingReview = await prisma.review.findUnique({
        where: { id: reviewId },
        select: { spamReasons: true },
    });

    const updatedReasons = reason
        ? [...(existingReview?.spamReasons || []), `[Manual] ${reason}`]
        : existingReview?.spamReasons || [];

    return prisma.review.update({
        where: { id: reviewId },
        data: {
            spamStatus: status,
            spamReasons: updatedReasons,
        },
    });
}

/**
 * Get reviews pending moderation (flagged or pending status)
 */
export async function getFlaggedReviews(limit: number = 50) {
    const reviews = await prisma.review.findMany({
        where: {
            OR: [
                { spamStatus: "FLAGGED" },
                { spamStatus: "PENDING" },
            ],
        },
        include: {
            author: true,
            venue: true,
        },
        orderBy: { indexedAt: "desc" },
        take: limit,
    });

    // Get trust scores
    const pubkeys = reviews.map(r => r.authorPubkey);
    const trustScores = await getTrustScores(pubkeys);

    return reviews.map(review => ({
        ...review,
        trustScore: trustScores.get(review.authorPubkey.toLowerCase()) ?? 0.02,
    }));
}

/**
 * Get spam statistics for admin dashboard
 */
export async function getSpamStats() {
    const [total, pending, flagged, blocked, approved] = await Promise.all([
        prisma.review.count(),
        prisma.review.count({ where: { spamStatus: "PENDING" } }),
        prisma.review.count({ where: { spamStatus: "FLAGGED" } }),
        prisma.review.count({ where: { spamStatus: "BLOCKED" } }),
        prisma.review.count({ where: { spamStatus: "APPROVED" } }),
    ]);

    return {
        total,
        pending,
        flagged,
        blocked,
        approved,
        needsReview: pending + flagged,
    };
}

/**
 * Bulk approve reviews (admin action)
 */
export async function bulkApproveReviews(reviewIds: string[]) {
    return prisma.review.updateMany({
        where: { id: { in: reviewIds } },
        data: { spamStatus: "APPROVED" },
    });
}

/**
 * Bulk block reviews (admin action)
 */
export async function bulkBlockReviews(reviewIds: string[], reason?: string) {
    // Need to update each individually to append to spamReasons array
    const updates = reviewIds.map(id =>
        prisma.review.update({
            where: { id },
            data: {
                spamStatus: "BLOCKED",
                spamReasons: {
                    push: reason ? `[Bulk Block] ${reason}` : "[Bulk Block]",
                },
            },
        })
    );

    return Promise.all(updates);
}

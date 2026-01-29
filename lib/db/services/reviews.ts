import prisma from "../prisma";
import { getTrustScores } from "@/lib/trust/graphBuilder";

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
}

export async function indexReview(input: IndexReviewInput) {
    const { eventId, osmId, authorPubkey, rating, content, eventCreatedAt, authorProfile } = input;

    return prisma.$transaction(async (tx) => {
        const venue = await tx.venue.upsert({
            where: { osmId },
            update: {},
            create: { osmId },
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
            },
            create: {
                eventId,
                venueId: venue.id,
                authorPubkey,
                rating,
                content,
                eventCreatedAt,
            },
        });
    });
}

export async function getReviewsByOsmId(osmId: string) {
    const venue = await prisma.venue.findUnique({
        where: { osmId },
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
export async function getReviewsWithTrustByOsmId(osmId: string): Promise<ReviewsWithTrustResult> {
    const venue = await prisma.venue.findUnique({
        where: { osmId },
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

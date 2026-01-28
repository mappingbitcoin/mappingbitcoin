import prisma from "./prisma";
import type { ClaimMethod, ClaimStatus } from "../generated/prisma";

export { prisma };
export type { ClaimMethod, ClaimStatus };

// ============================================
// Venue Operations
// ============================================

/**
 * Get or create a venue by OSM ID.
 * Venues are created lazily as activity (reviews, claims) happens.
 */
export async function getOrCreateVenue(osmId: string) {
    return prisma.venue.upsert({
        where: { osmId },
        update: {}, // No updates needed - just return existing
        create: { osmId },
    });
}

/**
 * Get venue by OSM ID
 */
export async function getVenueByOsmId(osmId: string) {
    return prisma.venue.findUnique({
        where: { osmId },
    });
}

// ============================================
// User Operations
// ============================================

/**
 * Get or create a user by pubkey.
 * If user exists, optionally update profile data.
 */
export async function getOrCreateUser(
    pubkey: string,
    profileData?: {
        name?: string | null;
        picture?: string | null;
        nip05?: string | null;
    }
) {
    const now = new Date();

    return prisma.user.upsert({
        where: { pubkey },
        update: profileData
            ? {
                  name: profileData.name,
                  picture: profileData.picture,
                  nip05: profileData.nip05,
                  profileUpdatedAt: now,
              }
            : {},
        create: {
            pubkey,
            name: profileData?.name,
            picture: profileData?.picture,
            nip05: profileData?.nip05,
            profileUpdatedAt: profileData ? now : null,
        },
    });
}

/**
 * Update user profile from kind:0 event
 */
export async function updateUserProfile(
    pubkey: string,
    profile: {
        name?: string | null;
        picture?: string | null;
        nip05?: string | null;
    }
) {
    return prisma.user.update({
        where: { pubkey },
        data: {
            name: profile.name,
            picture: profile.picture,
            nip05: profile.nip05,
            profileUpdatedAt: new Date(),
        },
    });
}

/**
 * Get user by pubkey
 */
export async function getUserByPubkey(pubkey: string) {
    return prisma.user.findUnique({
        where: { pubkey },
    });
}

// ============================================
// Review Operations
// ============================================

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

/**
 * Index a review from Nostr.
 *
 * Flow:
 * 1. Check if venues row exists for osm_id, create if not
 * 2. Check if users row exists for author_pubkey, create/update if not
 * 3. Insert review with FKs (or update if eventId already exists)
 */
export async function indexReview(input: IndexReviewInput) {
    const { eventId, osmId, authorPubkey, rating, content, eventCreatedAt, authorProfile } = input;

    // Use a transaction to ensure all operations succeed together
    return prisma.$transaction(async (tx) => {
        // 1. Get or create venue
        const venue = await tx.venue.upsert({
            where: { osmId },
            update: {},
            create: { osmId },
        });

        // 2. Get or create user (with optional profile update)
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

        // 3. Insert or update review
        const review = await tx.review.upsert({
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

        return review;
    });
}

/**
 * Get reviews for a venue by OSM ID
 */
export async function getReviewsByOsmId(osmId: string) {
    const venue = await prisma.venue.findUnique({
        where: { osmId },
        include: {
            reviews: {
                include: {
                    author: true,
                    replies: {
                        include: {
                            author: true,
                        },
                        orderBy: { eventCreatedAt: "asc" },
                    },
                },
                orderBy: { eventCreatedAt: "desc" },
            },
        },
    });

    return venue?.reviews ?? [];
}

/**
 * Get review by event ID
 */
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

// ============================================
// Review Reply Operations
// ============================================

export interface IndexReviewReplyInput {
    eventId: string;
    reviewEventId: string; // The event ID of the parent review
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

/**
 * Index a review reply from Nostr
 */
export async function indexReviewReply(input: IndexReviewReplyInput) {
    const { eventId, reviewEventId, authorPubkey, content, isOwnerReply, eventCreatedAt, authorProfile } = input;

    return prisma.$transaction(async (tx) => {
        // 1. Find the parent review
        const review = await tx.review.findUnique({
            where: { eventId: reviewEventId },
        });

        if (!review) {
            throw new Error(`Parent review not found: ${reviewEventId}`);
        }

        // 2. Get or create user
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

        // 3. Insert or update reply
        const reply = await tx.reviewReply.upsert({
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

        return reply;
    });
}

// ============================================
// Claim Operations
// ============================================

export interface CreateClaimInput {
    osmId: string;
    claimerPubkey: string;
    method: ClaimMethod;
    verificationCode?: string;
    expiresAt?: Date;
}

/**
 * Create a new claim for a venue
 */
export async function createClaim(input: CreateClaimInput) {
    const { osmId, claimerPubkey, method, verificationCode, expiresAt } = input;

    return prisma.$transaction(async (tx) => {
        // 1. Get or create venue
        const venue = await tx.venue.upsert({
            where: { osmId },
            update: {},
            create: { osmId },
        });

        // 2. Get or create user
        await tx.user.upsert({
            where: { pubkey: claimerPubkey },
            update: {},
            create: { pubkey: claimerPubkey },
        });

        // 3. Create claim
        const claim = await tx.claim.create({
            data: {
                venueId: venue.id,
                claimerPubkey,
                method,
                verificationCode,
                expiresAt,
            },
        });

        return claim;
    });
}

/**
 * Update claim status
 */
export async function updateClaimStatus(
    claimId: string,
    status: ClaimStatus,
    verifiedAt?: Date
) {
    return prisma.claim.update({
        where: { id: claimId },
        data: {
            status,
            verifiedAt: status === "VERIFIED" ? (verifiedAt ?? new Date()) : undefined,
        },
    });
}

/**
 * Increment verification attempts for a claim
 */
export async function incrementClaimAttempts(claimId: string) {
    return prisma.claim.update({
        where: { id: claimId },
        data: {
            verificationAttempts: { increment: 1 },
        },
    });
}

/**
 * Get pending claims for a venue
 */
export async function getPendingClaimsByOsmId(osmId: string) {
    const venue = await prisma.venue.findUnique({
        where: { osmId },
        include: {
            claims: {
                where: { status: "PENDING" },
                include: { claimer: true },
                orderBy: { createdAt: "desc" },
            },
        },
    });

    return venue?.claims ?? [];
}

/**
 * Get verified claim for a venue (if any)
 */
export async function getVerifiedClaimByOsmId(osmId: string) {
    const venue = await prisma.venue.findUnique({
        where: { osmId },
        include: {
            claims: {
                where: { status: "VERIFIED" },
                include: { claimer: true },
                take: 1,
            },
        },
    });

    return venue?.claims[0] ?? null;
}

/**
 * Get all claims for a user
 */
export async function getClaimsByPubkey(pubkey: string) {
    return prisma.claim.findMany({
        where: { claimerPubkey: pubkey },
        include: { venue: true },
        orderBy: { createdAt: "desc" },
    });
}

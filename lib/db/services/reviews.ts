import prisma from "../prisma";

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

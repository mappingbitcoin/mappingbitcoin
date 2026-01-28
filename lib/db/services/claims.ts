import prisma from "../prisma";
import type { ClaimMethod, ClaimStatus } from "@prisma/client";

export type { ClaimMethod, ClaimStatus };

export interface CreateClaimInput {
    osmId: string;
    claimerPubkey: string;
    method: ClaimMethod;
    verificationCode?: string;
    expiresAt?: Date;
}

export async function createClaim(input: CreateClaimInput) {
    const { osmId, claimerPubkey, method, verificationCode, expiresAt } = input;

    return prisma.$transaction(async (tx) => {
        const venue = await tx.venue.upsert({
            where: { osmId },
            update: {},
            create: { osmId },
        });

        await tx.user.upsert({
            where: { pubkey: claimerPubkey },
            update: {},
            create: { pubkey: claimerPubkey },
        });

        return tx.claim.create({
            data: {
                venueId: venue.id,
                claimerPubkey,
                method,
                verificationCode,
                expiresAt,
            },
        });
    });
}

export async function updateClaimStatus(claimId: string, status: ClaimStatus, verifiedAt?: Date) {
    return prisma.claim.update({
        where: { id: claimId },
        data: {
            status,
            verifiedAt: status === "VERIFIED" ? (verifiedAt ?? new Date()) : undefined,
        },
    });
}

export async function incrementClaimAttempts(claimId: string) {
    return prisma.claim.update({
        where: { id: claimId },
        data: {
            verificationAttempts: { increment: 1 },
        },
    });
}

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

export async function getClaimsByPubkey(pubkey: string) {
    return prisma.claim.findMany({
        where: { claimerPubkey: pubkey },
        include: { venue: true },
        orderBy: { createdAt: "desc" },
    });
}

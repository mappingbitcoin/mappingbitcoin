import prisma from "../prisma";
import { Resend } from "resend";
import { createVerificationCodeEmail } from "@/lib/email/templates";

const VERIFICATION_CODE_EXPIRY_MINUTES = 15;
const MAX_VERIFICATION_ATTEMPTS = 5;

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Generate a 6-digit verification code
 */
function generateVerificationCode(): string {
    const bytes = new Uint8Array(3);
    crypto.getRandomValues(bytes);
    const num = (bytes[0] << 16) | (bytes[1] << 8) | bytes[2];
    return String(num % 1000000).padStart(6, "0");
}

/**
 * Hash an email address using SHA-256
 */
export async function hashEmail(email: string): Promise<string> {
    const normalized = email.toLowerCase().trim();
    const encoder = new TextEncoder();
    const data = encoder.encode(normalized);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Initiate email verification for a venue
 * Creates a pending claim and sends verification code to OSM-registered email
 */
export async function initiateEmailVerification(
    osmId: string,
    pubkey: string,
    email: string,
    venueName?: string
): Promise<{ claimId: string; expiresAt: Date }> {
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000);

    // Ensure user exists
    await prisma.user.upsert({
        where: { pubkey },
        update: {},
        create: { pubkey },
    });

    // Ensure venue exists
    const venue = await prisma.venue.upsert({
        where: { osmId },
        update: {},
        create: { osmId },
    });

    // Check for existing pending claim from this user for this venue
    const existingClaim = await prisma.claim.findFirst({
        where: {
            venueId: venue.id,
            claimerPubkey: pubkey,
            status: "PENDING",
        },
    });

    let claim;
    if (existingClaim) {
        // Update existing claim with new code
        claim = await prisma.claim.update({
            where: { id: existingClaim.id },
            data: {
                verificationCode,
                verificationAttempts: 0,
                expiresAt,
            },
        });
    } else {
        // Create new claim
        claim = await prisma.claim.create({
            data: {
                venueId: venue.id,
                claimerPubkey: pubkey,
                method: "EMAIL",
                verificationCode,
                expiresAt,
            },
        });
    }

    // Send verification email
    await sendVerificationEmail(email, verificationCode, venueName);

    return { claimId: claim.id, expiresAt };
}

/**
 * Send verification code email
 */
async function sendVerificationEmail(email: string, code: string, venueName?: string): Promise<void> {
    const { html, text } = createVerificationCodeEmail(code, venueName, VERIFICATION_CODE_EXPIRY_MINUTES);

    await resend.emails.send({
        from: "Mapping Bitcoin <verify@mappingbitcoin.com>",
        to: [email],
        subject: `Your Verification Code: ${code}`,
        text,
        html,
    });
}

/**
 * Verify a code and complete email verification
 */
export async function verifyEmailCode(
    claimId: string,
    code: string,
    email: string
): Promise<{ success: boolean; error?: string }> {
    const claim = await prisma.claim.findUnique({
        where: { id: claimId },
    });

    if (!claim) {
        return { success: false, error: "Claim not found" };
    }

    if (claim.status !== "PENDING") {
        return { success: false, error: "Claim is no longer pending" };
    }

    if (claim.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
        return { success: false, error: "Maximum verification attempts exceeded. Please request a new code." };
    }

    if (claim.expiresAt && claim.expiresAt < new Date()) {
        return { success: false, error: "Verification code has expired. Please request a new code." };
    }

    // Increment attempts
    await prisma.claim.update({
        where: { id: claimId },
        data: { verificationAttempts: { increment: 1 } },
    });

    if (claim.verificationCode !== code) {
        const attemptsLeft = MAX_VERIFICATION_ATTEMPTS - claim.verificationAttempts - 1;
        return { success: false, error: `Invalid code. ${attemptsLeft} attempts remaining.` };
    }

    // Verification successful - update claim
    const emailHash = await hashEmail(email);

    await prisma.claim.update({
        where: { id: claimId },
        data: {
            status: "VERIFIED",
            verifiedAt: new Date(),
            verifiedEmailHash: emailHash,
            verificationCode: null, // Clear the code
        },
    });

    return { success: true };
}

/**
 * Check if email has changed and revoke verification if so
 * Returns true if claim was revoked
 */
export async function checkAndRevokeIfEmailChanged(
    osmId: string,
    currentEmail: string
): Promise<{ revoked: boolean; claimId?: string }> {
    const venue = await prisma.venue.findUnique({
        where: { osmId },
        include: {
            claims: {
                where: {
                    status: "VERIFIED",
                    revokedAt: null,
                },
                take: 1,
            },
        },
    });

    if (!venue || venue.claims.length === 0) {
        return { revoked: false };
    }

    const claim = venue.claims[0];
    if (!claim.verifiedEmailHash) {
        return { revoked: false };
    }

    const currentEmailHash = await hashEmail(currentEmail);

    if (currentEmailHash !== claim.verifiedEmailHash) {
        // Email has changed - revoke the claim
        await prisma.claim.update({
            where: { id: claim.id },
            data: {
                status: "EXPIRED",
                revokedAt: new Date(),
                revokedReason: "email_changed",
            },
        });

        return { revoked: true, claimId: claim.id };
    }

    return { revoked: false };
}

/**
 * Get verification status for a venue
 */
export async function getVerificationStatus(osmId: string): Promise<{
    isVerified: boolean;
    ownerPubkey?: string;
    verifiedAt?: Date;
}> {
    const venue = await prisma.venue.findUnique({
        where: { osmId },
        include: {
            claims: {
                where: {
                    status: "VERIFIED",
                    revokedAt: null,
                },
                include: {
                    claimer: true,
                },
                take: 1,
            },
        },
    });

    if (!venue || venue.claims.length === 0) {
        return { isVerified: false };
    }

    const claim = venue.claims[0];
    return {
        isVerified: true,
        ownerPubkey: claim.claimerPubkey,
        verifiedAt: claim.verifiedAt ?? undefined,
    };
}

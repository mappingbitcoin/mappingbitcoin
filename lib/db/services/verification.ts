import prisma from "../prisma";
import { Resend } from "resend";
import dns from "dns/promises";
import { createVerificationCodeEmail } from "@/lib/email/templates";
import { serverEnv } from "@/lib/Environment";
import { announceVerification } from "@/lib/nostr/bot";

const VERIFICATION_CODE_EXPIRY_MINUTES = 15;
const MAX_VERIFICATION_ATTEMPTS = 5;
const CLAIM_EXPIRY_HOURS = 24; // Claims expire after 24 hours
const BASE_CHECK_COOLDOWN_SECONDS = 30; // Base cooldown between checks
const MAX_CHECK_COOLDOWN_SECONDS = 3600; // Max cooldown (1 hour)

const resend = new Resend(serverEnv.resendApiKey);

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
        where: { id: osmId },
        update: {},
        create: { id: osmId },
    });

    // Check for existing pending EMAIL claim from this user for this venue
    const existingClaim = await prisma.claim.findFirst({
        where: {
            venueId: venue.id,
            claimerPubkey: pubkey,
            method: "EMAIL",
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

    const updatedClaim = await prisma.claim.update({
        where: { id: claimId },
        data: {
            status: "VERIFIED",
            verifiedAt: new Date(),
            verifiedEmailHash: emailHash,
            verificationCode: null, // Clear the code
        },
        include: {
            venue: true,
        },
    });

    // Announce verification on Nostr and store the event ID
    announceVerification(
        {
            osmId: updatedClaim.venue.id,
            name: "Verified Merchant", // Name will be fetched from cache if needed
        },
        {
            method: "EMAIL",
            detail: email,
            ownerPubkey: updatedClaim.claimerPubkey,
        }
    ).then(async (result) => {
        if (result.success && result.eventId) {
            await prisma.claim.update({
                where: { id: claimId },
                data: { nostrEventId: result.eventId },
            });
        }
    }).catch((err) => console.error("[NostrBot] Verification announcement failed:", err));

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
        where: { id: osmId },
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

export interface VerificationMethod {
    method: "EMAIL" | "DOMAIN";
    verifiedAt: Date;
    detail?: string; // masked email or domain
}

export interface VerificationStatusResult {
    isVerified: boolean;
    ownerPubkey?: string;
    verifiedAt?: Date;
    methods?: VerificationMethod[];
}

/**
 * Get verification status for a venue
 * Returns all active verification methods
 */
export async function getVerificationStatus(osmId: string): Promise<VerificationStatusResult> {
    const venue = await prisma.venue.findUnique({
        where: { id: osmId },
        include: {
            claims: {
                where: {
                    status: "VERIFIED",
                    revokedAt: null,
                },
                include: {
                    claimer: true,
                },
                orderBy: {
                    verifiedAt: "asc",
                },
            },
        },
    });

    if (!venue || venue.claims.length === 0) {
        return { isVerified: false };
    }

    // Get all verified methods
    const methods: VerificationMethod[] = venue.claims.map((claim) => ({
        method: claim.method as "EMAIL" | "DOMAIN",
        verifiedAt: claim.verifiedAt!,
        detail: claim.method === "DOMAIN"
            ? claim.domainToVerify || undefined
            : undefined, // Don't expose email
    }));

    // First claim is the primary owner
    const primaryClaim = venue.claims[0];

    return {
        isVerified: true,
        ownerPubkey: primaryClaim.claimerPubkey,
        verifiedAt: primaryClaim.verifiedAt ?? undefined,
        methods,
    };
}

/**
 * Generate a unique TXT record value for domain verification
 */
function generateTxtRecordValue(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return `mappingbitcoin-verify=${hex}`;
}

/**
 * Extract domain from a URL or website string
 */
export function extractDomain(website: string): string | null {
    try {
        let url = website.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        const parsed = new URL(url);
        return parsed.hostname.replace(/^www\./, '');
    } catch {
        return null;
    }
}

/**
 * Extract domain from an email address
 */
export function extractDomainFromEmail(email: string): string | null {
    try {
        const trimmed = email.trim().toLowerCase();
        const atIndex = trimmed.lastIndexOf('@');
        if (atIndex === -1 || atIndex === trimmed.length - 1) {
            return null;
        }
        return trimmed.substring(atIndex + 1);
    } catch {
        return null;
    }
}

/**
 * Initiate domain verification for a venue
 */
export async function initiateDomainVerification(
    osmId: string,
    pubkey: string,
    domain: string
): Promise<{ claimId: string; txtRecordValue: string; expiresAt: Date }> {
    const txtRecordValue = generateTxtRecordValue();
    const expiresAt = new Date(Date.now() + CLAIM_EXPIRY_HOURS * 60 * 60 * 1000);

    // Ensure user exists
    await prisma.user.upsert({
        where: { pubkey },
        update: {},
        create: { pubkey },
    });

    // Ensure venue exists
    const venue = await prisma.venue.upsert({
        where: { id: osmId },
        update: {},
        create: { id: osmId },
    });

    // Check for existing pending domain claim from this user for this venue
    const existingClaim = await prisma.claim.findFirst({
        where: {
            venueId: venue.id,
            claimerPubkey: pubkey,
            method: "DOMAIN",
            status: "PENDING",
        },
    });

    let claim;
    if (existingClaim) {
        // Update existing claim with new TXT value
        claim = await prisma.claim.update({
            where: { id: existingClaim.id },
            data: {
                domainToVerify: domain,
                txtRecordValue,
                expiresAt,
                checkCount: 0,
                lastCheckAt: null,
                nextCheckAt: null,
            },
        });
    } else {
        // Create new claim
        claim = await prisma.claim.create({
            data: {
                venueId: venue.id,
                claimerPubkey: pubkey,
                method: "DOMAIN",
                domainToVerify: domain,
                txtRecordValue,
                expiresAt,
            },
        });
    }

    return { claimId: claim.id, txtRecordValue, expiresAt };
}

/**
 * Calculate next check time with exponential backoff
 */
function calculateNextCheckTime(checkCount: number): Date {
    // Exponential backoff: 30s, 60s, 120s, 240s, ... up to 1 hour
    const cooldownSeconds = Math.min(
        BASE_CHECK_COOLDOWN_SECONDS * Math.pow(2, checkCount),
        MAX_CHECK_COOLDOWN_SECONDS
    );
    return new Date(Date.now() + cooldownSeconds * 1000);
}

/**
 * Check domain TXT record for verification
 */
export async function checkDomainVerification(
    claimId: string,
    pubkey: string
): Promise<{
    success: boolean;
    verified?: boolean;
    error?: string;
    nextCheckAt?: Date;
    cooldownSeconds?: number;
}> {
    const claim = await prisma.claim.findUnique({
        where: { id: claimId },
    });

    if (!claim) {
        return { success: false, error: "Claim not found" };
    }

    if (claim.claimerPubkey !== pubkey) {
        return { success: false, error: "Not authorized to check this claim" };
    }

    if (claim.status !== "PENDING") {
        return { success: false, error: "Claim is no longer pending" };
    }

    if (claim.method !== "DOMAIN") {
        return { success: false, error: "This is not a domain verification claim" };
    }

    if (claim.expiresAt && claim.expiresAt < new Date()) {
        // Mark as expired
        await prisma.claim.update({
            where: { id: claimId },
            data: { status: "EXPIRED" },
        });
        return { success: false, error: "Verification request has expired. Please start a new verification." };
    }

    // Check rate limiting
    if (claim.nextCheckAt && claim.nextCheckAt > new Date()) {
        const cooldownSeconds = Math.ceil((claim.nextCheckAt.getTime() - Date.now()) / 1000);
        return {
            success: false,
            error: `Please wait before checking again`,
            nextCheckAt: claim.nextCheckAt,
            cooldownSeconds,
        };
    }

    if (!claim.domainToVerify || !claim.txtRecordValue) {
        return { success: false, error: "Domain verification not properly initialized" };
    }

    // Update check count and next check time
    const nextCheckAt = calculateNextCheckTime(claim.checkCount);
    await prisma.claim.update({
        where: { id: claimId },
        data: {
            checkCount: { increment: 1 },
            lastCheckAt: new Date(),
            nextCheckAt,
        },
    });

    // Perform DNS TXT record lookup
    try {
        const records = await dns.resolveTxt(claim.domainToVerify);
        const flatRecords = records.flat();

        const found = flatRecords.some(record => record === claim.txtRecordValue);

        if (found) {
            // Verification successful
            const updatedClaim = await prisma.claim.update({
                where: { id: claimId },
                data: {
                    status: "VERIFIED",
                    verifiedAt: new Date(),
                },
                include: {
                    venue: true,
                },
            });

            // Announce verification on Nostr and store the event ID
            announceVerification(
                {
                    osmId: updatedClaim.venue.id,
                    name: "Verified Merchant", // Name will be fetched from cache if needed
                },
                {
                    method: "DOMAIN",
                    detail: claim.domainToVerify || undefined,
                    ownerPubkey: updatedClaim.claimerPubkey,
                }
            ).then(async (result) => {
                if (result.success && result.eventId) {
                    await prisma.claim.update({
                        where: { id: claimId },
                        data: { nostrEventId: result.eventId },
                    });
                }
            }).catch((err) => console.error("[NostrBot] Verification announcement failed:", err));

            return { success: true, verified: true };
        }

        return {
            success: true,
            verified: false,
            nextCheckAt,
            cooldownSeconds: Math.ceil((nextCheckAt.getTime() - Date.now()) / 1000),
        };
    } catch (error) {
        // DNS lookup failed (NXDOMAIN, timeout, etc.)
        return {
            success: true,
            verified: false,
            error: "Could not find TXT records for this domain. Make sure the DNS record is properly configured.",
            nextCheckAt,
            cooldownSeconds: Math.ceil((nextCheckAt.getTime() - Date.now()) / 1000),
        };
    }
}

/**
 * Get all claims for a user
 */
export async function getClaimsForUser(pubkey: string): Promise<Array<{
    id: string;
    osmId: string;
    status: string;
    method: string;
    createdAt: Date;
    expiresAt: Date | null;
    verifiedAt: Date | null;
    domainToVerify: string | null;
    txtRecordValue: string | null;
    nextCheckAt: Date | null;
    checkCount: number;
}>> {
    const claims = await prisma.claim.findMany({
        where: {
            claimerPubkey: pubkey,
            revokedAt: null, // Exclude revoked claims
        },
        include: { venue: true },
        orderBy: { createdAt: 'desc' },
    });

    return claims.map(claim => ({
        id: claim.id,
        osmId: claim.venue.id,
        status: claim.status,
        method: claim.method,
        createdAt: claim.createdAt,
        expiresAt: claim.expiresAt,
        verifiedAt: claim.verifiedAt,
        domainToVerify: claim.domainToVerify,
        txtRecordValue: claim.txtRecordValue,
        nextCheckAt: claim.nextCheckAt,
        checkCount: claim.checkCount,
    }));
}

/**
 * Expire old pending claims (run periodically)
 */
export async function expirePendingClaims(): Promise<number> {
    const result = await prisma.claim.updateMany({
        where: {
            status: "PENDING",
            expiresAt: {
                lt: new Date(),
            },
        },
        data: {
            status: "EXPIRED",
        },
    });

    return result.count;
}

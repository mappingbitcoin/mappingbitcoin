import { SignJWT, jwtVerify } from "jose";
import prisma from "../prisma";

const CHALLENGE_EXPIRY_MINUTES = 5;
const TOKEN_EXPIRY_DAYS = 7;

// Generate a cryptographically secure random challenge
function generateChallengeString(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

/**
 * Create a new authentication challenge for a pubkey
 */
export async function createChallenge(pubkey: string): Promise<{ challenge: string; expiresAt: Date }> {
    const challenge = generateChallengeString();
    const expiresAt = new Date(Date.now() + CHALLENGE_EXPIRY_MINUTES * 60 * 1000);

    // Clean up any existing unused challenges for this pubkey
    await prisma.authChallenge.deleteMany({
        where: {
            pubkey,
            usedAt: null,
        },
    });

    await prisma.authChallenge.create({
        data: {
            pubkey,
            challenge,
            expiresAt,
        },
    });

    return { challenge, expiresAt };
}

/**
 * Verify a challenge exists and is valid (without consuming it)
 * Returns the challenge record if valid, null otherwise
 */
export async function verifyChallenge(challenge: string, pubkey: string): Promise<{ id: string } | null> {
    const record = await prisma.authChallenge.findUnique({
        where: { challenge },
    });

    if (!record) {
        return null;
    }

    // Check if challenge belongs to the claimed pubkey
    if (record.pubkey !== pubkey) {
        return null;
    }

    // Check if challenge has already been used
    if (record.usedAt) {
        return null;
    }

    // Check if challenge has expired
    if (record.expiresAt < new Date()) {
        // Clean up expired challenge
        await prisma.authChallenge.delete({
            where: { id: record.id },
        });
        return null;
    }

    return { id: record.id };
}

/**
 * Consume a challenge (mark it as used)
 * Call this only after successful signature verification
 */
export async function consumeChallenge(challengeId: string): Promise<void> {
    await prisma.authChallenge.update({
        where: { id: challengeId },
        data: { usedAt: new Date() },
    });
}

/**
 * Verify and consume a challenge
 * Returns true if the challenge is valid and was consumed
 * @deprecated Use verifyChallenge + consumeChallenge for better control
 */
export async function verifyAndConsumeChallenge(challenge: string, pubkey: string): Promise<boolean> {
    const record = await verifyChallenge(challenge, pubkey);
    if (!record) {
        return false;
    }
    await consumeChallenge(record.id);
    return true;
}

/**
 * Create a JWT auth token for a verified pubkey
 */
export async function createAuthToken(pubkey: string): Promise<string> {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
        throw new Error("SESSION_SECRET environment variable is not set");
    }

    const token = await new SignJWT({ pubkey })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${TOKEN_EXPIRY_DAYS}d`)
        .setSubject(pubkey)
        .sign(new TextEncoder().encode(secret));

    return token;
}

/**
 * Validate a JWT auth token and return the pubkey
 * Returns null if token is invalid or expired
 */
export async function validateAuthToken(token: string): Promise<string | null> {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
        throw new Error("SESSION_SECRET environment variable is not set");
    }

    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));

        if (!payload.pubkey || typeof payload.pubkey !== "string") {
            return null;
        }

        return payload.pubkey;
    } catch {
        return null;
    }
}

/**
 * Clean up expired challenges (can be run periodically)
 */
export async function cleanupExpiredChallenges(): Promise<number> {
    const result = await prisma.authChallenge.deleteMany({
        where: {
            expiresAt: { lt: new Date() },
        },
    });

    return result.count;
}

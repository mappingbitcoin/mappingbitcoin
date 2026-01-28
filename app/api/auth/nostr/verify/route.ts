import { NextRequest, NextResponse } from "next/server";
import { verifyChallenge, consumeChallenge, createAuthToken } from "@/lib/db/services/auth";
import * as secp256k1 from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha2.js";
import { hexToBytes } from "@noble/hashes/utils.js";
import { verifyEvent } from "nostr-tools";

// Configure secp256k1 with sha256 (required in v3)
secp256k1.hashes.sha256 = sha256;

interface VerifyRequest {
    pubkey: string;
    challenge: string;
    signature: string;
    // For extension/bunker signing, the full signed event is needed
    signedEvent?: {
        id: string;
        pubkey: string;
        created_at: number;
        kind: number;
        tags: string[][];
        content: string;
        sig: string;
    };
}

/**
 * Verify a direct Schnorr signature over the challenge hash (for nsec)
 */
async function verifyDirectSignature(pubkey: string, challenge: string, signature: string): Promise<boolean> {
    try {
        const messageHash = sha256(new TextEncoder().encode(challenge));
        const pubkeyBytes = hexToBytes(pubkey);
        const signatureBytes = hexToBytes(signature);
        return secp256k1.schnorr.verify(signatureBytes, messageHash, pubkeyBytes);
    } catch (error) {
        console.error("Direct signature verification error:", error);
        return false;
    }
}

/**
 * Verify a Nostr event signature (for extension/bunker)
 * Uses nostr-tools for proper Nostr event verification
 */
async function verifyEventSignature(
    expectedPubkey: string,
    challenge: string,
    event: VerifyRequest["signedEvent"]
): Promise<boolean> {
    if (!event) return false;

    try {
        // Verify the event pubkey matches
        if (event.pubkey !== expectedPubkey) {
            console.error("Event pubkey mismatch");
            return false;
        }

        // Verify the challenge is in the event content
        if (event.content !== challenge) {
            console.error("Challenge mismatch in event content");
            return false;
        }

        // Verify the event is not too old (5 minute window)
        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - event.created_at) > 300) {
            console.error("Event timestamp too old or in the future:", event.created_at, "vs now:", now);
            return false;
        }

        // Verify the event kind is appropriate (22242 for challenge response)
        if (event.kind !== 22242) {
            console.error("Unexpected event kind:", event.kind);
            return false;
        }

        // Use nostr-tools for proper Nostr event verification
        // This handles all the Nostr-specific signature verification correctly
        const isValid = verifyEvent({
            id: event.id,
            pubkey: event.pubkey,
            created_at: event.created_at,
            kind: event.kind,
            tags: event.tags,
            content: event.content,
            sig: event.sig,
        });

        return isValid;
    } catch (error) {
        console.error("Event signature verification error:", error);
        return false;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body: VerifyRequest = await request.json();
        const { pubkey, challenge, signature, signedEvent } = body;

        // Validate pubkey
        if (!pubkey || !/^[0-9a-fA-F]{64}$/.test(pubkey)) {
            return NextResponse.json(
                { error: "Invalid pubkey format" },
                { status: 400 }
            );
        }

        // Validate challenge
        if (!challenge || challenge.length !== 64) {
            return NextResponse.json(
                { error: "Invalid challenge format" },
                { status: 400 }
            );
        }

        // Validate signature format (when provided directly)
        if (signature && !/^[0-9a-fA-F]{128}$/.test(signature)) {
            return NextResponse.json(
                { error: "Invalid signature format" },
                { status: 400 }
            );
        }

        // Need either a direct signature or a signed event
        if (!signature && !signedEvent) {
            return NextResponse.json(
                { error: "Either signature or signedEvent is required" },
                { status: 400 }
            );
        }

        // Verify the challenge exists and belongs to this pubkey (but don't consume yet)
        const challengeRecord = await verifyChallenge(challenge, pubkey);
        if (!challengeRecord) {
            return NextResponse.json(
                { error: "Invalid or expired challenge" },
                { status: 401 }
            );
        }

        // Verify the signature using the appropriate method
        let signatureValid = false;

        if (signedEvent) {
            // Extension/bunker: verify event signature
            signatureValid = await verifyEventSignature(pubkey, challenge, signedEvent);
        } else if (signature) {
            // Direct nsec signing: verify Schnorr signature over challenge hash
            signatureValid = await verifyDirectSignature(pubkey, challenge, signature);
        }

        if (!signatureValid) {
            // Don't consume the challenge on failure - allow retry
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 401 }
            );
        }

        // Only consume the challenge after successful signature verification
        await consumeChallenge(challengeRecord.id);

        // Create JWT token
        const token = await createAuthToken(pubkey);

        return NextResponse.json({
            token,
            pubkey,
        });
    } catch (error) {
        console.error("Verification error:", error);
        return NextResponse.json(
            { error: "Failed to verify authentication" },
            { status: 500 }
        );
    }
}

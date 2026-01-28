import { NextRequest, NextResponse } from "next/server";
import { verifyAndConsumeChallenge, createAuthToken } from "@/lib/db/services/auth";
import * as secp256k1 from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha2.js";
import { hexToBytes } from "@noble/hashes/utils.js";

interface VerifyRequest {
    pubkey: string;
    challenge: string;
    signature: string;
}

/**
 * Verify a Schnorr signature over a challenge
 */
async function verifySignature(pubkey: string, challenge: string, signature: string): Promise<boolean> {
    try {
        // Hash the challenge message
        const messageHash = sha256(new TextEncoder().encode(challenge));

        // Verify the Schnorr signature
        const pubkeyBytes = hexToBytes(pubkey);
        const signatureBytes = hexToBytes(signature);

        return secp256k1.schnorr.verify(signatureBytes, messageHash, pubkeyBytes);
    } catch (error) {
        console.error("Signature verification error:", error);
        return false;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body: VerifyRequest = await request.json();
        const { pubkey, challenge, signature } = body;

        // Validate inputs
        if (!pubkey || !/^[0-9a-fA-F]{64}$/.test(pubkey)) {
            return NextResponse.json(
                { error: "Invalid pubkey format" },
                { status: 400 }
            );
        }

        if (!challenge || challenge.length !== 64) {
            return NextResponse.json(
                { error: "Invalid challenge format" },
                { status: 400 }
            );
        }

        if (!signature || !/^[0-9a-fA-F]{128}$/.test(signature)) {
            return NextResponse.json(
                { error: "Invalid signature format" },
                { status: 400 }
            );
        }

        // Verify the challenge exists and belongs to this pubkey
        const challengeValid = await verifyAndConsumeChallenge(challenge, pubkey);
        if (!challengeValid) {
            return NextResponse.json(
                { error: "Invalid or expired challenge" },
                { status: 401 }
            );
        }

        // Verify the signature
        const signatureValid = await verifySignature(pubkey, challenge, signature);
        if (!signatureValid) {
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 401 }
            );
        }

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

import { NextRequest, NextResponse } from "next/server";
import { createChallenge } from "@/lib/db/services/auth";

interface ChallengeRequest {
    pubkey: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: ChallengeRequest = await request.json();
        const { pubkey } = body;

        // Validate pubkey format (64 hex characters)
        if (!pubkey || !/^[0-9a-fA-F]{64}$/.test(pubkey)) {
            return NextResponse.json(
                { error: "Invalid pubkey format" },
                { status: 400 }
            );
        }

        const { challenge, expiresAt } = await createChallenge(pubkey);

        return NextResponse.json({
            challenge,
            expiresAt: expiresAt.toISOString(),
        });
    } catch (error) {
        console.error("Challenge creation error:", error);
        return NextResponse.json(
            { error: "Failed to create challenge" },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";
import { createChallenge } from "@/lib/db/services/auth";
import { checkRateLimit, getClientIP, rateLimiters } from "@/lib/rateLimit";

interface ChallengeRequest {
    pubkey: string;
}

export async function POST(request: NextRequest) {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(`auth:challenge:${clientIP}`, rateLimiters.auth);

    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            {
                status: 429,
                headers: {
                    "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
                    "X-RateLimit-Limit": String(rateLimit.limit),
                    "X-RateLimit-Remaining": String(rateLimit.remaining),
                },
            }
        );
    }

    try {
        const body: ChallengeRequest = await request.json();
        const { pubkey } = body;

        // Validate pubkey format (64 lowercase hex characters)
        if (!pubkey || !/^[0-9a-f]{64}$/.test(pubkey.toLowerCase())) {
            return NextResponse.json(
                { error: "Invalid pubkey format" },
                { status: 400 }
            );
        }

        const { challenge, expiresAt } = await createChallenge(pubkey.toLowerCase());

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

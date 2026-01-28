import { NextRequest, NextResponse } from "next/server";
import { validateAuthToken } from "@/lib/db/services/auth";
import { checkDomainVerification } from "@/lib/db/services/verification";

function getAuthToken(request: NextRequest): string | null {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.slice(7);
    }
    return null;
}

export async function POST(request: NextRequest) {
    try {
        // Validate auth token
        const token = getAuthToken(request);
        if (!token) {
            return NextResponse.json(
                { error: "Authorization required" },
                { status: 401 }
            );
        }

        const pubkey = await validateAuthToken(token);
        if (!pubkey) {
            return NextResponse.json(
                { error: "Invalid or expired token" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { claimId } = body;

        if (!claimId) {
            return NextResponse.json(
                { error: "claimId is required" },
                { status: 400 }
            );
        }

        const result = await checkDomainVerification(claimId, pubkey);

        if (!result.success) {
            // Check if it's a rate limit error
            if (result.cooldownSeconds) {
                return NextResponse.json(
                    {
                        error: result.error,
                        nextCheckAt: result.nextCheckAt,
                        cooldownSeconds: result.cooldownSeconds,
                    },
                    { status: 429 }
                );
            }
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            verified: result.verified,
            message: result.verified
                ? "Domain verified successfully! You are now the verified owner of this venue."
                : "TXT record not found yet. Make sure you've added the DNS record and wait for propagation.",
            nextCheckAt: result.nextCheckAt,
            cooldownSeconds: result.cooldownSeconds,
        });
    } catch (error) {
        console.error("Domain verification check error:", error);
        return NextResponse.json(
            { error: "Failed to check domain verification" },
            { status: 500 }
        );
    }
}

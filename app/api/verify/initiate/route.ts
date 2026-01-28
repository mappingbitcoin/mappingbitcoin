import { NextRequest, NextResponse } from "next/server";
import { validateAuthToken } from "@/lib/db/services/auth";
import { initiateEmailVerification, getVerificationStatus } from "@/lib/db/services/verification";

interface InitiateRequest {
    osmId: string;
    email: string;
    venueName?: string;
}

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
                { error: "Authentication required" },
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

        const body: InitiateRequest = await request.json();
        const { osmId, email, venueName } = body;

        // Validate osmId
        if (!osmId || typeof osmId !== "string") {
            return NextResponse.json(
                { error: "Invalid osmId" },
                { status: 400 }
            );
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Invalid email address" },
                { status: 400 }
            );
        }

        // Check if venue is already verified by another user
        const status = await getVerificationStatus(osmId);
        if (status.isVerified && status.ownerPubkey !== pubkey) {
            return NextResponse.json(
                { error: "This venue is already verified by another owner" },
                { status: 409 }
            );
        }

        // Initiate verification
        const { claimId, expiresAt } = await initiateEmailVerification(
            osmId,
            pubkey,
            email,
            venueName
        );

        return NextResponse.json({
            success: true,
            claimId,
            expiresAt: expiresAt.toISOString(),
            message: "Verification code sent to the provided email address",
        });
    } catch (error) {
        console.error("Initiate verification error:", error);
        return NextResponse.json(
            { error: "Failed to initiate verification" },
            { status: 500 }
        );
    }
}

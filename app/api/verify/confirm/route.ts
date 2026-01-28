import { NextRequest, NextResponse } from "next/server";
import { validateAuthToken } from "@/lib/db/services/auth";
import { verifyEmailCode } from "@/lib/db/services/verification";
import prisma from "@/lib/db/prisma";

interface ConfirmRequest {
    claimId: string;
    code: string;
    email: string;
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

        const body: ConfirmRequest = await request.json();
        const { claimId, code, email } = body;

        // Validate inputs
        if (!claimId || typeof claimId !== "string") {
            return NextResponse.json(
                { error: "Invalid claimId" },
                { status: 400 }
            );
        }

        if (!code || !/^\d{6}$/.test(code)) {
            return NextResponse.json(
                { error: "Invalid verification code format" },
                { status: 400 }
            );
        }

        if (!email || typeof email !== "string") {
            return NextResponse.json(
                { error: "Email required for verification" },
                { status: 400 }
            );
        }

        // Verify the claim belongs to the authenticated user
        const claim = await prisma.claim.findUnique({
            where: { id: claimId },
        });

        if (!claim) {
            return NextResponse.json(
                { error: "Claim not found" },
                { status: 404 }
            );
        }

        if (claim.claimerPubkey !== pubkey) {
            return NextResponse.json(
                { error: "Not authorized to verify this claim" },
                { status: 403 }
            );
        }

        // Verify the code
        const result = await verifyEmailCode(claimId, code, email);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Venue ownership verified successfully",
        });
    } catch (error) {
        console.error("Confirm verification error:", error);
        return NextResponse.json(
            { error: "Failed to confirm verification" },
            { status: 500 }
        );
    }
}

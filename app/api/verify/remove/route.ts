import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { validateAuthToken } from "@/lib/db/services/auth";
import { deleteVerificationEvent } from "@/lib/nostr/bot";

function getAuthToken(request: NextRequest): string | null {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.slice(7);
    }
    return null;
}

export async function POST(req: NextRequest) {
    try {
        // Verify authentication
        const token = getAuthToken(req);
        if (!token) {
            return NextResponse.json(
                { success: false, error: "Authorization required" },
                { status: 401 }
            );
        }

        const userPubkey = await validateAuthToken(token);
        if (!userPubkey) {
            return NextResponse.json(
                { success: false, error: "Invalid or expired token" },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await req.json();
        const { claimId } = body;

        if (!claimId || typeof claimId !== "string") {
            return NextResponse.json(
                { success: false, error: "claimId is required" },
                { status: 400 }
            );
        }

        // Fetch the claim
        const claim = await prisma.claim.findUnique({
            where: { id: claimId },
            include: {
                venue: true,
            },
        });

        if (!claim) {
            return NextResponse.json(
                { success: false, error: "Claim not found" },
                { status: 404 }
            );
        }

        // Verify the user is the actual verifier
        if (claim.claimerPubkey !== userPubkey) {
            return NextResponse.json(
                { success: false, error: "You are not authorized to remove this verification" },
                { status: 403 }
            );
        }

        // Check if claim is verified (only verified claims can be "removed")
        if (claim.status !== "VERIFIED") {
            return NextResponse.json(
                { success: false, error: "Only verified claims can be removed" },
                { status: 400 }
            );
        }

        // Delete the Nostr event if one exists
        if (claim.nostrEventId) {
            const deleteResult = await deleteVerificationEvent(
                claim.nostrEventId,
                "Verification removed by owner"
            );

            if (!deleteResult.success) {
                console.warn(`[API] Failed to delete Nostr event: ${deleteResult.error}`);
                // Continue anyway - we still want to revoke the claim in DB
            }
        }

        // Revoke the claim in the database
        await prisma.claim.update({
            where: { id: claimId },
            data: {
                revokedAt: new Date(),
                revokedReason: "removed_by_owner",
            },
        });

        return NextResponse.json({
            success: true,
            message: "Verification removed successfully",
        });
    } catch (error) {
        console.error("[API] Error removing verification:", error);
        return NextResponse.json(
            { success: false, error: "Failed to remove verification" },
            { status: 500 }
        );
    }
}

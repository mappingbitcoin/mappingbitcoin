import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { revokeClaim, getClaimById } from "@/lib/db/services/claims";

interface RevokeRequest {
    reason: string;
}

/**
 * POST /api/admin/places/[id]/revoke
 * Revoke a verified claim
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requireAdmin(request);
    if (!authResult.success) return authResult.response;

    const { id: claimId } = await params;

    if (!claimId) {
        return NextResponse.json(
            { error: "Claim ID is required" },
            { status: 400 }
        );
    }

    try {
        // Verify claim exists and is verified
        const claim = await getClaimById(claimId);

        if (!claim) {
            return NextResponse.json(
                { error: "Claim not found" },
                { status: 404 }
            );
        }

        if (claim.status !== "VERIFIED") {
            return NextResponse.json(
                { error: "Claim is not verified" },
                { status: 400 }
            );
        }

        if (claim.revokedAt) {
            return NextResponse.json(
                { error: "Claim is already revoked" },
                { status: 400 }
            );
        }

        // Get reason from body
        const body: RevokeRequest = await request.json();
        const reason = body.reason || "Revoked by admin";

        // Revoke the claim
        const revokedClaim = await revokeClaim(claimId, reason);

        return NextResponse.json({
            success: true,
            message: "Verification revoked successfully",
            claim: {
                id: revokedClaim.id,
                status: revokedClaim.status,
                revokedAt: revokedClaim.revokedAt?.toISOString(),
                revokedReason: revokedClaim.revokedReason,
            },
        });
    } catch (error) {
        console.error("Failed to revoke claim:", error);
        return NextResponse.json(
            { error: "Failed to revoke verification" },
            { status: 500 }
        );
    }
}

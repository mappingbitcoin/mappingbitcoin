import { NextRequest, NextResponse } from "next/server";
import { getVerificationStatus, checkAndRevokeIfEmailChanged } from "@/lib/db/services/verification";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const osmId = searchParams.get("osmId");
        const email = searchParams.get("email"); // Optional: current email for revocation check

        if (!osmId) {
            return NextResponse.json(
                { error: "osmId parameter required" },
                { status: 400 }
            );
        }

        // If email is provided, check for email change and revoke if needed
        if (email) {
            const revocationResult = await checkAndRevokeIfEmailChanged(osmId, email);
            if (revocationResult.revoked) {
                return NextResponse.json({
                    isVerified: false,
                    wasRevoked: true,
                    revokedReason: "email_changed",
                });
            }
        }

        const status = await getVerificationStatus(osmId);

        return NextResponse.json(status);
    } catch (error) {
        console.error("Verification status error:", error);
        return NextResponse.json(
            { error: "Failed to get verification status" },
            { status: 500 }
        );
    }
}

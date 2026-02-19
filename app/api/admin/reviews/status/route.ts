import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { updateReviewSpamStatus } from "@/lib/db/services/reviews";

/**
 * POST /api/admin/reviews/status
 * Update review spam status
 */
export async function POST(request: NextRequest) {
    // Verify admin
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
        return authResult.response;
    }

    // Parse body
    const body = await request.json();
    const { reviewId, status, reason } = body;

    if (!reviewId || !status) {
        return NextResponse.json({ error: "Missing reviewId or status" }, { status: 400 });
    }

    if (!["PENDING", "APPROVED", "FLAGGED", "BLOCKED"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    try {
        await updateReviewSpamStatus(reviewId, status, reason);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Admin Reviews] Error updating status:", error);
        return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import {
    getFlaggedReviews,
    getSpamStats,
    updateReviewSpamStatus,
    bulkApproveReviews,
    bulkBlockReviews,
    type SpamStatusType,
} from "@/lib/db/services/reviews";

/**
 * GET /api/admin/reviews
 * Get reviews pending moderation and spam statistics
 */
export async function GET(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck instanceof NextResponse) return adminCheck;

    try {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get("limit") || "50");

        const [flaggedReviews, stats] = await Promise.all([
            getFlaggedReviews(limit),
            getSpamStats(),
        ]);

        return NextResponse.json({
            reviews: flaggedReviews,
            stats,
        });
    } catch (error) {
        console.error("Error fetching flagged reviews:", error);
        return NextResponse.json(
            { error: "Failed to fetch reviews" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/reviews
 * Update review spam status (single or bulk)
 *
 * Body:
 * - reviewId?: string - Single review to update
 * - reviewIds?: string[] - Multiple reviews to update
 * - status: "APPROVED" | "BLOCKED" | "FLAGGED" | "PENDING"
 * - reason?: string - Optional reason for the action
 */
export async function PATCH(request: NextRequest) {
    const adminCheck = await requireAdmin(request);
    if (adminCheck instanceof NextResponse) return adminCheck;

    try {
        const body = await request.json();
        const { reviewId, reviewIds, status, reason } = body;

        if (!status || !["APPROVED", "BLOCKED", "FLAGGED", "PENDING"].includes(status)) {
            return NextResponse.json(
                { error: "Invalid status. Must be APPROVED, BLOCKED, FLAGGED, or PENDING" },
                { status: 400 }
            );
        }

        // Bulk operation
        if (reviewIds && Array.isArray(reviewIds) && reviewIds.length > 0) {
            if (status === "APPROVED") {
                const result = await bulkApproveReviews(reviewIds);
                return NextResponse.json({
                    success: true,
                    updated: result.count,
                    message: `${result.count} reviews approved`,
                });
            }

            if (status === "BLOCKED") {
                const results = await bulkBlockReviews(reviewIds, reason);
                return NextResponse.json({
                    success: true,
                    updated: results.length,
                    message: `${results.length} reviews blocked`,
                });
            }

            // For other statuses, update individually
            const updates = await Promise.all(
                reviewIds.map((id: string) =>
                    updateReviewSpamStatus(id, status as SpamStatusType, reason)
                )
            );

            return NextResponse.json({
                success: true,
                updated: updates.length,
                message: `${updates.length} reviews updated to ${status}`,
            });
        }

        // Single review update
        if (reviewId) {
            const updated = await updateReviewSpamStatus(
                reviewId,
                status as SpamStatusType,
                reason
            );

            return NextResponse.json({
                success: true,
                review: {
                    id: updated.id,
                    spamStatus: updated.spamStatus,
                },
                message: `Review ${status.toLowerCase()}`,
            });
        }

        return NextResponse.json(
            { error: "Either reviewId or reviewIds is required" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Error updating review status:", error);
        return NextResponse.json(
            { error: "Failed to update review" },
            { status: 500 }
        );
    }
}

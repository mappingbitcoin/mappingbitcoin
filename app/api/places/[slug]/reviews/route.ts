import { NextRequest, NextResponse } from "next/server";
import { getReviewsWithTrustByOsmId } from "@/lib/db/services/reviews";

interface RouteParams {
    params: Promise<{ slug: string }>;
}

/**
 * GET /api/places/[slug]/reviews
 * Get reviews with trust scores for a venue
 * The slug is the OSM ID (e.g., "node/123456" becomes "node-123456")
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { slug } = await params;

        // Convert slug back to OSM ID format
        // "node-123456" -> "node/123456"
        const osmId = slug.replace("-", "/");

        const result = await getReviewsWithTrustByOsmId(osmId);

        return NextResponse.json({
            osmId,
            reviews: result.reviews,
            weightedAverageRating: result.weightedAverageRating,
            simpleAverageRating: result.simpleAverageRating,
            totalReviews: result.totalReviews,
        });
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return NextResponse.json(
            { error: "Failed to fetch reviews" },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import prisma from "@/lib/db/prisma";

/**
 * GET /api/admin/reviews
 * List reviews for admin moderation
 */
export async function GET(request: NextRequest) {
    // Verify admin
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
        return authResult.response;
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20"), 100);
    const status = searchParams.get("status");

    // Build where clause
    const where: Parameters<typeof prisma.review.findMany>[0]["where"] = {};
    if (status && ["PENDING", "FLAGGED", "APPROVED", "BLOCKED"].includes(status)) {
        where.spamStatus = status as "PENDING" | "FLAGGED" | "APPROVED" | "BLOCKED";
    }

    // Fetch reviews
    const [reviews, total] = await Promise.all([
        prisma.review.findMany({
            where,
            include: {
                author: {
                    select: {
                        pubkey: true,
                        name: true,
                        picture: true,
                        nip05: true,
                    },
                },
                venue: {
                    select: {
                        id: true,
                    },
                },
            },
            orderBy: { indexedAt: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.review.count({ where }),
    ]);

    return NextResponse.json({
        reviews,
        total,
        page,
        pageSize,
    });
}

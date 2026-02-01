import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import prisma from "@/lib/db/prisma";

export interface UserListResult {
    id: string;
    pubkey: string;
    name: string | null;
    displayName: string | null;
    picture: string | null;
    nip05: string | null;
    createdAt: string;
    bannedAt: string | null;
    bannedReason: string | null;
    bannedBy: string | null;
    reviewCount: number;
    claimCount: number;
}

/**
 * GET /api/admin/users
 * List all users with search and pagination
 */
export async function GET(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (!authResult.success) return authResult.response;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const filter = searchParams.get("filter") || "all"; // all, banned, active
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;

    try {
        // Build where clause
        const where: Record<string, unknown> = {};

        // Filter by ban status
        if (filter === "banned") {
            where.bannedAt = { not: null };
        } else if (filter === "active") {
            where.bannedAt = null;
        }

        // Search by pubkey, name, or nip05
        if (query.length >= 2) {
            where.OR = [
                { pubkey: { contains: query, mode: "insensitive" } },
                { name: { contains: query, mode: "insensitive" } },
                { displayName: { contains: query, mode: "insensitive" } },
                { nip05: { contains: query, mode: "insensitive" } },
            ];
        }

        // Get users with counts
        const [users, totalCount] = await Promise.all([
            prisma.user.findMany({
                where,
                include: {
                    _count: {
                        select: {
                            reviews: true,
                            claims: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: offset,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        const results: UserListResult[] = users.map((user) => ({
            id: user.id,
            pubkey: user.pubkey,
            name: user.name,
            displayName: user.displayName,
            picture: user.picture,
            nip05: user.nip05,
            createdAt: user.createdAt.toISOString(),
            bannedAt: user.bannedAt?.toISOString() || null,
            bannedReason: user.bannedReason,
            bannedBy: user.bannedBy,
            reviewCount: user._count.reviews,
            claimCount: user._count.claims,
        }));

        // Get stats
        const [totalUsers, bannedUsers] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { bannedAt: { not: null } } }),
        ]);

        return NextResponse.json({
            users: results,
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit),
            stats: {
                totalUsers,
                bannedUsers,
                activeUsers: totalUsers - bannedUsers,
            },
        });
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}

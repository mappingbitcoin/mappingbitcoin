import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import prisma from "@/lib/db/prisma";

/**
 * GET /api/admin/graph/analytics
 * Get detailed analytics data for visualizations
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        // Get distribution data
        const [
            totalNodes,
            seederCount,
            depthDistribution,
            scoreDistribution,
            followerDistribution,
            topBySeederFollowers,
            topByTotalFollowers,
            topByScore,
            recentBuilds,
        ] = await Promise.all([
            // Total nodes
            prisma.communityGraph.count(),

            // Seeder count
            prisma.communityGraph.count({ where: { isSeeder: true } }),

            // Distribution by min depth
            prisma.communityGraph.groupBy({
                by: ["minDepth"],
                _count: { minDepth: true },
                orderBy: { minDepth: "asc" },
            }),

            // Score distribution (bucketed)
            prisma.$queryRaw<{ bucket: string; count: bigint }[]>`
                SELECT
                    CASE
                        WHEN score >= 0.8 THEN '0.8-1.0'
                        WHEN score >= 0.6 THEN '0.6-0.8'
                        WHEN score >= 0.4 THEN '0.4-0.6'
                        WHEN score >= 0.2 THEN '0.2-0.4'
                        WHEN score >= 0.1 THEN '0.1-0.2'
                        WHEN score >= 0.05 THEN '0.05-0.1'
                        ELSE '0-0.05'
                    END as bucket,
                    COUNT(*) as count
                FROM community_graph
                GROUP BY bucket
                ORDER BY bucket DESC
            `,

            // Follower count distribution
            prisma.$queryRaw<{ bucket: string; count: bigint }[]>`
                SELECT
                    CASE
                        WHEN followed_by_depth_0 >= 5 THEN '5+ seeders'
                        WHEN followed_by_depth_0 >= 3 THEN '3-4 seeders'
                        WHEN followed_by_depth_0 >= 2 THEN '2 seeders'
                        WHEN followed_by_depth_0 >= 1 THEN '1 seeder'
                        ELSE '0 seeders'
                    END as bucket,
                    COUNT(*) as count
                FROM community_graph
                WHERE is_seeder = false
                GROUP BY bucket
                ORDER BY
                    CASE bucket
                        WHEN '5+ seeders' THEN 1
                        WHEN '3-4 seeders' THEN 2
                        WHEN '2 seeders' THEN 3
                        WHEN '1 seeder' THEN 4
                        ELSE 5
                    END
            `,

            // Top 20 by seeder followers
            prisma.communityGraph.findMany({
                where: { isSeeder: false },
                orderBy: { followedByDepth0: "desc" },
                take: 20,
                select: {
                    pubkey: true,
                    followedByDepth0: true,
                    followedByDepth1: true,
                    followedByDepth2: true,
                    totalTrustFollowers: true,
                    score: true,
                },
            }),

            // Top 20 by total trust followers
            prisma.communityGraph.findMany({
                where: { isSeeder: false },
                orderBy: { totalTrustFollowers: "desc" },
                take: 20,
                select: {
                    pubkey: true,
                    followedByDepth0: true,
                    followedByDepth1: true,
                    followedByDepth2: true,
                    totalTrustFollowers: true,
                    score: true,
                },
            }),

            // Top 20 by score (non-seeders)
            prisma.communityGraph.findMany({
                where: { isSeeder: false },
                orderBy: { score: "desc" },
                take: 20,
                select: {
                    pubkey: true,
                    followedByDepth0: true,
                    followedByDepth1: true,
                    followedByDepth2: true,
                    totalTrustFollowers: true,
                    score: true,
                },
            }),

            // Recent builds
            prisma.graphBuildLog.findMany({
                orderBy: { startedAt: "desc" },
                take: 10,
            }),
        ]);

        // Calculate averages
        const avgStats = await prisma.communityGraph.aggregate({
            where: { isSeeder: false },
            _avg: {
                followedByDepth0: true,
                followedByDepth1: true,
                followedByDepth2: true,
                score: true,
            },
            _max: {
                followedByDepth0: true,
                followedByDepth1: true,
                followedByDepth2: true,
                score: true,
            },
        });

        return NextResponse.json({
            summary: {
                totalNodes,
                seederCount,
                nonSeederCount: totalNodes - seederCount,
                averages: {
                    followedByDepth0: avgStats._avg.followedByDepth0 || 0,
                    followedByDepth1: avgStats._avg.followedByDepth1 || 0,
                    followedByDepth2: avgStats._avg.followedByDepth2 || 0,
                    score: avgStats._avg.score || 0,
                },
                maximums: {
                    followedByDepth0: avgStats._max.followedByDepth0 || 0,
                    followedByDepth1: avgStats._max.followedByDepth1 || 0,
                    followedByDepth2: avgStats._max.followedByDepth2 || 0,
                    score: avgStats._max.score || 0,
                },
            },
            distributions: {
                byDepth: depthDistribution.map((d) => ({
                    depth: d.minDepth,
                    count: d._count.minDepth,
                })),
                byScore: scoreDistribution.map((d) => ({
                    bucket: d.bucket,
                    count: Number(d.count),
                })),
                bySeederFollowers: followerDistribution.map((d) => ({
                    bucket: d.bucket,
                    count: Number(d.count),
                })),
            },
            topUsers: {
                bySeederFollowers: topBySeederFollowers.map((u) => ({
                    pubkey: u.pubkey,
                    pubkeyShort: `${u.pubkey.slice(0, 8)}...${u.pubkey.slice(-8)}`,
                    followedByDepth0: u.followedByDepth0,
                    followedByDepth1: u.followedByDepth1,
                    followedByDepth2: u.followedByDepth2,
                    totalTrustFollowers: u.totalTrustFollowers,
                    score: u.score,
                })),
                byTotalFollowers: topByTotalFollowers.map((u) => ({
                    pubkey: u.pubkey,
                    pubkeyShort: `${u.pubkey.slice(0, 8)}...${u.pubkey.slice(-8)}`,
                    followedByDepth0: u.followedByDepth0,
                    followedByDepth1: u.followedByDepth1,
                    followedByDepth2: u.followedByDepth2,
                    totalTrustFollowers: u.totalTrustFollowers,
                    score: u.score,
                })),
                byScore: topByScore.map((u) => ({
                    pubkey: u.pubkey,
                    pubkeyShort: `${u.pubkey.slice(0, 8)}...${u.pubkey.slice(-8)}`,
                    followedByDepth0: u.followedByDepth0,
                    followedByDepth1: u.followedByDepth1,
                    followedByDepth2: u.followedByDepth2,
                    totalTrustFollowers: u.totalTrustFollowers,
                    score: u.score,
                })),
            },
            buildHistory: recentBuilds.map((b) => ({
                id: b.id,
                status: b.status,
                startedAt: b.startedAt,
                completedAt: b.completedAt,
                seedersCount: b.seedersCount,
                nodesCount: b.nodesCount,
                errorMessage: b.errorMessage,
            })),
        });
    } catch (error) {
        console.error("Error fetching graph analytics:", error);
        return NextResponse.json(
            { error: "Failed to fetch analytics" },
            { status: 500 }
        );
    }
}

import prisma from "@/lib/db/prisma";
import { getFollows, getFollowsBatch } from "./nostrFollows";

// Default trust score for users not in the graph
const DEFAULT_TRUST_SCORE = 0.02;

// Score calculation weights (can be tuned)
const SCORE_WEIGHTS = {
    isSeeder: 1.0,           // Being a seeder gives full score
    perDepth0Follower: 0.15, // Each seeder following you
    perDepth1Follower: 0.02, // Each depth-1 user following you
    perDepth2Follower: 0.005, // Each depth-2 user following you
    maxScore: 1.0,           // Cap the score at 1.0
};

interface UserNode {
    pubkey: string;
    depth: number; // 0=seeder, 1=followed by seeder, 2=followed by depth-1, 3+=unknown
    isSeeder: boolean;
    followedByDepth0: Set<string>; // Seeders who follow this user
    followedByDepth1: Set<string>; // Depth-1 users who follow this user
    followedByDepth2: Set<string>; // Depth-2 users who follow this user
}

/**
 * Calculate trust score from follower counts
 * This function can be tuned as needed
 */
export function calculateScore(node: {
    isSeeder: boolean;
    followedByDepth0: number;
    followedByDepth1: number;
    followedByDepth2: number;
}): number {
    if (node.isSeeder) {
        return SCORE_WEIGHTS.isSeeder;
    }

    const score =
        node.followedByDepth0 * SCORE_WEIGHTS.perDepth0Follower +
        node.followedByDepth1 * SCORE_WEIGHTS.perDepth1Follower +
        node.followedByDepth2 * SCORE_WEIGHTS.perDepth2Follower;

    return Math.min(score, SCORE_WEIGHTS.maxScore);
}

/**
 * Build the community trust graph from all seeders
 * Tracks follower counts at each depth level
 */
export async function buildCommunityGraph(): Promise<{
    success: boolean;
    nodesCount: number;
    error?: string;
}> {
    // Start build log
    const buildLog = await prisma.graphBuildLog.create({
        data: {
            status: "RUNNING",
        },
    });

    try {
        // Get all seeders
        const seeders = await prisma.communitySeeder.findMany();

        if (seeders.length === 0) {
            await prisma.graphBuildLog.update({
                where: { id: buildLog.id },
                data: {
                    status: "COMPLETED",
                    completedAt: new Date(),
                    seedersCount: 0,
                    nodesCount: 0,
                },
            });
            return { success: true, nodesCount: 0 };
        }

        console.log(`[GraphBuilder] Starting build with ${seeders.length} seeders`);

        // Map to track all users and their data
        const nodeMap = new Map<string, UserNode>();

        // Helper to get or create a node
        const getNode = (pubkey: string): UserNode => {
            let node = nodeMap.get(pubkey);
            if (!node) {
                node = {
                    pubkey,
                    depth: 999, // Will be updated
                    isSeeder: false,
                    followedByDepth0: new Set(),
                    followedByDepth1: new Set(),
                    followedByDepth2: new Set(),
                };
                nodeMap.set(pubkey, node);
            }
            return node;
        };

        // Step 1: Add all seeders as depth 0
        const seederPubkeys = new Set<string>();
        for (const seeder of seeders) {
            const node = getNode(seeder.pubkey);
            node.depth = 0;
            node.isSeeder = true;
            seederPubkeys.add(seeder.pubkey);
        }

        console.log(`[GraphBuilder] Added ${seederPubkeys.size} seeders at depth 0`);

        // Step 2: Fetch who seeders follow (these become depth 1)
        // Also track that these users are followed by depth-0 users
        console.log(`[GraphBuilder] Fetching follows for seeders...`);
        const seederFollowsMap = await getFollowsBatch(Array.from(seederPubkeys));

        const depth1Pubkeys = new Set<string>();
        for (const [seederPubkey, follows] of seederFollowsMap) {
            for (const followPubkey of follows) {
                const node = getNode(followPubkey);

                // Update depth if this is better
                if (node.depth > 1 && !node.isSeeder) {
                    node.depth = 1;
                }

                // Record that this user is followed by a seeder
                node.followedByDepth0.add(seederPubkey);

                if (!seederPubkeys.has(followPubkey)) {
                    depth1Pubkeys.add(followPubkey);
                }
            }
        }

        console.log(`[GraphBuilder] Found ${depth1Pubkeys.size} users at depth 1`);

        // Step 3: Fetch who depth-1 users follow (these become depth 2)
        // Also track that these users are followed by depth-1 users
        console.log(`[GraphBuilder] Fetching follows for ${depth1Pubkeys.size} depth-1 users...`);
        const depth1FollowsMap = await getFollowsBatch(Array.from(depth1Pubkeys));

        const depth2Pubkeys = new Set<string>();
        for (const [depth1Pubkey, follows] of depth1FollowsMap) {
            for (const followPubkey of follows) {
                const node = getNode(followPubkey);

                // Update depth if this is better
                if (node.depth > 2 && !node.isSeeder) {
                    node.depth = 2;
                }

                // Record that this user is followed by a depth-1 user
                node.followedByDepth1.add(depth1Pubkey);

                if (!seederPubkeys.has(followPubkey) && !depth1Pubkeys.has(followPubkey)) {
                    depth2Pubkeys.add(followPubkey);
                }
            }
        }

        console.log(`[GraphBuilder] Found ${depth2Pubkeys.size} users at depth 2`);

        // Step 4: Optionally fetch who depth-2 users follow to track followedByDepth2
        // This is more expensive but gives better data
        console.log(`[GraphBuilder] Fetching follows for ${depth2Pubkeys.size} depth-2 users...`);
        const depth2FollowsMap = await getFollowsBatch(Array.from(depth2Pubkeys));

        for (const [depth2Pubkey, follows] of depth2FollowsMap) {
            for (const followPubkey of follows) {
                const node = getNode(followPubkey);

                // Record that this user is followed by a depth-2 user
                node.followedByDepth2.add(depth2Pubkey);
            }
        }

        // Filter to only include nodes that are in the trust network
        // (seeders, or followed by someone in the network)
        const relevantNodes = Array.from(nodeMap.values()).filter(
            (node) =>
                node.isSeeder ||
                node.followedByDepth0.size > 0 ||
                node.followedByDepth1.size > 0 ||
                node.followedByDepth2.size > 0
        );

        console.log(`[GraphBuilder] Total relevant nodes: ${relevantNodes.length}`);

        // Step 5: Calculate scores and save to database
        await prisma.$transaction(async (tx) => {
            // Delete all existing graph nodes
            await tx.communityGraph.deleteMany({});

            // Insert new nodes in batches
            const batchSize = 1000;

            for (let i = 0; i < relevantNodes.length; i += batchSize) {
                const batch = relevantNodes.slice(i, i + batchSize);
                await tx.communityGraph.createMany({
                    data: batch.map((node) => {
                        const followedByDepth0 = node.followedByDepth0.size;
                        const followedByDepth1 = node.followedByDepth1.size;
                        const followedByDepth2 = node.followedByDepth2.size;

                        return {
                            pubkey: node.pubkey,
                            isSeeder: node.isSeeder,
                            followedByDepth0,
                            followedByDepth1,
                            followedByDepth2,
                            totalTrustFollowers: followedByDepth0 + followedByDepth1 + followedByDepth2,
                            minDepth: node.isSeeder ? 0 : node.depth,
                            score: calculateScore({
                                isSeeder: node.isSeeder,
                                followedByDepth0,
                                followedByDepth1,
                                followedByDepth2,
                            }),
                        };
                    }),
                });

                console.log(`[GraphBuilder] Inserted batch ${i / batchSize + 1}/${Math.ceil(relevantNodes.length / batchSize)}`);
            }
        });

        // Update build log
        await prisma.graphBuildLog.update({
            where: { id: buildLog.id },
            data: {
                status: "COMPLETED",
                completedAt: new Date(),
                seedersCount: seeders.length,
                nodesCount: relevantNodes.length,
            },
        });

        console.log(`[GraphBuilder] Build completed with ${relevantNodes.length} nodes`);

        return { success: true, nodesCount: relevantNodes.length };
    } catch (error) {
        console.error("[GraphBuilder] Build failed:", error);

        // Update build log with error
        await prisma.graphBuildLog.update({
            where: { id: buildLog.id },
            data: {
                status: "FAILED",
                completedAt: new Date(),
                errorMessage: error instanceof Error ? error.message : "Unknown error",
            },
        });

        return {
            success: false,
            nodesCount: 0,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Get trust score for a single pubkey
 */
export async function getTrustScore(pubkey: string): Promise<number> {
    const node = await prisma.communityGraph.findUnique({
        where: { pubkey: pubkey.toLowerCase() },
        select: { score: true },
    });

    return node?.score ?? DEFAULT_TRUST_SCORE;
}

/**
 * Get trust scores for multiple pubkeys
 */
export async function getTrustScores(pubkeys: string[]): Promise<Map<string, number>> {
    const normalizedPubkeys = pubkeys.map((p) => p.toLowerCase());

    const nodes = await prisma.communityGraph.findMany({
        where: {
            pubkey: { in: normalizedPubkeys },
        },
        select: { pubkey: true, score: true },
    });

    const scores = new Map<string, number>();

    // Set default scores for all requested pubkeys
    for (const pubkey of normalizedPubkeys) {
        scores.set(pubkey, DEFAULT_TRUST_SCORE);
    }

    // Override with actual scores from graph
    for (const node of nodes) {
        scores.set(node.pubkey, node.score);
    }

    return scores;
}

/**
 * Get full graph node info for a pubkey
 */
export async function getGraphNode(pubkey: string) {
    return prisma.communityGraph.findUnique({
        where: { pubkey: pubkey.toLowerCase() },
    });
}

/**
 * Get graph statistics
 */
export async function getGraphStats() {
    const [totalNodes, nodesByDepth, lastBuild, topByDepth0Followers] = await Promise.all([
        prisma.communityGraph.count(),
        prisma.communityGraph.groupBy({
            by: ["minDepth"],
            _count: { minDepth: true },
        }),
        prisma.graphBuildLog.findFirst({
            orderBy: { startedAt: "desc" },
        }),
        // Get top 10 users by depth-0 followers (most trusted by seeders)
        prisma.communityGraph.findMany({
            where: { isSeeder: false },
            orderBy: { followedByDepth0: "desc" },
            take: 10,
            select: {
                pubkey: true,
                followedByDepth0: true,
                followedByDepth1: true,
                score: true,
            },
        }),
    ]);

    const depthCounts: Record<number, number> = {};
    for (const group of nodesByDepth) {
        depthCounts[group.minDepth] = group._count.minDepth;
    }

    return {
        totalNodes,
        nodesByDepth: depthCounts,
        topByDepth0Followers,
        lastBuild: lastBuild
            ? {
                  status: lastBuild.status,
                  startedAt: lastBuild.startedAt,
                  completedAt: lastBuild.completedAt,
                  seedersCount: lastBuild.seedersCount,
                  nodesCount: lastBuild.nodesCount,
                  errorMessage: lastBuild.errorMessage,
              }
            : null,
    };
}

/**
 * Get build history
 */
export async function getBuildHistory(limit: number = 10) {
    return prisma.graphBuildLog.findMany({
        orderBy: { startedAt: "desc" },
        take: limit,
    });
}

/**
 * Check if a build is currently running
 */
export async function isBuildRunning(): Promise<boolean> {
    const runningBuild = await prisma.graphBuildLog.findFirst({
        where: { status: "RUNNING" },
    });
    return runningBuild !== null;
}

/**
 * Recalculate scores for all nodes (useful after tuning weights)
 */
export async function recalculateScores(): Promise<number> {
    const nodes = await prisma.communityGraph.findMany({
        select: {
            id: true,
            isSeeder: true,
            followedByDepth0: true,
            followedByDepth1: true,
            followedByDepth2: true,
        },
    });

    let updated = 0;
    for (const node of nodes) {
        const newScore = calculateScore(node);
        await prisma.communityGraph.update({
            where: { id: node.id },
            data: { score: newScore },
        });
        updated++;
    }

    return updated;
}

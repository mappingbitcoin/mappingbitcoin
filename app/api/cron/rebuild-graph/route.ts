import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import {
    buildCommunityGraph,
    isBuildRunning,
} from "@/lib/trust/graphBuilder";

/**
 * POST /api/cron/rebuild-graph
 * Manually trigger a graph rebuild (admin only)
 * Note: Automatic rebuilds are handled by the internal cron job in utils/sync/CronJob.ts
 */
export async function POST(request: NextRequest) {
    try {
        // Require admin authentication for manual triggers
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        // Check if build is already running
        const isRunning = await isBuildRunning();
        if (isRunning) {
            return NextResponse.json(
                { error: "A build is already in progress" },
                { status: 409 }
            );
        }

        console.log("[API] Starting manual graph rebuild...");

        // Start build
        const result = await buildCommunityGraph();

        if (!result.success) {
            console.error("[API] Graph build failed:", result.error);
            return NextResponse.json(
                { error: result.error || "Build failed" },
                { status: 500 }
            );
        }

        console.log(`[API] Graph rebuild completed with ${result.nodesCount} nodes`);

        return NextResponse.json({
            success: true,
            nodesCount: result.nodesCount,
        });
    } catch (error) {
        console.error("[API] Error in rebuild-graph:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

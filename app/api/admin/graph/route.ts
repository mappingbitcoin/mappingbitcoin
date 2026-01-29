import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import {
    buildCommunityGraph,
    getGraphStats,
    getBuildHistory,
    isBuildRunning,
} from "@/lib/trust/graphBuilder";

/**
 * GET /api/admin/graph
 * Get graph statistics and build history
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const [stats, history, isRunning] = await Promise.all([
            getGraphStats(),
            getBuildHistory(10),
            isBuildRunning(),
        ]);

        return NextResponse.json({
            stats,
            history,
            isRunning,
        });
    } catch (error) {
        console.error("Error getting graph stats:", error);
        return NextResponse.json(
            { error: "Failed to get graph stats" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/graph
 * Trigger a graph rebuild
 */
export async function POST(request: NextRequest) {
    try {
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

        // Start build (runs synchronously for now)
        const result = await buildCommunityGraph();

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || "Build failed" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            nodesCount: result.nodesCount,
        });
    } catch (error) {
        console.error("Error triggering graph rebuild:", error);
        return NextResponse.json(
            { error: "Failed to rebuild graph" },
            { status: 500 }
        );
    }
}

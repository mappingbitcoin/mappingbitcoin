import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { getGuidelines, upsertGuidelines } from "@/lib/db/services/marketing";

/**
 * GET /api/admin/marketing/guidelines
 * Get marketing guidelines
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const guidelines = await getGuidelines();

        return NextResponse.json({ guidelines });
    } catch (error) {
        console.error("Error getting guidelines:", error);
        return NextResponse.json(
            { error: "Failed to get guidelines" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/marketing/guidelines
 * Update or create marketing guidelines
 */
export async function PUT(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const body = await request.json();
        const { voiceTone, doList, dontList, brandValues } = body;

        const guidelines = await upsertGuidelines({
            voiceTone,
            doList,
            dontList,
            brandValues,
        });

        return NextResponse.json({
            success: true,
            guidelines,
        });
    } catch (error) {
        console.error("Error updating guidelines:", error);
        return NextResponse.json(
            { error: "Failed to update guidelines" },
            { status: 500 }
        );
    }
}

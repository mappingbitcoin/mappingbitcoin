import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { getMarketingStat, updateMarketingStat, deleteMarketingStat } from "@/lib/db/services/marketing";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/marketing/stats/[id]
 * Get a specific marketing stat
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { id } = await params;
        const stat = await getMarketingStat(id);

        if (!stat) {
            return NextResponse.json(
                { error: "Stat not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ stat });
    } catch (error) {
        console.error("Error getting marketing stat:", error);
        return NextResponse.json(
            { error: "Failed to get marketing stat" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/marketing/stats/[id]
 * Update a marketing stat
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { id } = await params;
        const body = await request.json();
        const { label, value, source, category, expiresAt } = body;

        const existing = await getMarketingStat(id);
        if (!existing) {
            return NextResponse.json(
                { error: "Stat not found" },
                { status: 404 }
            );
        }

        const stat = await updateMarketingStat(id, {
            label,
            value,
            source,
            category,
            expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : undefined,
        });

        return NextResponse.json({
            success: true,
            stat,
        });
    } catch (error) {
        console.error("Error updating marketing stat:", error);
        return NextResponse.json(
            { error: "Failed to update marketing stat" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/marketing/stats/[id]
 * Delete a marketing stat
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { id } = await params;

        const existing = await getMarketingStat(id);
        if (!existing) {
            return NextResponse.json(
                { error: "Stat not found" },
                { status: 404 }
            );
        }

        await deleteMarketingStat(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting marketing stat:", error);
        return NextResponse.json(
            { error: "Failed to delete marketing stat" },
            { status: 500 }
        );
    }
}

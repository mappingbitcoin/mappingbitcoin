import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { getMarketingLink, updateMarketingLink, deleteMarketingLink } from "@/lib/db/services/marketing";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/marketing/links/[id]
 * Get a specific marketing link
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { id } = await params;
        const link = await getMarketingLink(id);

        if (!link) {
            return NextResponse.json(
                { error: "Link not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ link });
    } catch (error) {
        console.error("Error getting link:", error);
        return NextResponse.json(
            { error: "Failed to get link" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/marketing/links/[id]
 * Update a marketing link
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { id } = await params;
        const body = await request.json();
        const { title, url, description, category } = body;

        const existing = await getMarketingLink(id);
        if (!existing) {
            return NextResponse.json(
                { error: "Link not found" },
                { status: 404 }
            );
        }

        const link = await updateMarketingLink(id, {
            title,
            url,
            description,
            category,
        });

        return NextResponse.json({
            success: true,
            link,
        });
    } catch (error) {
        console.error("Error updating link:", error);
        return NextResponse.json(
            { error: "Failed to update link" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/marketing/links/[id]
 * Delete a marketing link
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { id } = await params;

        const existing = await getMarketingLink(id);
        if (!existing) {
            return NextResponse.json(
                { error: "Link not found" },
                { status: 404 }
            );
        }

        await deleteMarketingLink(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting link:", error);
        return NextResponse.json(
            { error: "Failed to delete link" },
            { status: 500 }
        );
    }
}

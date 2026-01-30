import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { getHashtagSet, updateHashtagSet, deleteHashtagSet } from "@/lib/db/services/marketing";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/marketing/hashtags/[id]
 * Get a specific hashtag set
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { id } = await params;
        const hashtagSet = await getHashtagSet(id);

        if (!hashtagSet) {
            return NextResponse.json(
                { error: "Hashtag set not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ hashtagSet });
    } catch (error) {
        console.error("Error getting hashtag set:", error);
        return NextResponse.json(
            { error: "Failed to get hashtag set" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/marketing/hashtags/[id]
 * Update a hashtag set
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { id } = await params;
        const body = await request.json();
        const { name, hashtags, socialNetworks, description } = body;

        const existing = await getHashtagSet(id);
        if (!existing) {
            return NextResponse.json(
                { error: "Hashtag set not found" },
                { status: 404 }
            );
        }

        const hashtagSet = await updateHashtagSet(id, {
            name,
            hashtags,
            socialNetworks,
            description,
        });

        return NextResponse.json({
            success: true,
            hashtagSet,
        });
    } catch (error) {
        console.error("Error updating hashtag set:", error);
        return NextResponse.json(
            { error: "Failed to update hashtag set" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/marketing/hashtags/[id]
 * Delete a hashtag set
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { id } = await params;

        const existing = await getHashtagSet(id);
        if (!existing) {
            return NextResponse.json(
                { error: "Hashtag set not found" },
                { status: 404 }
            );
        }

        await deleteHashtagSet(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting hashtag set:", error);
        return NextResponse.json(
            { error: "Failed to delete hashtag set" },
            { status: 500 }
        );
    }
}

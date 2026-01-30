import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { getExamplePost, updateExamplePost, deleteExamplePost } from "@/lib/db/services/marketing";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/marketing/posts/[id]
 * Get a specific example post
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { id } = await params;
        const post = await getExamplePost(id);

        if (!post) {
            return NextResponse.json(
                { error: "Post not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ post });
    } catch (error) {
        console.error("Error getting example post:", error);
        return NextResponse.json(
            { error: "Failed to get example post" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/marketing/posts/[id]
 * Update an example post
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { id } = await params;
        const body = await request.json();
        const { socialNetwork, content, hashtags, notes } = body;

        const existing = await getExamplePost(id);
        if (!existing) {
            return NextResponse.json(
                { error: "Post not found" },
                { status: 404 }
            );
        }

        const post = await updateExamplePost(id, {
            socialNetwork,
            content,
            hashtags,
            notes,
        });

        return NextResponse.json({
            success: true,
            post,
        });
    } catch (error) {
        console.error("Error updating example post:", error);
        return NextResponse.json(
            { error: "Failed to update example post" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/marketing/posts/[id]
 * Delete an example post
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { id } = await params;

        const existing = await getExamplePost(id);
        if (!existing) {
            return NextResponse.json(
                { error: "Post not found" },
                { status: 404 }
            );
        }

        await deleteExamplePost(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting example post:", error);
        return NextResponse.json(
            { error: "Failed to delete example post" },
            { status: 500 }
        );
    }
}

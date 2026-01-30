import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { listExamplePosts, createExamplePost } from "@/lib/db/services/marketing";
import { SocialNetwork } from "@prisma/client";

/**
 * GET /api/admin/marketing/posts
 * List all example posts
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { searchParams } = new URL(request.url);
        const socialNetwork = searchParams.get("socialNetwork") as SocialNetwork | null;

        const posts = await listExamplePosts({
            socialNetwork: socialNetwork || undefined,
        });

        return NextResponse.json({ posts });
    } catch (error) {
        console.error("Error listing example posts:", error);
        return NextResponse.json(
            { error: "Failed to list example posts" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/marketing/posts
 * Create a new example post
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const body = await request.json();
        const { socialNetwork, content, hashtags, notes } = body;

        if (!socialNetwork || !content) {
            return NextResponse.json(
                { error: "socialNetwork and content are required" },
                { status: 400 }
            );
        }

        // Validate socialNetwork is a valid enum value
        if (!Object.values(SocialNetwork).includes(socialNetwork)) {
            return NextResponse.json(
                { error: "Invalid social network" },
                { status: 400 }
            );
        }

        const post = await createExamplePost({
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
        console.error("Error creating example post:", error);
        return NextResponse.json(
            { error: "Failed to create example post" },
            { status: 500 }
        );
    }
}

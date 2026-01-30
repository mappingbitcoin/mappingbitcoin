import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { listHashtagSets, createHashtagSet } from "@/lib/db/services/marketing";

/**
 * GET /api/admin/marketing/hashtags
 * List all hashtag sets
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const hashtagSets = await listHashtagSets();

        return NextResponse.json({ hashtagSets });
    } catch (error) {
        console.error("Error listing hashtag sets:", error);
        return NextResponse.json(
            { error: "Failed to list hashtag sets" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/marketing/hashtags
 * Create a new hashtag set
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const body = await request.json();
        const { name, hashtags, socialNetworks, description } = body;

        if (!name || !hashtags || !Array.isArray(hashtags) || hashtags.length === 0) {
            return NextResponse.json(
                { error: "name and hashtags array are required" },
                { status: 400 }
            );
        }

        const hashtagSet = await createHashtagSet({
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
        console.error("Error creating hashtag set:", error);
        return NextResponse.json(
            { error: "Failed to create hashtag set" },
            { status: 500 }
        );
    }
}

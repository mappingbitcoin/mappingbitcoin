import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { listMarketingAssets, createMarketingAsset } from "@/lib/db/services/marketing";
import { SocialNetwork, PostType, ContentTopic } from "@prisma/client";

/**
 * GET /api/admin/marketing/assets
 * List all marketing assets with optional filters
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { searchParams } = new URL(request.url);
        const socialNetwork = searchParams.get("socialNetwork") as SocialNetwork | null;
        const postType = searchParams.get("postType") as PostType | null;
        const topic = searchParams.get("topic") as ContentTopic | null;
        const customTag = searchParams.get("customTag") || undefined;

        const assets = await listMarketingAssets({
            socialNetwork: socialNetwork || undefined,
            postType: postType || undefined,
            topic: topic || undefined,
            customTag,
        });

        return NextResponse.json({ assets });
    } catch (error) {
        console.error("Error listing assets:", error);
        return NextResponse.json(
            { error: "Failed to list assets" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/marketing/assets
 * Create a new marketing asset (after file is uploaded to storage)
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const body = await request.json();
        const {
            filename,
            storageKey,
            mimeType,
            size,
            socialNetworks,
            postTypes,
            topic,
            customTags,
            altText,
        } = body;

        if (!filename || !storageKey || !mimeType || size === undefined) {
            return NextResponse.json(
                { error: "filename, storageKey, mimeType, and size are required" },
                { status: 400 }
            );
        }

        const asset = await createMarketingAsset({
            filename,
            storageKey,
            mimeType,
            size,
            socialNetworks,
            postTypes,
            topic,
            customTags,
            altText,
        });

        return NextResponse.json({
            success: true,
            asset,
        });
    } catch (error) {
        console.error("Error creating asset:", error);
        return NextResponse.json(
            { error: "Failed to create asset" },
            { status: 500 }
        );
    }
}

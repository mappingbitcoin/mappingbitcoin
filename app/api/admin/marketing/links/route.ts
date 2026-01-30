import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { listMarketingLinks, createMarketingLink, listLinkCategories } from "@/lib/db/services/marketing";

/**
 * GET /api/admin/marketing/links
 * List all marketing links
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category") || undefined;

        const [links, categories] = await Promise.all([
            listMarketingLinks({ category }),
            listLinkCategories(),
        ]);

        return NextResponse.json({ links, categories });
    } catch (error) {
        console.error("Error listing links:", error);
        return NextResponse.json(
            { error: "Failed to list links" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/marketing/links
 * Create a new marketing link
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const body = await request.json();
        const { title, url, description, category } = body;

        if (!title || !url || !category) {
            return NextResponse.json(
                { error: "title, url, and category are required" },
                { status: 400 }
            );
        }

        const link = await createMarketingLink({
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
        console.error("Error creating link:", error);
        return NextResponse.json(
            { error: "Failed to create link" },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { listMarketingStats, createMarketingStat, listStatCategories } from "@/lib/db/services/marketing";

/**
 * GET /api/admin/marketing/stats
 * List all marketing stats
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category") || undefined;
        const includeExpired = searchParams.get("includeExpired") === "true";

        const [stats, categories] = await Promise.all([
            listMarketingStats({ category, includeExpired }),
            listStatCategories(),
        ]);

        return NextResponse.json({ stats, categories });
    } catch (error) {
        console.error("Error listing marketing stats:", error);
        return NextResponse.json(
            { error: "Failed to list marketing stats" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/marketing/stats
 * Create a new marketing stat
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const body = await request.json();
        const { label, value, source, category, expiresAt } = body;

        if (!label || !value || !category) {
            return NextResponse.json(
                { error: "label, value, and category are required" },
                { status: 400 }
            );
        }

        const stat = await createMarketingStat({
            label,
            value,
            source,
            category,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
        });

        return NextResponse.json({
            success: true,
            stat,
        });
    } catch (error) {
        console.error("Error creating marketing stat:", error);
        return NextResponse.json(
            { error: "Failed to create marketing stat" },
            { status: 500 }
        );
    }
}

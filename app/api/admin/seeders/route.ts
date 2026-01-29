import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { listSeeders, createSeeder } from "@/lib/db/services/seeders";

/**
 * GET /api/admin/seeders
 * List all community seeders
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { searchParams } = new URL(request.url);
        const region = searchParams.get("region") || undefined;

        const seeders = await listSeeders(region);

        return NextResponse.json({ seeders });
    } catch (error) {
        console.error("Error listing seeders:", error);
        return NextResponse.json(
            { error: "Failed to list seeders" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/seeders
 * Create a new community seeder
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const body = await request.json();
        const { pubkey, region, label } = body;

        if (!pubkey || !region) {
            return NextResponse.json(
                { error: "pubkey and region are required" },
                { status: 400 }
            );
        }

        const result = await createSeeder({
            pubkey,
            region,
            label,
            addedBy: authResult.pubkey,
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            seeder: result.seeder,
        });
    } catch (error) {
        console.error("Error creating seeder:", error);
        return NextResponse.json(
            { error: "Failed to create seeder" },
            { status: 500 }
        );
    }
}

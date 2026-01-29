import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { getSeeder, updateSeeder, deleteSeeder } from "@/lib/db/services/seeders";

interface RouteParams {
    params: Promise<{ pubkey: string }>;
}

/**
 * GET /api/admin/seeders/[pubkey]
 * Get a specific seeder by pubkey
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { pubkey } = await params;
        const seeder = await getSeeder(pubkey);

        if (!seeder) {
            return NextResponse.json(
                { error: "Seeder not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ seeder });
    } catch (error) {
        console.error("Error getting seeder:", error);
        return NextResponse.json(
            { error: "Failed to get seeder" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/seeders/[pubkey]
 * Update a seeder's region or label
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { pubkey } = await params;
        const body = await request.json();
        const { region, label } = body;

        const result = await updateSeeder(pubkey, { region, label });

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
        console.error("Error updating seeder:", error);
        return NextResponse.json(
            { error: "Failed to update seeder" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/seeders/[pubkey]
 * Delete a seeder
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { pubkey } = await params;
        const result = await deleteSeeder(pubkey);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting seeder:", error);
        return NextResponse.json(
            { error: "Failed to delete seeder" },
            { status: 500 }
        );
    }
}

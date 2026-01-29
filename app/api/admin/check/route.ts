import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware/adminAuth";
import { isAdmin } from "@/lib/db/services/admin";

/**
 * GET /api/admin/check
 * Check if the authenticated user is an admin
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const adminStatus = await isAdmin(authResult.pubkey);

        return NextResponse.json({
            isAdmin: adminStatus,
            pubkey: authResult.pubkey,
        });
    } catch (error) {
        console.error("Error checking admin status:", error);
        return NextResponse.json(
            { error: "Failed to check admin status" },
            { status: 500 }
        );
    }
}

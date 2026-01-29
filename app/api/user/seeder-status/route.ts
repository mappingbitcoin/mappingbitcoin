import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

/**
 * GET /api/user/seeder-status?pubkey=<pubkey>
 * Check if a user is a community seeder
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const pubkey = searchParams.get("pubkey");

        if (!pubkey) {
            return NextResponse.json(
                { error: "pubkey is required" },
                { status: 400 }
            );
        }

        const seeder = await prisma.communitySeeder.findUnique({
            where: { pubkey: pubkey.toLowerCase() },
            select: {
                pubkey: true,
                label: true,
                region: true,
            },
        });

        return NextResponse.json({
            isSeeder: seeder !== null,
            seeder: seeder ? {
                label: seeder.label,
                region: seeder.region,
            } : null,
        });
    } catch (error) {
        console.error("Error checking seeder status:", error);
        return NextResponse.json(
            { error: "Failed to check seeder status" },
            { status: 500 }
        );
    }
}

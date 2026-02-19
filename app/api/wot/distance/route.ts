import { NextRequest, NextResponse } from "next/server";
import { getWoTDistance, getMappingBitcoinBotPubkey } from "@/lib/wot/oracleClient";

/**
 * GET /api/wot/distance?pubkey={pubkey}
 * Get WoT distance from bot to target pubkey
 */
export async function GET(request: NextRequest) {
    const pubkey = request.nextUrl.searchParams.get("pubkey");

    if (!pubkey || !/^[0-9a-fA-F]{64}$/.test(pubkey)) {
        return NextResponse.json(
            { error: "Invalid pubkey format" },
            { status: 400 }
        );
    }

    try {
        const result = await getWoTDistance(pubkey.toLowerCase());

        return NextResponse.json({
            pubkey: pubkey.toLowerCase(),
            distance: result.hops,
            pathCount: result.pathCount,
            mutual: result.mutual,
            fromPubkey: getMappingBitcoinBotPubkey(),
            source: "oracle",
        });
    } catch (error) {
        console.error("[WoT API] Error:", error);
        return NextResponse.json(
            { error: "Failed to compute WoT distance" },
            { status: 500 }
        );
    }
}

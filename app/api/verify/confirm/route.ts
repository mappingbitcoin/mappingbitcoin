import { NextRequest, NextResponse } from "next/server";
import { validateAuthToken } from "@/lib/db/services/auth";
import { verifyEmailCode } from "@/lib/db/services/verification";
import prisma from "@/lib/db/prisma";
import { getVenueCache, getVenueIndexMap } from "@/app/api/cache/VenueCache";
import { parseTags } from "@/utils/OsmHelpers";
import { isDevelopment } from "@/lib/Environment";

interface ConfirmRequest {
    claimId: string;
    code: string;
}

function getAuthToken(request: NextRequest): string | null {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.slice(7);
    }
    return null;
}

/**
 * Parse OSM ID and extract the numeric ID
 */
function parseOsmIdNumber(osmId: string): number | null {
    const match = osmId.match(/^(?:node|way|relation)\/(\d+)$/);
    if (match) {
        return parseInt(match[1], 10);
    }
    return null;
}

export async function POST(request: NextRequest) {
    try {
        // Validate auth token
        const token = getAuthToken(request);
        if (!token) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const pubkey = await validateAuthToken(token);
        if (!pubkey) {
            return NextResponse.json(
                { error: "Invalid or expired token" },
                { status: 401 }
            );
        }

        const body: ConfirmRequest = await request.json();
        const { claimId, code } = body;

        // Validate inputs
        if (!claimId || typeof claimId !== "string") {
            return NextResponse.json(
                { error: "Invalid claimId" },
                { status: 400 }
            );
        }

        if (!code || !/^\d{6}$/.test(code)) {
            return NextResponse.json(
                { error: "Invalid verification code format" },
                { status: 400 }
            );
        }

        // Verify the claim belongs to the authenticated user
        const claim = await prisma.claim.findUnique({
            where: { id: claimId },
            include: { venue: true },
        });

        if (!claim) {
            return NextResponse.json(
                { error: "Claim not found" },
                { status: 404 }
            );
        }

        if (claim.claimerPubkey !== pubkey) {
            return NextResponse.json(
                { error: "Not authorized to verify this claim" },
                { status: 403 }
            );
        }

        // Get the email from venue cache - NOT from client
        const numericId = parseOsmIdNumber(claim.venue.osmId);
        if (!numericId) {
            return NextResponse.json(
                { error: "Invalid venue ID" },
                { status: 400 }
            );
        }

        const venues = await getVenueCache();
        const venueIndexMap = await getVenueIndexMap();
        const venueIndex = venueIndexMap[numericId];

        if (venueIndex === undefined) {
            return NextResponse.json(
                { error: "Venue not found in cache" },
                { status: 404 }
            );
        }

        const venue = venues[venueIndex];
        const { contact } = parseTags(venue.tags);
        const venueEmail = contact?.email;

        if (!venueEmail) {
            return NextResponse.json(
                { error: "No email found for venue" },
                { status: 400 }
            );
        }

        // In development, use test email for hash verification
        const email = isDevelopment ? "leon@dandelionlabs.io" : venueEmail;

        // Verify the code
        const result = await verifyEmailCode(claimId, code, email);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Venue ownership verified successfully",
        });
    } catch (error) {
        console.error("Confirm verification error:", error);
        return NextResponse.json(
            { error: "Failed to confirm verification" },
            { status: 500 }
        );
    }
}

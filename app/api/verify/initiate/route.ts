import { NextRequest, NextResponse } from "next/server";
import { validateAuthToken } from "@/lib/db/services/auth";
import { initiateEmailVerification, getVerificationStatus } from "@/lib/db/services/verification";
import { getVenueCache, getVenueIndexMap } from "@/app/api/cache/VenueCache";
import { parseTags } from "@/utils/OsmHelpers";
import { isDevelopment } from "@/lib/Environment";

interface InitiateRequest {
    osmId: string;
    venueName?: string;
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
 * Supports formats: "node/123456" or just "123456"
 */
function parseOsmIdNumber(osmId: string): number | null {
    // Handle "node/123456" format
    const match = osmId.match(/^(?:node|way|relation)\/(\d+)$/);
    if (match) {
        return parseInt(match[1], 10);
    }

    // Handle plain numeric ID
    const numericId = parseInt(osmId, 10);
    if (!isNaN(numericId)) {
        return numericId;
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

        const body: InitiateRequest = await request.json();
        const { osmId, venueName } = body;

        // Validate osmId
        if (!osmId || typeof osmId !== "string") {
            return NextResponse.json(
                { error: "Invalid osmId" },
                { status: 400 }
            );
        }

        // Parse the OSM ID to get numeric ID
        const numericId = parseOsmIdNumber(osmId);
        if (!numericId) {
            return NextResponse.json(
                { error: "Invalid osmId format" },
                { status: 400 }
            );
        }

        // Get venue from cache - do NOT trust client-provided email
        const venues = await getVenueCache();
        const venueIndexMap = await getVenueIndexMap();
        const venueIndex = venueIndexMap[numericId];

        if (venueIndex === undefined) {
            return NextResponse.json(
                { error: "Venue not found" },
                { status: 404 }
            );
        }

        const venue = venues[venueIndex];
        if (!venue || !venue.tags) {
            return NextResponse.json(
                { error: "Venue data not available" },
                { status: 404 }
            );
        }

        // Extract email from venue tags using parseTags
        const { contact } = parseTags(venue.tags);
        const email = contact?.email;

        if (!email) {
            return NextResponse.json(
                { error: "No email address found for this venue. The venue must have a contact:email or email tag to verify ownership." },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Invalid email address found in venue data" },
                { status: 400 }
            );
        }

        // Normalize osmId format for storage
        const normalizedOsmId = `${venue.type}/${venue.id}`;

        // Check if venue is already verified by another user
        const status = await getVerificationStatus(normalizedOsmId);
        if (status.isVerified && status.ownerPubkey !== pubkey) {
            return NextResponse.json(
                { error: "This venue is already verified by another owner" },
                { status: 409 }
            );
        }

        // In development, override email to test address
        const targetEmail = isDevelopment ? "leon@dandelionlabs.io" : email;

        // Initiate verification - send code to the email from our cache
        const { claimId, expiresAt } = await initiateEmailVerification(
            normalizedOsmId,
            pubkey,
            targetEmail,
            venueName || venue.tags?.name
        );

        // Return masked email for UI (show actual email in dev, masked in prod)
        const maskedEmail = isDevelopment ? `${targetEmail} (dev mode)` : maskEmail(email);

        return NextResponse.json({
            success: true,
            claimId,
            expiresAt: expiresAt.toISOString(),
            maskedEmail,
            message: "Verification code sent to the email address registered for this venue",
        });
    } catch (error) {
        console.error("Initiate verification error:", error);
        return NextResponse.json(
            { error: "Failed to initiate verification" },
            { status: 500 }
        );
    }
}

/**
 * Mask an email address for display (e.g., "test@example.com" -> "t***@example.com")
 */
function maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    if (!local || !domain) return "***@***";

    if (local.length <= 2) {
        return `${local[0]}***@${domain}`;
    }

    return `${local[0]}${"*".repeat(Math.min(local.length - 1, 5))}@${domain}`;
}

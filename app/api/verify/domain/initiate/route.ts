import { NextRequest, NextResponse } from "next/server";
import { validateAuthToken } from "@/lib/db/services/auth";
import { getVenueCache, getVenueIndexMap } from "@/app/api/cache/VenueCache";
import { parseTags } from "@/utils/OsmHelpers";
import { initiateDomainVerification, extractDomain, extractDomainFromEmail, getVerificationStatus } from "@/lib/db/services/verification";

function getAuthToken(request: NextRequest): string | null {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.slice(7);
    }
    return null;
}

export async function POST(request: NextRequest) {
    try {
        // Validate auth token
        const token = getAuthToken(request);
        if (!token) {
            return NextResponse.json(
                { error: "Authorization required" },
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

        const body = await request.json();
        const { osmId, selectedDomain } = body;

        if (!osmId) {
            return NextResponse.json(
                { error: "osmId is required" },
                { status: 400 }
            );
        }

        // Normalize osmId format
        const normalizedOsmId = osmId.includes("/") ? osmId : `node/${osmId}`;

        // Get venue from cache to extract website and email
        const venues = await getVenueCache();
        const indexMap = await getVenueIndexMap();
        const numericId = parseInt(normalizedOsmId.split("/")[1], 10);
        const venueIndex = indexMap[numericId];

        if (venueIndex === undefined) {
            return NextResponse.json(
                { error: "Venue not found" },
                { status: 404 }
            );
        }

        const venue = venues[venueIndex];
        const { contact } = parseTags(venue.tags);
        const website = contact?.website;
        const email = contact?.email;

        // Extract available domains
        const websiteDomain = website ? extractDomain(website) : null;
        const emailDomain = email ? extractDomainFromEmail(email) : null;

        // Determine which domain to use
        let domain: string | null = null;

        if (selectedDomain) {
            // User explicitly selected a domain - validate it matches one of the available domains
            if (selectedDomain === websiteDomain || selectedDomain === emailDomain) {
                domain = selectedDomain;
            } else {
                return NextResponse.json(
                    { error: "Selected domain does not match venue's website or email domain" },
                    { status: 400 }
                );
            }
        } else {
            // No explicit selection - use website domain if available, otherwise email domain
            domain = websiteDomain || emailDomain;
        }

        if (!domain) {
            return NextResponse.json(
                { error: "This venue does not have a website or email registered. Domain verification requires at least one." },
                { status: 400 }
            );
        }

        // Check if venue is already verified by someone else
        const existingStatus = await getVerificationStatus(normalizedOsmId);
        if (existingStatus.isVerified && existingStatus.ownerPubkey !== pubkey) {
            return NextResponse.json(
                { error: "This venue is already verified by another user" },
                { status: 409 }
            );
        }

        // Initiate domain verification
        const { claimId, txtRecordValue, expiresAt } = await initiateDomainVerification(
            normalizedOsmId,
            pubkey,
            domain
        );

        return NextResponse.json({
            success: true,
            claimId,
            domain,
            txtRecordValue,
            expiresAt,
            instructions: `Add a TXT record to your domain's DNS with the value: ${txtRecordValue}`,
        });
    } catch (error) {
        console.error("Domain verification initiation error:", error);
        return NextResponse.json(
            { error: "Failed to initiate domain verification" },
            { status: 500 }
        );
    }
}

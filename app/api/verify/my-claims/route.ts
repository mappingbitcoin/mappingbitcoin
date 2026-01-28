import { NextRequest, NextResponse } from "next/server";
import { validateAuthToken } from "@/lib/db/services/auth";
import { getClaimsForUser } from "@/lib/db/services/verification";
import { getVenueCache, getVenueIndexMap } from "@/app/api/cache/VenueCache";
import { parseTags } from "@/utils/OsmHelpers";

function getAuthToken(request: NextRequest): string | null {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.slice(7);
    }
    return null;
}

export async function GET(request: NextRequest) {
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

        const claims = await getClaimsForUser(pubkey);

        // Enrich claims with venue data from cache
        const venues = await getVenueCache();
        const indexMap = await getVenueIndexMap();

        const enrichedClaims = claims.map(claim => {
            // Parse osmId to get numeric ID
            const parts = claim.osmId.split("/");
            const numericId = parseInt(parts[1] || parts[0], 10);
            const venueIndex = indexMap[numericId];

            let venueName = "Unknown Venue";
            let venueSlug: string | undefined;
            let venueCity: string | undefined;
            let venueCountry: string | undefined;

            if (venueIndex !== undefined) {
                const venue = venues[venueIndex];
                const { name } = parseTags(venue.tags);
                venueName = name || "Unnamed Venue";
                venueSlug = venue.slug;
                venueCity = venue.city;
                venueCountry = venue.country;
            }

            return {
                ...claim,
                venueName,
                venueSlug,
                venueCity,
                venueCountry,
            };
        });

        return NextResponse.json({
            success: true,
            claims: enrichedClaims,
        });
    } catch (error) {
        console.error("Error fetching user claims:", error);
        return NextResponse.json(
            { error: "Failed to fetch claims" },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { getVenueCache } from "@/app/api/cache/VenueCache";
import { getLocalizedCountryName } from "@/utils/CountryUtils";
import { tokenizeAndNormalize } from "@/utils/StringUtils";
import prisma from "@/lib/db/prisma";

export interface VerifiedPlaceResult {
    claimId: string;
    venueId: number;
    osmId: string;
    name: string;
    city: string;
    state?: string;
    country: string;
    countryCode: string;
    category?: string;
    subcategory?: string;
    slug?: string;
    lat: number;
    lon: number;
    verificationMethod: string;
    verifierPubkey: string;
    verifierName?: string;
    verifiedAt: string;
    verifiedEmailHash?: string;
    domainVerified?: string;
}

/**
 * Extract numeric ID from osmId format (e.g., "node/123456" -> "123456")
 */
function extractNumericOsmId(osmId: string): string {
    const match = osmId.match(/^(?:node|way|relation)\/(\d+)$/);
    if (match) {
        return match[1];
    }
    return osmId;
}

/**
 * Get full country name from country code
 */
function getCountryName(countryCode: string): string {
    if (!countryCode) return "Unknown";
    const name = getLocalizedCountryName("en", countryCode.toUpperCase());
    return name || countryCode;
}

/**
 * GET /api/admin/places
 * List all verified places with optional search
 */
export async function GET(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (!authResult.success) return authResult.response;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;

    try {
        // Get all verified claims with venue and claimer info
        const [verifiedClaims, totalCount] = await Promise.all([
            prisma.claim.findMany({
                where: {
                    status: "VERIFIED",
                    revokedAt: null,
                },
                include: {
                    venue: true,
                    claimer: true,
                },
                orderBy: {
                    verifiedAt: "desc",
                },
            }),
            prisma.claim.count({
                where: {
                    status: "VERIFIED",
                    revokedAt: null,
                },
            }),
        ]);

        // Get venue cache for enriching with venue data
        const venues = await getVenueCache();
        const venueMap = new Map(venues.map((v) => [String(v.id), v]));

        // Build results with venue data
        let results: VerifiedPlaceResult[] = [];

        for (const claim of verifiedClaims) {
            const numericId = extractNumericOsmId(claim.venue.id);
            const venue = venueMap.get(numericId);

            if (!venue) continue;

            // If there's a search query, filter by it
            if (query.length >= 2) {
                const queryTokens = tokenizeAndNormalize(query);
                const venueTokens = tokenizeAndNormalize(
                    `${venue.tags?.name || ""} ${venue.city || ""} ${venue.state || ""} ${venue.country || ""}`
                );

                let matchCount = 0;
                for (const qToken of queryTokens) {
                    for (const token of venueTokens) {
                        if (token.includes(qToken)) {
                            matchCount++;
                            break;
                        }
                    }
                }

                if (matchCount === 0) continue;
            }

            results.push({
                claimId: claim.id,
                venueId: venue.id,
                osmId: claim.venue.id,
                name: venue.tags?.name || "Unknown",
                city: venue.city,
                state: venue.state,
                country: getCountryName(venue.country),
                countryCode: venue.country,
                category: venue.category,
                subcategory: venue.subcategory,
                slug: venue.slug,
                lat: venue.lat,
                lon: venue.lon,
                verificationMethod: claim.method,
                verifierPubkey: claim.claimerPubkey,
                verifierName: claim.claimer?.displayName || undefined,
                verifiedAt: claim.verifiedAt?.toISOString() || claim.createdAt.toISOString(),
                verifiedEmailHash: claim.verifiedEmailHash || undefined,
                domainVerified: claim.domainVerified || undefined,
            });
        }

        // Apply pagination after filtering
        const paginatedResults = results.slice(offset, offset + limit);

        return NextResponse.json({
            places: paginatedResults,
            total: results.length,
            page,
            limit,
            totalPages: Math.ceil(results.length / limit),
        });
    } catch (error) {
        console.error("Failed to fetch verified places:", error);
        return NextResponse.json(
            { error: "Failed to fetch verified places" },
            { status: 500 }
        );
    }
}

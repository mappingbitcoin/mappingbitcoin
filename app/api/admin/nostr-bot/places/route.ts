import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { getVenueCache, getVenueSearchIndexMap } from "@/app/api/cache/VenueCache";
import { getActiveVerifiedClaimByOsmId } from "@/lib/db/services/claims";
import { tokenizeAndNormalize } from "@/utils/StringUtils";
import { getLocalizedCountryName } from "@/utils/CountryUtils";
import { EnrichedVenue } from "@/models/Overpass";
import prisma from "@/lib/db/prisma";

export interface PlaceSearchResult {
    id: number;
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
    isVerified: boolean;
    verificationMethod?: string;
    verifierPubkey?: string;
    creatorPubkey?: string;
}

/**
 * Get full country name from country code
 */
function getCountryName(countryCode: string): string {
    if (!countryCode) return "Unknown";
    // Try to get localized name, fallback to code
    const name = getLocalizedCountryName("en", countryCode.toUpperCase());
    return name || countryCode;
}

/**
 * Extract numeric ID from osmId format (e.g., "node/123456" -> "123456")
 */
function extractNumericOsmId(osmId: string): string {
    const match = osmId.match(/^(?:node|way|relation)\/(\d+)$/);
    if (match) {
        return match[1];
    }
    return osmId; // Return as-is if already numeric
}

/**
 * GET /api/admin/nostr-bot/places
 * Search for places in the venue cache
 */
export async function GET(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (!authResult.success) return authResult.response;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const filter = searchParams.get("filter") || "all"; // all, verified, unverified
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    try {
        const venues = await getVenueCache();
        const searchIndex = await getVenueSearchIndexMap();

        // Create venue lookup map for quick access
        const venueMap = new Map<string, EnrichedVenue>();
        venues.forEach((v) => venueMap.set(String(v.id), v));

        // For verified filter, start by getting all verified claims first
        if (filter === "verified") {
            // Get all verified claims
            const verifiedClaims = await prisma.claim.findMany({
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
                take: 100, // Get more to filter by query
            });

            let placesWithVerification: PlaceSearchResult[] = [];

            for (const claim of verifiedClaims) {
                // Extract numeric ID from osmId format (e.g., "node/123456" -> "123456")
                const numericId = extractNumericOsmId(claim.venue.osmId);
                const venue = venueMap.get(numericId);
                if (!venue) continue;

                // If there's a query, check if it matches
                if (query.length >= 2) {
                    const queryTokens = tokenizeAndNormalize(query);
                    const venueIndex = venues.indexOf(venue);
                    const tokens = searchIndex[venueIndex];
                    if (!tokens) continue;

                    let matchCount = 0;
                    for (const qToken of queryTokens) {
                        for (const token of tokens) {
                            if (token.includes(qToken)) {
                                matchCount++;
                                break;
                            }
                        }
                    }
                    if (matchCount === 0) continue;
                }

                placesWithVerification.push({
                    id: venue.id,
                    osmId: String(venue.id),
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
                    isVerified: true,
                    verificationMethod: claim.method,
                    verifierPubkey: claim.claimerPubkey,
                });

                if (placesWithVerification.length >= limit) break;
            }

            return NextResponse.json({
                places: placesWithVerification,
                total: placesWithVerification.length,
            });
        }

        // For all/unverified filter, use the original search logic
        let results: EnrichedVenue[] = [];

        if (query.length >= 2) {
            // Search by query
            const queryTokens = tokenizeAndNormalize(query);
            const scored: { venue: EnrichedVenue; score: number }[] = [];

            for (let i = 0; i < venues.length; i++) {
                const tokens = searchIndex[i];
                if (!tokens) continue;

                // Calculate match score
                let matchCount = 0;
                for (const qToken of queryTokens) {
                    for (const token of tokens) {
                        if (token.includes(qToken)) {
                            matchCount++;
                            break;
                        }
                    }
                }

                if (matchCount > 0) {
                    scored.push({
                        venue: venues[i],
                        score: matchCount / queryTokens.length,
                    });
                }
            }

            // Sort by score and take top results
            scored.sort((a, b) => b.score - a.score);
            results = scored.slice(0, limit * 3).map((s) => s.venue);
        } else {
            // No query - return recent venues
            results = venues.slice(0, limit * 3);
        }

        // Fetch verification status for all matching venues
        // Format osmIds correctly as "type/id" to match database format
        const osmIds = results.map((v) => `${v.type}/${v.id}`);

        // Get all verified claims for these venues
        const verifiedClaims = await prisma.claim.findMany({
            where: {
                venue: {
                    osmId: {
                        in: osmIds,
                    },
                },
                status: "VERIFIED",
                revokedAt: null,
            },
            include: {
                venue: true,
                claimer: true,
            },
        });

        // Create a map of numeric osmId -> claim (for easy lookup by venue.id)
        const claimMap = new Map<string, typeof verifiedClaims[number]>(
            verifiedClaims.map((claim) => [extractNumericOsmId(claim.venue.osmId), claim])
        );

        // Build results with verification info
        const placesWithVerification: PlaceSearchResult[] = results
            .filter((venue) => {
                const isVerified = claimMap.has(String(venue.id));
                if (filter === "unverified") return !isVerified;
                return true; // "all" shows everything
            })
            .slice(0, limit)
            .map((venue) => {
                const claim = claimMap.get(String(venue.id));
                return {
                    id: venue.id,
                    osmId: String(venue.id),
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
                    isVerified: !!claim,
                    verificationMethod: claim?.method,
                    verifierPubkey: claim?.claimerPubkey,
                };
            });

        return NextResponse.json({
            places: placesWithVerification,
            total: placesWithVerification.length,
        });
    } catch (error) {
        console.error("Failed to search places:", error);
        return NextResponse.json(
            { error: "Failed to search places" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/admin/nostr-bot/places/[osmId]
 * Get detailed place information including verification
 */
export async function POST(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (!authResult.success) return authResult.response;

    try {
        const { osmId } = await request.json();

        if (!osmId) {
            return NextResponse.json(
                { error: "OSM ID is required" },
                { status: 400 }
            );
        }

        const venues = await getVenueCache();
        const venue = venues.find((v) => String(v.id) === String(osmId));

        if (!venue) {
            return NextResponse.json(
                { error: "Place not found" },
                { status: 404 }
            );
        }

        // Get verification status - format osmId correctly as "type/id" to match database format
        const formattedOsmId = `${venue.type}/${venue.id}`;
        const claim = await getActiveVerifiedClaimByOsmId(formattedOsmId);

        const result: PlaceSearchResult = {
            id: venue.id,
            osmId: String(venue.id),
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
            isVerified: !!claim,
            verificationMethod: claim?.method,
            verifierPubkey: claim?.claimerPubkey,
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error("Failed to get place details:", error);
        return NextResponse.json(
            { error: "Failed to get place details" },
            { status: 500 }
        );
    }
}

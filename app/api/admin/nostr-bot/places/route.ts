import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { getVenueCache, getVenueSearchIndexMap } from "@/app/api/cache/VenueCache";
import { getActiveVerifiedClaimByOsmId } from "@/lib/db/services/claims";
import { tokenizeAndNormalize } from "@/utils/StringUtils";
import { EnrichedVenue } from "@/models/Overpass";
import prisma from "@/lib/db/prisma";

export interface PlaceSearchResult {
    id: number;
    osmId: string;
    name: string;
    city: string;
    state?: string;
    country: string;
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
            results = scored.slice(0, limit * 2).map((s) => s.venue);
        } else {
            // No query - return recent venues (by timestamp if available)
            results = venues.slice(0, limit * 2);
        }

        // Fetch verification status for all matching venues
        const osmIds = results.map((v) => String(v.id));

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

        // Create a map of osmId -> claim
        const claimMap = new Map(
            verifiedClaims.map((claim) => [claim.venue.osmId, claim])
        );

        // Build results with verification info
        const placesWithVerification: PlaceSearchResult[] = results
            .filter((venue) => {
                const isVerified = claimMap.has(String(venue.id));
                if (filter === "verified") return isVerified;
                if (filter === "unverified") return !isVerified;
                return true;
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
                    country: venue.country,
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

        // Get verification status
        const claim = await getActiveVerifiedClaimByOsmId(String(osmId));

        const result: PlaceSearchResult = {
            id: venue.id,
            osmId: String(venue.id),
            name: venue.tags?.name || "Unknown",
            city: venue.city,
            state: venue.state,
            country: venue.country,
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

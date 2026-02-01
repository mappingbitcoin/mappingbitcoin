import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getVenueCache } from "@/app/api/cache/VenueCache";
import { hexToNpub } from "@/lib/nostr/crypto";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(
            MAX_PAGE_SIZE,
            Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10))
        );
        const skip = (page - 1) * limit;

        // Get total count of verified claims
        const totalCount = await prisma.claim.count({
            where: {
                status: "VERIFIED",
                revokedAt: null,
            },
        });

        // Fetch verified claims with user data
        const claims = await prisma.claim.findMany({
            where: {
                status: "VERIFIED",
                revokedAt: null,
            },
            include: {
                claimer: {
                    select: {
                        pubkey: true,
                        displayName: true,
                        picture: true,
                    },
                },
                venue: {
                    select: {
                        osmId: true,
                    },
                },
            },
            orderBy: {
                verifiedAt: "desc",
            },
            skip,
            take: limit,
        });

        // Get venue details from cache
        const venueCache = getVenueCache();

        const verifiedPlaces = claims.map((claim) => {
            const osmId = claim.venue.osmId;
            const venue = venueCache?.[osmId];

            return {
                id: claim.id,
                osmId,
                verifiedAt: claim.verifiedAt?.toISOString() || null,
                method: claim.method,
                domainVerified: claim.domainToVerify || null,

                // Verifier info (the user who verified)
                verifier: {
                    pubkey: claim.claimer.pubkey,
                    npub: hexToNpub(claim.claimer.pubkey),
                    displayName: claim.claimer.displayName,
                    picture: claim.claimer.picture,
                },

                // Venue info from cache
                venue: venue ? {
                    name: venue.tags?.name || "Unknown Venue",
                    slug: venue.slug || osmId,
                    category: venue.category || null,
                    subcategory: venue.subcategory || null,
                    city: venue.city || null,
                    country: venue.country || null,
                    lat: venue.lat,
                    lon: venue.lon,
                } : {
                    name: "Unknown Venue",
                    slug: osmId,
                    category: null,
                    subcategory: null,
                    city: null,
                    country: null,
                    lat: null,
                    lon: null,
                },
            };
        });

        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json({
            success: true,
            data: verifiedPlaces,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    } catch (error) {
        console.error("[API] Error fetching verified places:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch verified places" },
            { status: 500 }
        );
    }
}

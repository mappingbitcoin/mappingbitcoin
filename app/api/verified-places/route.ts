import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getVenueCache, getVenueIndexMap } from "@/app/api/cache/VenueCache";
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
        const search = searchParams.get("search")?.toLowerCase().trim() || "";

        // Fetch all verified claims with user data
        const allClaims = await prisma.claim.findMany({
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
        });

        // Get venue details from cache
        const venueCache = await getVenueCache();
        const indexMap = await getVenueIndexMap();

        // Map and filter claims with venue data
        let verifiedPlaces = allClaims.map((claim) => {
            const osmId = claim.venue.osmId;

            // Parse osmId to get numeric ID (format: "node/123456" or just "123456")
            const parts = osmId.split("/");
            const numericId = parseInt(parts[1] || parts[0], 10);
            const venueIndex = indexMap[numericId];
            const venue = venueIndex !== undefined ? venueCache[venueIndex] : null;

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

        // Apply search filter if provided
        if (search) {
            verifiedPlaces = verifiedPlaces.filter((place) => {
                const name = place.venue.name?.toLowerCase() || "";
                const city = place.venue.city?.toLowerCase() || "";
                const country = place.venue.country?.toLowerCase() || "";
                const category = place.venue.category?.toLowerCase() || "";

                return (
                    name.includes(search) ||
                    city.includes(search) ||
                    country.includes(search) ||
                    category.includes(search)
                );
            });
        }

        // Calculate pagination
        const totalCount = verifiedPlaces.length;
        const totalPages = Math.ceil(totalCount / limit);
        const skip = (page - 1) * limit;
        const paginatedPlaces = verifiedPlaces.slice(skip, skip + limit);

        return NextResponse.json({
            success: true,
            data: paginatedPlaces,
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

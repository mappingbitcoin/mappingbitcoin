import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import prisma from "@/lib/db/prisma";
import { getBotPubkey, fetchEventsFromRelays, type NostrPost } from "@/lib/nostr/actions";
import { extractNumericId } from "@/lib/nostr/bot";
import { getVenueCache, getVenueIndexMap } from "@/app/api/cache/VenueCache";
import { getSlugForOsmId } from "@/utils/sync/slugs/SlugRegistry";

// ============================================================================
// Detection Helpers
// ============================================================================

function isVerificationPost(post: NostrPost): boolean {
    return post.tags.some(
        (t) =>
            (t[0] === "t" && t[1] === "verified") ||
            (t[0] === "post-type" && t[1] === "verified") ||
            t[0] === "method"
    );
}

function getUrlFromPost(post: NostrPost): string | null {
    const rTag = post.tags.find((t) => t[0] === "r");
    if (rTag?.[1]) return rTag[1];
    const urlMatch = post.content.match(/https?:\/\/[^\s]+\/places\/[^\s]+/);
    return urlMatch?.[0] || null;
}

function hasBadUrl(url: string): boolean {
    return /\/places\/(node|way|relation)\//.test(url);
}

// ============================================================================
// GET /api/admin/nostr-bot/fix-verifications/preview
// ============================================================================

/**
 * Scan relay events and identify verification posts with malformed URLs.
 * Returns preview data showing what would be fixed.
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) return authResult.response;

        const botPubkey = getBotPubkey();
        if (!botPubkey) {
            return NextResponse.json(
                { error: "Bot private key not configured" },
                { status: 500 }
            );
        }

        // Fetch bot's kind 1 posts from relays
        const allPosts = await fetchEventsFromRelays(
            { kinds: [1], authors: [botPubkey], limit: 500 },
            undefined,
            4
        );

        // Filter to verification posts
        const verificationPosts = allPosts.filter(isVerificationPost);

        // Load verified claims with nostrEventId
        const claims = await prisma.claim.findMany({
            where: {
                status: "VERIFIED",
                nostrEventId: { not: null },
            },
            select: {
                id: true,
                venueId: true,
                claimerPubkey: true,
                method: true,
                nostrEventId: true,
                verifiedAt: true,
            },
        });

        const claimByEventId = new Map(claims.map((c) => [c.nostrEventId!, c]));

        // Match posts to claims
        const matched: Array<{ post: NostrPost; claim: (typeof claims)[number] }> = [];
        let unmatchedCount = 0;

        for (const post of verificationPosts) {
            const claim = claimByEventId.get(post.id);
            if (claim) {
                matched.push({ post, claim });
            } else {
                unmatchedCount++;
            }
        }

        // Filter to bad URLs
        const badUrlEvents = matched.filter(({ post }) => {
            const url = getUrlFromPost(post);
            return url ? hasBadUrl(url) : false;
        });

        // Load venue data for preview
        const venues = await getVenueCache();
        const venueIndexMap = await getVenueIndexMap();

        const previewLimit = 100;
        const previewEvents = [];

        for (let i = 0; i < Math.min(badUrlEvents.length, previewLimit); i++) {
            const { post, claim } = badUrlEvents[i];
            const osmId = claim.venueId;
            const numericId = parseInt(extractNumericId(osmId), 10);
            const venueIdx = venueIndexMap[numericId];
            const venue = venueIdx !== undefined ? venues[venueIdx] : null;

            const venueName = venue?.tags?.name || "Unknown venue";
            const slug = venue?.slug || (await getSlugForOsmId(osmId).catch(() => undefined));
            const oldUrl = getUrlFromPost(post);
            const newSlug = slug || extractNumericId(osmId);
            const newUrl = `https://mappingbitcoin.com/places/${newSlug}`;

            const methodTag = post.tags.find((t) => t[0] === "method");

            previewEvents.push({
                eventId: post.id,
                venueName,
                osmId,
                oldUrl: oldUrl || "(not found)",
                newUrl,
                method: claim.method || methodTag?.[1] || "UNKNOWN",
                createdAt: post.created_at,
                claimId: claim.id,
            });
        }

        return NextResponse.json({
            totalBotPosts: allPosts.length,
            verificationPosts: verificationPosts.length,
            matchedToClaims: matched.length,
            unmatchedCount,
            badUrlCount: badUrlEvents.length,
            events: previewEvents,
            hasMore: badUrlEvents.length > previewLimit,
            actions: badUrlEvents.length > 0 ? [
                `Delete ${badUrlEvents.length} old verification event${badUrlEvents.length !== 1 ? "s" : ""} from relays (NIP-09)`,
                "Republish with corrected URLs using current venue slugs",
                "Update database claim records with new event IDs",
            ] : [],
        });
    } catch (error) {
        console.error("[FixVerifications] Preview error:", error);
        return NextResponse.json(
            { error: "Failed to scan verification events" },
            { status: 500 }
        );
    }
}

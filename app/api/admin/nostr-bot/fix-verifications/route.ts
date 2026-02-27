import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import prisma from "@/lib/db/prisma";
import { getBotPubkey, fetchEventsFromRelays, deleteNostrEvent, type NostrPost } from "@/lib/nostr/actions";
import { announceVerification, extractNumericId, type VenueInfo, type VerificationInfo } from "@/lib/nostr/bot";
import { getVenueCache, getVenueIndexMap } from "@/app/api/cache/VenueCache";
import { getSlugForOsmId } from "@/utils/sync/slugs/SlugRegistry";

// ============================================================================
// Detection Helpers (same as preview)
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

function getMethodFromPost(post: NostrPost): { method: string; detail: string } | null {
    const methodTag = post.tags.find((t) => t[0] === "method");
    if (methodTag) return { method: methodTag[1], detail: methodTag[2] || "" };
    return null;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ============================================================================
// POST /api/admin/nostr-bot/fix-verifications
// ============================================================================

/**
 * Delete verification events with malformed URLs and republish with corrected URLs.
 */
export async function POST(request: NextRequest) {
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

        for (const post of verificationPosts) {
            const claim = claimByEventId.get(post.id);
            if (claim) {
                matched.push({ post, claim });
            }
        }

        // Filter to bad URLs
        const badUrlEvents = matched.filter(({ post }) => {
            const url = getUrlFromPost(post);
            return url ? hasBadUrl(url) : false;
        });

        if (badUrlEvents.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No verification events with malformed URLs found.",
                deleted: 0,
                republished: 0,
                errors: 0,
                details: [],
            });
        }

        // Load venue data
        const venues = await getVenueCache();
        const venueIndexMap = await getVenueIndexMap();

        // Process each bad event
        const details: Array<{
            venueName: string;
            osmId: string;
            oldUrl: string;
            newUrl: string;
            newEventId?: string;
            error?: string;
        }> = [];
        let deleted = 0;
        let republished = 0;
        let errors = 0;

        for (let i = 0; i < badUrlEvents.length; i++) {
            const { post, claim } = badUrlEvents[i];
            const osmId = claim.venueId;
            const numericId = parseInt(extractNumericId(osmId), 10);
            const venueIdx = venueIndexMap[numericId];
            const venue = venueIdx !== undefined ? venues[venueIdx] : null;

            const venueName = venue?.tags?.name || "Unknown venue";
            const slug = venue?.slug || (await getSlugForOsmId(osmId).catch(() => undefined));
            const oldUrl = getUrlFromPost(post) || "(not found)";
            const newSlug = slug || extractNumericId(osmId);
            const newUrl = `https://mappingbitcoin.com/places/${newSlug}`;

            const detail: (typeof details)[number] = {
                venueName,
                osmId,
                oldUrl,
                newUrl,
            };

            // Delete old event
            try {
                const deleteResult = await deleteNostrEvent(post.id, "Reposting with corrected URL");
                if (deleteResult.success) {
                    deleted++;
                } else {
                    console.warn(`[FixVerifications] Delete may have failed for ${post.id}: ${deleteResult.error}`);
                }
            } catch (err) {
                detail.error = `Delete failed: ${err}`;
                errors++;
                details.push(detail);
                continue;
            }

            await delay(1000);

            // Republish with corrected URL
            try {
                const venueInfo: VenueInfo = {
                    osmId,
                    name: venueName,
                    slug: slug || undefined,
                    city: venue?.city,
                    country: venue?.country,
                    category: venue?.category,
                };

                const methodFromPost = getMethodFromPost(post);
                const verificationInfo: VerificationInfo = {
                    method: (claim.method as VerificationInfo["method"]) || methodFromPost?.method || "MANUAL",
                    detail: methodFromPost?.detail,
                    ownerPubkey: claim.claimerPubkey,
                };

                const result = await announceVerification(venueInfo, verificationInfo);

                if (result.success && result.eventId) {
                    detail.newEventId = result.eventId;
                    republished++;

                    // Update DB claim with new event ID
                    await prisma.claim.update({
                        where: { id: claim.id },
                        data: { nostrEventId: result.eventId },
                    });
                } else {
                    detail.error = `Republish failed: ${result.error}`;
                    errors++;
                }
            } catch (err) {
                detail.error = `Republish error: ${err}`;
                errors++;
            }

            details.push(detail);

            // Small delay between items
            if (i < badUrlEvents.length - 1) {
                await delay(500);
            }
        }

        return NextResponse.json({
            success: errors === 0,
            message: errors === 0
                ? `Successfully fixed ${republished} verification event${republished !== 1 ? "s" : ""}.`
                : `Fixed ${republished} event${republished !== 1 ? "s" : ""} with ${errors} error${errors !== 1 ? "s" : ""}.`,
            deleted,
            republished,
            errors,
            details,
        });
    } catch (error) {
        console.error("[FixVerifications] Execute error:", error);
        return NextResponse.json(
            { error: "Failed to fix verification events" },
            { status: 500 }
        );
    }
}

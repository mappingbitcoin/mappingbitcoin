#!/usr/bin/env tsx
/**
 * Repost Verification Announcements
 *
 * Fetches the bot's verification posts from relays, deletes them via NIP-09,
 * and re-publishes with corrected URLs (using slugs or numeric IDs).
 *
 * Usage:
 *   npx tsx scripts/repostVerifications.ts                    # Process all
 *   npx tsx scripts/repostVerifications.ts --dry-run          # Preview only
 *   npx tsx scripts/repostVerifications.ts --limit 5          # First 5 only
 *   npx tsx scripts/repostVerifications.ts --dry-run --limit 3
 */

import "dotenv/config";

import prisma from "../lib/db/prisma";
import { getPublicKey } from "../lib/nostr/crypto";
import { fetchEventsFromRelays, deleteNostrEvent, type NostrPost } from "../lib/nostr/actions";
import { announceVerification, extractNumericId, type VenueInfo, type VerificationInfo } from "../lib/nostr/bot";
import { getVenueCache, getVenueIndexMap } from "../app/api/cache/VenueCache";
import { getSlugForOsmId } from "../utils/sync/slugs/SlugRegistry";

// ============================================================================
// CLI Argument Parsing
// ============================================================================

interface CliOptions {
    dryRun: boolean;
    limit: number;
}

function parseArgs(): CliOptions {
    const args = process.argv.slice(2);
    const dryRun = args.includes("--dry-run");

    let limit = Infinity;
    const limitIdx = args.indexOf("--limit");
    if (limitIdx !== -1 && args[limitIdx + 1]) {
        limit = parseInt(args[limitIdx + 1], 10);
        if (isNaN(limit) || limit <= 0) {
            console.error("--limit must be a positive integer");
            process.exit(1);
        }
    }

    return { dryRun, limit };
}

// ============================================================================
// Helpers
// ============================================================================

function isVerificationPost(post: NostrPost): boolean {
    return post.tags.some(
        (t) =>
            (t[0] === "t" && t[1] === "verified") ||
            (t[0] === "post-type" && t[1] === "verified") ||
            t[0] === "method"
    );
}

function getOsmIdFromPost(post: NostrPost): string | null {
    // Check for ["i", "osm:node/12345"] tag
    const iTag = post.tags.find((t) => t[0] === "i" && t[1]?.startsWith("osm:"));
    if (iTag) return iTag[1].replace("osm:", "");

    // Check for ["osm", "node/12345"] tag
    const osmTag = post.tags.find((t) => t[0] === "osm");
    if (osmTag) return osmTag[1];

    // Check for ["venue", "Name", "node/12345"] tag
    const venueTag = post.tags.find((t) => t[0] === "venue" && t[2]);
    if (venueTag) return venueTag[2];

    return null;
}

function getMethodFromPost(post: NostrPost): { method: string; detail: string } | null {
    const methodTag = post.tags.find((t) => t[0] === "method");
    if (methodTag) return { method: methodTag[1], detail: methodTag[2] || "" };
    return null;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
    const options = parseArgs();

    console.log("[Repost] Repost Verification Announcements");
    console.log(`[Repost] Mode: ${options.dryRun ? "DRY RUN" : "LIVE"}`);
    if (options.limit < Infinity) console.log(`[Repost] Limit: ${options.limit}`);
    console.log();

    // 1. Get bot pubkey
    const privateKey = process.env.MAPPING_BITCOIN_BOT_PRIVATE_KEY;
    if (!privateKey) {
        console.error("[Repost] MAPPING_BITCOIN_BOT_PRIVATE_KEY not set");
        process.exit(1);
    }
    const botPubkey = getPublicKey(privateKey);
    console.log(`[Repost] Bot pubkey: ${botPubkey}`);

    // 2. Fetch all bot's kind 1 posts from relays
    console.log("[Repost] Fetching bot posts from relays...");
    const allPosts = await fetchEventsFromRelays(
        { kinds: [1], authors: [botPubkey], limit: 500 },
        undefined,
        4 // use all relays for completeness
    );
    console.log(`[Repost] Found ${allPosts.length} total bot posts`);

    // 3. Filter to verification posts only
    const verificationPosts = allPosts.filter(isVerificationPost);
    console.log(`[Repost] Found ${verificationPosts.length} verification posts`);

    // 4. Load verified claims from DB that have nostrEventId
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
    console.log(`[Repost] Found ${claims.length} verified claims with nostrEventId in DB`);

    // Build lookup: nostrEventId → claim
    const claimByEventId = new Map(claims.map((c) => [c.nostrEventId!, c]));

    // 5. Match posts to claims
    const matched: Array<{ post: NostrPost; claim: (typeof claims)[number] }> = [];
    const unmatchedPosts: NostrPost[] = [];

    for (const post of verificationPosts) {
        const claim = claimByEventId.get(post.id);
        if (claim) {
            matched.push({ post, claim });
        } else {
            unmatchedPosts.push(post);
        }
    }

    console.log(`[Repost] Matched ${matched.length} posts to DB claims`);
    if (unmatchedPosts.length > 0) {
        console.log(`[Repost] ${unmatchedPosts.length} verification posts not matched to any claim (will skip)`);
    }
    console.log();

    // 6. Load venue data
    const venues = await getVenueCache();
    const venueIndexMap = await getVenueIndexMap();

    // Apply limit
    const toProcess = matched.slice(0, options.limit);

    // 7. Process each matched claim
    let deleted = 0;
    let republished = 0;
    let errors = 0;

    for (let i = 0; i < toProcess.length; i++) {
        const { post, claim } = toProcess[i];
        const osmId = claim.venueId; // e.g., "node/12345"
        const numericId = parseInt(extractNumericId(osmId), 10);
        const venueIdx = venueIndexMap[numericId];
        const venue = venueIdx !== undefined ? venues[venueIdx] : null;

        const venueName = venue?.tags?.name || "Unknown venue";
        const slug = venue?.slug || (await getSlugForOsmId(osmId).catch(() => undefined));

        console.log(`[Repost] [${i + 1}/${toProcess.length}] ${venueName} (${osmId})`);
        console.log(`  Old event: ${post.id}`);
        console.log(`  Slug: ${slug || "(none, will use numeric ID)"}`);

        if (options.dryRun) {
            console.log("  -> DRY RUN: Would delete + republish");
            console.log();
            continue;
        }

        // 7a. Delete old event
        try {
            const deleteResult = await deleteNostrEvent(post.id, "Reposting with corrected URL");
            if (deleteResult.success) {
                console.log(`  Deleted old event (${deleteResult.successCount} relays)`);
                deleted++;
            } else {
                console.log(`  WARNING: Delete may have failed: ${deleteResult.error}`);
            }
        } catch (err) {
            console.error(`  ERROR deleting: ${err}`);
            errors++;
            continue;
        }

        // Small delay between delete and republish
        await new Promise((r) => setTimeout(r, 1000));

        // 7b. Re-publish with current venue data
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
                console.log(`  Republished: ${result.eventId}`);
                republished++;

                // 7c. Update DB
                await prisma.claim.update({
                    where: { id: claim.id },
                    data: { nostrEventId: result.eventId },
                });
                console.log(`  DB updated`);
            } else {
                console.log(`  WARNING: Republish failed: ${result.error}`);
                errors++;
            }
        } catch (err) {
            console.error(`  ERROR republishing: ${err}`);
            errors++;
        }

        console.log();

        // Small delay between items
        if (i < toProcess.length - 1) {
            await new Promise((r) => setTimeout(r, 500));
        }
    }

    // 8. Summary
    console.log("=".repeat(50));
    console.log("[Repost] Summary:");
    console.log(`  Total verification posts found: ${verificationPosts.length}`);
    console.log(`  Matched to DB claims: ${matched.length}`);
    console.log(`  Processed: ${toProcess.length}`);
    if (!options.dryRun) {
        console.log(`  Deleted: ${deleted}`);
        console.log(`  Republished: ${republished}`);
        console.log(`  Errors: ${errors}`);
    }
}

main()
    .catch((err) => {
        console.error("[Repost] Fatal error:", err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());

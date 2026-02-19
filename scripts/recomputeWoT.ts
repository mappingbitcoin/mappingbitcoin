#!/usr/bin/env tsx
/**
 * WoT Recomputation Script
 *
 * Recomputes Web of Trust distances for all reviews or specific authors.
 * Useful for backfilling WoT data after initial setup or when the bot
 * changes its follow graph.
 *
 * Usage:
 *   npm run recompute:wot              # All reviews without WoT
 *   npm run recompute:wot -- --all     # All reviews (force recompute)
 *   npm run recompute:wot -- --stale   # Reviews older than 24h
 */

import "dotenv/config";

import prisma from "../lib/db/prisma";
import { getWoTDistance, getWoTDistanceBatch } from "../lib/wot/oracleClient";

// Configuration
const BATCH_SIZE = 50;
const STALE_HOURS = 24;

interface RecomputeOptions {
    all: boolean;
    stale: boolean;
}

function parseArgs(): RecomputeOptions {
    const args = process.argv.slice(2);
    return {
        all: args.includes("--all"),
        stale: args.includes("--stale"),
    };
}

async function getReviewsToProcess(options: RecomputeOptions) {
    const where: Parameters<typeof prisma.review.findMany>[0]["where"] = {};

    if (options.all) {
        // All reviews
    } else if (options.stale) {
        // Reviews with WoT computed more than STALE_HOURS ago
        const staleDate = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000);
        where.OR = [
            { wotComputedAt: null },
            { wotComputedAt: { lt: staleDate } },
        ];
    } else {
        // Only reviews without WoT data
        where.wotDistance = null;
    }

    return prisma.review.findMany({
        where,
        select: {
            id: true,
            eventId: true,
            authorPubkey: true,
            wotDistance: true,
            wotComputedAt: true,
        },
        orderBy: { eventCreatedAt: "desc" },
    });
}

async function recomputeWoT(options: RecomputeOptions) {
    console.log("[WoT Recompute] Starting...");
    console.log(`[WoT Recompute] Options: all=${options.all}, stale=${options.stale}`);

    const reviews = await getReviewsToProcess(options);
    console.log(`[WoT Recompute] Found ${reviews.length} reviews to process`);

    if (reviews.length === 0) {
        console.log("[WoT Recompute] No reviews to process. Done.");
        return;
    }

    let processed = 0;
    let updated = 0;
    let errors = 0;

    // Process in batches
    for (let i = 0; i < reviews.length; i += BATCH_SIZE) {
        const batch = reviews.slice(i, i + BATCH_SIZE);
        const pubkeys = [...new Set(batch.map((r) => r.authorPubkey))];

        console.log(`[WoT Recompute] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(reviews.length / BATCH_SIZE)} (${pubkeys.length} unique pubkeys)`);

        try {
            // Batch query WoT distances
            const distances = await getWoTDistanceBatch(pubkeys);

            // Update reviews
            for (const review of batch) {
                const wotResult = distances.get(review.authorPubkey);

                if (wotResult && (wotResult.hops !== null || wotResult.pathCount > 0)) {
                    await prisma.review.update({
                        where: { id: review.id },
                        data: {
                            wotDistance: wotResult.hops,
                            wotPathCount: wotResult.pathCount,
                            wotComputedAt: new Date(),
                        },
                    });
                    updated++;

                    // Also update the user's cached WoT distance
                    await prisma.user.update({
                        where: { pubkey: review.authorPubkey },
                        data: {
                            wotDistance: wotResult.hops,
                            wotComputedAt: new Date(),
                        },
                    });
                }

                processed++;
            }

            console.log(`[WoT Recompute] Batch complete. Processed: ${processed}/${reviews.length}, Updated: ${updated}`);
        } catch (error) {
            console.error(`[WoT Recompute] Batch error:`, error);
            errors++;
        }

        // Small delay between batches to avoid overwhelming the oracle
        if (i + BATCH_SIZE < reviews.length) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }

    console.log(`[WoT Recompute] Complete!`);
    console.log(`[WoT Recompute] Processed: ${processed}, Updated: ${updated}, Errors: ${errors}`);
}

// Main entry point
async function main() {
    try {
        const options = parseArgs();
        await recomputeWoT(options);
    } catch (error) {
        console.error("[WoT Recompute] Fatal error:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();

#!/usr/bin/env tsx
/**
 * Review Listener Script
 *
 * Standalone Node.js script that subscribes to Nostr relays and indexes
 * review events (kind 38381) and review replies (kind 38382).
 *
 * Usage: npm run listen:reviews
 * or:    tsx scripts/reviewListener.ts
 */

// Load environment variables from .env file
import "dotenv/config";

import WebSocket from "ws";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { NOSTR_KINDS } from "../lib/nostr/constants";
import { NOSTR_RELAYS } from "../lib/nostr/config";
import { parseReviewEvent, parseReplyEvent, type NostrEvent } from "../lib/nostr/reviewEvents";
import { indexReview, indexReviewReply, type IndexReviewInput } from "../lib/db/services/reviews";
import storage, { AssetType } from "../lib/storage";

// Configuration
const RECONNECT_DELAY_MS = 5000;
const SUBSCRIPTION_ID = "review-listener";
const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_QUALITY = 80;

// Track processed events to avoid duplicates
const processedEvents = new Set<string>();
const MAX_PROCESSED_CACHE = 10000;

/**
 * Process review image: fetch from Blossom, create thumbnail, upload to Hetzner
 */
async function processReviewImage(
    imageUrl: string,
    eventId: string
): Promise<{ thumbnailUrl: string; thumbnailKey: string } | null> {
    try {
        console.log(`[Listener] Fetching image from ${imageUrl}`);

        const response = await fetch(imageUrl, {
            headers: { "User-Agent": "MappingBitcoin/1.0" },
        });

        if (!response.ok) {
            console.warn(`[Listener] Failed to fetch image: ${response.status}`);
            return null;
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.startsWith("image/")) {
            console.warn(`[Listener] URL does not point to an image: ${contentType}`);
            return null;
        }

        const imageBuffer = Buffer.from(await response.arrayBuffer());

        // Create thumbnail
        console.log(`[Listener] Creating thumbnail (${THUMBNAIL_WIDTH}px width)`);
        const thumbnailBuffer = await sharp(imageBuffer)
            .resize(THUMBNAIL_WIDTH, null, {
                fit: "inside",
                withoutEnlargement: true,
            })
            .webp({ quality: THUMBNAIL_QUALITY })
            .toBuffer();

        // Generate unique filename
        const filename = `${eventId.slice(0, 16)}-${randomUUID().slice(0, 8)}.webp`;

        // Upload to storage
        console.log(`[Listener] Uploading thumbnail: ${filename}`);
        const thumbnailKey = await storage.uploadData(
            AssetType.REVIEWS,
            filename,
            thumbnailBuffer,
            {
                contentType: "image/webp",
                cacheControl: "public, max-age=31536000",
            }
        );

        if (!thumbnailKey) {
            console.warn(`[Listener] Failed to upload thumbnail`);
            return null;
        }

        // Get public URL
        let thumbnailUrl: string;
        try {
            thumbnailUrl = await storage.getSignedDownloadUrl(
                AssetType.REVIEWS,
                filename,
                { expiresIn: 31536000 }
            );
        } catch {
            // Fallback: construct public URL
            const endpoint = process.env.HETZNER_STORAGE_ENDPOINT || "";
            const bucket = process.env.HETZNER_STORAGE_BUCKET || "";
            thumbnailUrl = `${endpoint}/${bucket}/${thumbnailKey}`;
        }

        console.log(`[Listener] Thumbnail created: ${thumbnailUrl}`);
        return { thumbnailUrl, thumbnailKey };
    } catch (err) {
        console.error(`[Listener] Error processing image:`, err);
        return null;
    }
}

// Active WebSocket connections
const connections = new Map<string, WebSocket>();

/**
 * Create subscription filter for review events
 */
function createFilter() {
    return {
        kinds: [NOSTR_KINDS.VENUE_REVIEW, NOSTR_KINDS.REVIEW_REPLY],
        // Get events from the last 24 hours on startup, then continue live
        since: Math.floor(Date.now() / 1000) - 86400,
    };
}

/**
 * Process incoming Nostr event
 */
async function processEvent(event: NostrEvent) {
    // Skip if already processed
    if (processedEvents.has(event.id)) {
        return;
    }

    // Add to processed cache
    processedEvents.add(event.id);

    // Clean up cache if too large
    if (processedEvents.size > MAX_PROCESSED_CACHE) {
        const entries = Array.from(processedEvents);
        entries.slice(0, MAX_PROCESSED_CACHE / 2).forEach(id => processedEvents.delete(id));
    }

    try {
        if (event.kind === NOSTR_KINDS.VENUE_REVIEW) {
            const review = parseReviewEvent(event);
            if (review) {
                console.log(`[Listener] Indexing review ${event.id.slice(0, 8)}... for ${review.osmId}`);

                // Process all images if present
                let reviewWithImages: IndexReviewInput = review;
                if (review.imageUrls && review.imageUrls.length > 0) {
                    console.log(`[Listener] Processing ${review.imageUrls.length} images...`);

                    const thumbnailUrls: string[] = [];
                    const thumbnailKeys: string[] = [];

                    // Process images sequentially to avoid overwhelming the system
                    for (const imageUrl of review.imageUrls) {
                        const imageResult = await processReviewImage(imageUrl, review.eventId);
                        if (imageResult) {
                            thumbnailUrls.push(imageResult.thumbnailUrl);
                            thumbnailKeys.push(imageResult.thumbnailKey);
                        }
                    }

                    if (thumbnailUrls.length > 0) {
                        reviewWithImages = {
                            ...review,
                            thumbnailUrls,
                            thumbnailKeys,
                        };
                        console.log(`[Listener] Created ${thumbnailUrls.length} thumbnails`);
                    }
                }

                const result = await indexReview(reviewWithImages);
                if (result.wasBlocked) {
                    console.log(`[Listener] Review ${event.id.slice(0, 8)}... was blocked (spam)`);
                } else if (result.spamCheck?.action === "flag") {
                    console.log(`[Listener] Review ${event.id.slice(0, 8)}... was flagged for moderation`);
                }
            }
        } else if (event.kind === NOSTR_KINDS.REVIEW_REPLY) {
            const reply = parseReplyEvent(event);
            if (reply) {
                console.log(`[Listener] Indexing reply ${event.id.slice(0, 8)}... to review ${reply.reviewEventId.slice(0, 8)}...`);
                try {
                    await indexReviewReply(reply);
                } catch (err) {
                    if (err instanceof Error && err.message.includes("Parent review not found")) {
                        console.log(`[Listener] Parent review not found for reply ${event.id.slice(0, 8)}...`);
                    } else {
                        throw err;
                    }
                }
            }
        }
    } catch (err) {
        console.error(`[Listener] Error processing event ${event.id.slice(0, 8)}...:`, err);
    }
}

/**
 * Connect to a relay and subscribe to review events
 */
function connectToRelay(relayUrl: string) {
    // Clean up existing connection if any
    const existing = connections.get(relayUrl);
    if (existing) {
        try {
            existing.close();
        } catch {
            // Ignore close errors
        }
        connections.delete(relayUrl);
    }

    console.log(`[Listener] Connecting to ${relayUrl}...`);

    const ws = new WebSocket(relayUrl);
    connections.set(relayUrl, ws);

    ws.on("open", () => {
        console.log(`[Listener] Connected to ${relayUrl}`);

        // Send subscription request
        const filter = createFilter();
        const subscriptionMessage = JSON.stringify(["REQ", SUBSCRIPTION_ID, filter]);
        ws.send(subscriptionMessage);
        console.log(`[Listener] Subscribed to ${relayUrl} for kinds ${filter.kinds.join(", ")}`);
    });

    ws.on("message", async (data) => {
        try {
            const message = JSON.parse(data.toString());

            if (message[0] === "EVENT" && message[1] === SUBSCRIPTION_ID) {
                const event = message[2] as NostrEvent;
                await processEvent(event);
            } else if (message[0] === "EOSE") {
                console.log(`[Listener] End of stored events from ${relayUrl}`);
            } else if (message[0] === "NOTICE") {
                console.log(`[Listener] Notice from ${relayUrl}: ${message[1]}`);
            }
        } catch (err) {
            // Ignore parse errors for non-JSON messages
        }
    });

    ws.on("error", (error) => {
        console.error(`[Listener] WebSocket error for ${relayUrl}:`, error.message);
    });

    ws.on("close", () => {
        console.log(`[Listener] Disconnected from ${relayUrl}, reconnecting in ${RECONNECT_DELAY_MS}ms...`);
        connections.delete(relayUrl);

        // Schedule reconnection
        setTimeout(() => {
            connectToRelay(relayUrl);
        }, RECONNECT_DELAY_MS);
    });
}

/**
 * Graceful shutdown handler
 */
function shutdown() {
    console.log("\n[Listener] Shutting down...");

    for (const [relayUrl, ws] of connections) {
        console.log(`[Listener] Closing connection to ${relayUrl}`);
        try {
            ws.close();
        } catch {
            // Ignore close errors
        }
    }

    process.exit(0);
}

/**
 * Main entry point
 */
async function main() {
    console.log("[Listener] Starting review listener...");
    console.log(`[Listener] Monitoring kinds: ${NOSTR_KINDS.VENUE_REVIEW} (reviews), ${NOSTR_KINDS.REVIEW_REPLY} (replies)`);
    console.log(`[Listener] Connecting to ${NOSTR_RELAYS.length} relays...`);

    // Register shutdown handlers
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    // Connect to all relays
    for (const relayUrl of NOSTR_RELAYS) {
        connectToRelay(relayUrl);
    }

    console.log("[Listener] Listener started. Press Ctrl+C to stop.");
}

// Run the listener
main().catch((err) => {
    console.error("[Listener] Fatal error:", err);
    process.exit(1);
});

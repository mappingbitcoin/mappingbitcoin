import prisma from "../db/prisma";
import * as WebSocketModule from "ws";
const WebSocket = WebSocketModule.default || WebSocketModule;

// Primary relay for fetching follow lists (our own relay with no limits)
const DEFAULT_RELAYS = [
    "wss://relay.mappingbitcoin.com",
];

// Cache duration: 6 hours
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000;

// Timeout for relay queries
const RELAY_TIMEOUT_MS = 10000;

interface NostrEvent {
    id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
    sig: string;
}

/**
 * Fetch follows for a pubkey from cache or Nostr relays
 */
export async function getFollows(pubkey: string): Promise<string[]> {
    // Check cache first
    const cachedFollows = await getCachedFollows(pubkey);
    if (cachedFollows !== null) {
        return cachedFollows;
    }

    // Fetch from relays
    const follows = await fetchFollowsFromRelays(pubkey);

    // Cache the results
    await cacheFollows(pubkey, follows);

    return follows;
}

/**
 * Batch fetch follows for multiple pubkeys
 */
export async function getFollowsBatch(pubkeys: string[]): Promise<Map<string, string[]>> {
    const results = new Map<string, string[]>();

    // Check cache for all pubkeys
    const cachedResults = await getCachedFollowsBatch(pubkeys);
    const uncachedPubkeys: string[] = [];

    for (const pubkey of pubkeys) {
        const cached = cachedResults.get(pubkey);
        if (cached !== undefined) {
            results.set(pubkey, cached);
        } else {
            uncachedPubkeys.push(pubkey);
        }
    }

    // Fetch uncached pubkeys from relays in parallel batches
    if (uncachedPubkeys.length > 0) {
        const batchSize = 10;
        for (let i = 0; i < uncachedPubkeys.length; i += batchSize) {
            const batch = uncachedPubkeys.slice(i, i + batchSize);
            const batchResults = await Promise.all(
                batch.map(async (pubkey) => {
                    const follows = await fetchFollowsFromRelays(pubkey);
                    await cacheFollows(pubkey, follows);
                    return { pubkey, follows };
                })
            );

            for (const { pubkey, follows } of batchResults) {
                results.set(pubkey, follows);
            }
        }
    }

    return results;
}

/**
 * Get cached follows for a pubkey
 * Returns null if not cached or cache is expired
 */
async function getCachedFollows(pubkey: string): Promise<string[] | null> {
    const cutoff = new Date(Date.now() - CACHE_DURATION_MS);

    const cached = await prisma.followsCache.findMany({
        where: {
            pubkey,
            fetchedAt: { gte: cutoff },
        },
        select: { followsPubkey: true },
    });

    if (cached.length === 0) {
        // Check if there's any cache entry - if not, return null
        // If there are entries but all expired, we still need to refetch
        const anyEntry = await prisma.followsCache.findFirst({
            where: { pubkey },
        });

        if (!anyEntry) {
            return null; // Never fetched
        }

        // Expired cache - return null to trigger refetch
        return null;
    }

    return cached.map((c) => c.followsPubkey);
}

/**
 * Get cached follows for multiple pubkeys
 */
async function getCachedFollowsBatch(pubkeys: string[]): Promise<Map<string, string[]>> {
    const cutoff = new Date(Date.now() - CACHE_DURATION_MS);
    const results = new Map<string, string[]>();

    const cached = await prisma.followsCache.findMany({
        where: {
            pubkey: { in: pubkeys },
            fetchedAt: { gte: cutoff },
        },
        select: { pubkey: true, followsPubkey: true },
    });

    // Group by pubkey
    for (const entry of cached) {
        const existing = results.get(entry.pubkey) || [];
        existing.push(entry.followsPubkey);
        results.set(entry.pubkey, existing);
    }

    return results;
}

/**
 * Cache follows for a pubkey
 */
async function cacheFollows(pubkey: string, follows: string[]): Promise<void> {
    const now = new Date();

    // Delete old cache entries for this pubkey
    await prisma.followsCache.deleteMany({
        where: { pubkey },
    });

    // Insert new cache entries
    if (follows.length > 0) {
        await prisma.followsCache.createMany({
            data: follows.map((followsPubkey) => ({
                pubkey,
                followsPubkey,
                fetchedAt: now,
            })),
            skipDuplicates: true,
        });
    }
}

/**
 * Fetch follows from Nostr relays
 * Returns list of pubkeys that this pubkey follows
 */
async function fetchFollowsFromRelays(pubkey: string): Promise<string[]> {
    const follows = new Set<string>();
    const promises: Promise<void>[] = [];

    for (const relayUrl of DEFAULT_RELAYS) {
        promises.push(
            fetchFromRelay(relayUrl, pubkey)
                .then((result) => {
                    for (const f of result) {
                        follows.add(f);
                    }
                })
                .catch((err) => {
                    console.warn(`Failed to fetch from ${relayUrl}:`, err.message);
                })
        );
    }

    await Promise.all(promises);

    return Array.from(follows);
}

/**
 * Fetch kind 3 (follow list) event from a single relay
 */
function fetchFromRelay(relayUrl: string, pubkey: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        let ws: WebSocket | null = null;
        let timeoutId: ReturnType<typeof setTimeout>;
        let latestEvent: NostrEvent | null = null;

        const cleanup = () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (ws) {
                try {
                    ws.close();
                } catch {
                    // Ignore close errors
                }
            }
        };

        try {
            ws = new WebSocket(relayUrl);

            timeoutId = setTimeout(() => {
                cleanup();
                // Return whatever we have (or empty)
                resolve(extractFollowsFromEvent(latestEvent));
            }, RELAY_TIMEOUT_MS);

            ws.on("open", () => {
                const subId = `follows-${pubkey.slice(0, 8)}-${Date.now()}`;
                const filter = {
                    kinds: [3],
                    authors: [pubkey],
                    limit: 1,
                };

                ws?.send(JSON.stringify(["REQ", subId, filter]));
            });

            ws.on("message", (data: Buffer) => {
                try {
                    const msg = JSON.parse(data.toString());

                    if (msg[0] === "EVENT") {
                        const event: NostrEvent = msg[2];
                        // Keep the most recent event
                        if (!latestEvent || event.created_at > latestEvent.created_at) {
                            latestEvent = event;
                        }
                    } else if (msg[0] === "EOSE") {
                        // End of stored events
                        cleanup();
                        resolve(extractFollowsFromEvent(latestEvent));
                    }
                } catch (err) {
                    console.warn("Error parsing relay message:", err);
                }
            });

            ws.on("error", (err) => {
                cleanup();
                reject(err);
            });

            ws.on("close", () => {
                // If we haven't resolved yet, resolve with what we have
                cleanup();
                resolve(extractFollowsFromEvent(latestEvent));
            });
        } catch (err) {
            cleanup();
            reject(err);
        }
    });
}

/**
 * Extract pubkeys from kind 3 event tags
 */
function extractFollowsFromEvent(event: NostrEvent | null): string[] {
    if (!event) return [];

    const follows: string[] = [];
    for (const tag of event.tags) {
        if (tag[0] === "p" && tag[1]) {
            // Validate pubkey format
            if (/^[0-9a-f]{64}$/i.test(tag[1])) {
                follows.push(tag[1].toLowerCase());
            }
        }
    }

    return follows;
}

/**
 * Clear all cached follows (for maintenance)
 */
export async function clearFollowsCache(): Promise<number> {
    const result = await prisma.followsCache.deleteMany({});
    return result.count;
}

/**
 * Clear expired cached follows
 */
export async function clearExpiredFollowsCache(): Promise<number> {
    const cutoff = new Date(Date.now() - CACHE_DURATION_MS);
    const result = await prisma.followsCache.deleteMany({
        where: {
            fetchedAt: { lt: cutoff },
        },
    });
    return result.count;
}

/**
 * Nostr Actions Library
 *
 * Reusable functions for Nostr relay operations
 */

import { serverEnv } from "@/lib/Environment";
import { getPublicKey, signEvent, getEventHash, NostrEvent } from "./crypto";
import {
    NOSTR_RELAYS,
    RELAY_CONNECT_TIMEOUT_MS,
    RELAY_PUBLISH_TIMEOUT_MS,
    RELAY_FETCH_TIMEOUT_MS,
} from "./config";
import WebSocket, { type Data as WebSocketData } from "ws";

// Re-export config for convenience
export { NOSTR_RELAYS, RELAY_CONNECT_TIMEOUT_MS, RELAY_PUBLISH_TIMEOUT_MS, RELAY_FETCH_TIMEOUT_MS };

// ============================================================================
// WebSocket Utilities
// ============================================================================

/**
 * Connect to a WebSocket with timeout
 */
export async function connectWithTimeout(
    url: string,
    timeout: number = RELAY_CONNECT_TIMEOUT_MS
): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(url);
        const timer = setTimeout(() => {
            ws.close();
            reject(new Error("Connection timeout"));
        }, timeout);

        ws.on("open", () => {
            clearTimeout(timer);
            resolve(ws);
        });

        ws.on("error", () => {
            clearTimeout(timer);
            reject(new Error("Connection failed"));
        });
    });
}

// ============================================================================
// Event Publishing
// ============================================================================

export interface PublishResult {
    successCount: number;
    failedCount: number;
    failedRelays: string[];
    details: Array<{ relay: string; success: boolean; error?: string }>;
}

/**
 * Publish a Nostr event to all configured relays
 */
export async function publishEventToRelays(
    event: NostrEvent,
    relays: readonly string[] = NOSTR_RELAYS
): Promise<PublishResult> {
    const details: Array<{ relay: string; success: boolean; error?: string }> = [];

    const results = await Promise.allSettled(
        relays.map(async (relay) => {
            try {
                const ws = await connectWithTimeout(relay, RELAY_CONNECT_TIMEOUT_MS);
                return new Promise<{ relay: string; success: boolean }>((resolve) => {
                    const timeout = setTimeout(() => {
                        ws.close();
                        resolve({ relay, success: false });
                    }, RELAY_PUBLISH_TIMEOUT_MS);

                    ws.on("message", (data: WebSocketData) => {
                        try {
                            const parsed = JSON.parse(data.toString());
                            if (parsed[0] === "OK" && parsed[1] === event.id) {
                                clearTimeout(timeout);
                                ws.close();
                                if (parsed[2] === true) {
                                    resolve({ relay, success: true });
                                } else {
                                    resolve({ relay, success: false });
                                }
                            }
                        } catch {
                            // Ignore parse errors
                        }
                    });

                    ws.on("error", () => {
                        clearTimeout(timeout);
                        ws.close();
                        resolve({ relay, success: false });
                    });

                    ws.send(JSON.stringify(["EVENT", event]));
                });
            } catch (error) {
                return { relay, success: false, error: String(error) };
            }
        })
    );

    for (const result of results) {
        if (result.status === "fulfilled") {
            details.push(result.value);
        }
    }

    const successCount = details.filter((d) => d.success).length;
    const failedCount = details.filter((d) => !d.success).length;
    const failedRelays = details.filter((d) => !d.success).map((d) => d.relay);

    return { successCount, failedCount, failedRelays, details };
}

// ============================================================================
// Event Fetching
// ============================================================================

export interface NostrPost {
    id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    content: string;
    tags: string[][];
}

/**
 * Fetch events from a single relay
 */
export async function fetchEventsFromRelay(
    relay: string,
    filter: Record<string, unknown>,
    timeout: number = RELAY_FETCH_TIMEOUT_MS
): Promise<NostrPost[]> {
    try {
        const ws = await connectWithTimeout(relay, RELAY_CONNECT_TIMEOUT_MS);

        return new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
                ws.close();
                resolve([]);
            }, timeout);

            const events: NostrPost[] = [];

            ws.on("message", (data: WebSocketData) => {
                try {
                    const parsed = JSON.parse(data.toString());
                    if (parsed[0] === "EVENT" && parsed[2]) {
                        events.push({
                            id: parsed[2].id,
                            pubkey: parsed[2].pubkey,
                            created_at: parsed[2].created_at,
                            kind: parsed[2].kind,
                            content: parsed[2].content,
                            tags: parsed[2].tags || [],
                        });
                    } else if (parsed[0] === "EOSE") {
                        clearTimeout(timeoutId);
                        ws.close();
                        resolve(events);
                    }
                } catch {
                    // Ignore parse errors
                }
            });

            ws.on("error", () => {
                clearTimeout(timeoutId);
                ws.close();
                resolve(events);
            });

            ws.send(JSON.stringify(["REQ", "fetch", filter]));
        });
    } catch {
        return [];
    }
}

/**
 * Fetch events from multiple relays and deduplicate
 */
export async function fetchEventsFromRelays(
    filter: Record<string, unknown>,
    relays: readonly string[] = NOSTR_RELAYS,
    maxRelays: number = 3
): Promise<NostrPost[]> {
    const allEvents = new Map<string, NostrPost>();

    const fetchPromises = relays.slice(0, maxRelays).map((relay) =>
        fetchEventsFromRelay(relay, filter)
    );

    const results = await Promise.allSettled(fetchPromises);

    for (const result of results) {
        if (result.status === "fulfilled") {
            for (const event of result.value) {
                if (!allEvents.has(event.id)) {
                    allEvents.set(event.id, event);
                }
            }
        }
    }

    // Sort by timestamp descending
    return Array.from(allEvents.values()).sort(
        (a, b) => b.created_at - a.created_at
    );
}

// ============================================================================
// Bot-Specific Actions
// ============================================================================

export interface DeleteEventResult {
    success: boolean;
    error?: string;
    successCount?: number;
    failedRelays?: string[];
}

/**
 * Publish a deletion event (NIP-09) to delete a Nostr event
 * Can delete any event published by the bot
 */
export async function deleteNostrEvent(
    eventId: string,
    reason?: string
): Promise<DeleteEventResult> {
    const privateKey = serverEnv.nostrBotPrivateKey;
    if (!privateKey) {
        console.log("[NostrActions] Bot private key not configured, skipping deletion");
        return { success: false, error: "Bot not configured" };
    }

    try {
        const botPubkey = getPublicKey(privateKey);

        // NIP-09: Deletion event (kind 5)
        const event: NostrEvent = {
            pubkey: botPubkey,
            created_at: Math.floor(Date.now() / 1000),
            kind: 5,
            tags: [["e", eventId]],
            content: reason || "Event deleted by admin",
        };

        event.id = getEventHash(event);
        event.sig = await signEvent(event, privateKey);

        const { successCount, failedRelays } = await publishEventToRelays(event);

        if (successCount === 0) {
            return {
                success: false,
                error: "Failed to publish deletion to any relay",
                failedRelays,
            };
        }

        console.log(`[NostrActions] Deletion event published for: ${eventId} (${successCount}/${NOSTR_RELAYS.length} relays)`);
        return {
            success: true,
            successCount,
            failedRelays: failedRelays.length > 0 ? failedRelays : undefined,
        };
    } catch (error) {
        console.error("[NostrActions] Failed to publish deletion event:", error);
        return { success: false, error: String(error) };
    }
}

/**
 * Get the bot's public key (hex format)
 */
export function getBotPubkey(): string | null {
    const privateKey = serverEnv.nostrBotPrivateKey;
    if (!privateKey) return null;
    return getPublicKey(privateKey);
}

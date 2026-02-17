/**
 * Browser-compatible WebSocket publishing for Nostr events
 * Unlike actions.ts which uses server-side WebSocket, this works in the browser
 */

import { NOSTR_RELAYS, RELAY_CONNECT_TIMEOUT_MS, RELAY_PUBLISH_TIMEOUT_MS } from "./config";
import type { NostrEvent } from "./crypto";

export interface PublishResult {
    successCount: number;
    failedCount: number;
    failedRelays: string[];
    details: Array<{
        relay: string;
        success: boolean;
        error?: string;
    }>;
}

/**
 * Publish a signed Nostr event to relays from the browser
 */
export async function publishEventFromBrowser(
    signedEvent: NostrEvent & { id: string; sig: string },
    relays: readonly string[] = NOSTR_RELAYS
): Promise<PublishResult> {
    const results: PublishResult = {
        successCount: 0,
        failedCount: 0,
        failedRelays: [],
        details: [],
    };

    // Publish to all relays in parallel
    const publishPromises = relays.map((relay) =>
        publishToRelay(signedEvent, relay)
            .then((success) => {
                if (success) {
                    results.successCount++;
                    results.details.push({ relay, success: true });
                } else {
                    results.failedCount++;
                    results.failedRelays.push(relay);
                    results.details.push({ relay, success: false, error: "Failed to publish" });
                }
            })
            .catch((error) => {
                results.failedCount++;
                results.failedRelays.push(relay);
                results.details.push({
                    relay,
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            })
    );

    await Promise.allSettled(publishPromises);

    return results;
}

/**
 * Publish to a single relay with WebSocket
 */
function publishToRelay(
    event: NostrEvent & { id: string; sig: string },
    relayUrl: string
): Promise<boolean> {
    return new Promise((resolve) => {
        let ws: WebSocket;
        let timeoutId: ReturnType<typeof setTimeout>;
        let connectTimeoutId: ReturnType<typeof setTimeout>;
        let resolved = false;

        const cleanup = () => {
            if (resolved) return;
            resolved = true;
            clearTimeout(timeoutId);
            clearTimeout(connectTimeoutId);
            try {
                ws?.close();
            } catch {
                // Ignore close errors
            }
        };

        try {
            ws = new WebSocket(relayUrl);

            // Connection timeout
            connectTimeoutId = setTimeout(() => {
                console.log(`[ClientPublish] Connection timeout for ${relayUrl}`);
                cleanup();
                resolve(false);
            }, RELAY_CONNECT_TIMEOUT_MS);

            ws.onopen = () => {
                clearTimeout(connectTimeoutId);
                console.log(`[ClientPublish] Connected to ${relayUrl}, publishing event...`);

                // Publish timeout
                timeoutId = setTimeout(() => {
                    console.log(`[ClientPublish] Publish timeout for ${relayUrl}`);
                    cleanup();
                    resolve(false);
                }, RELAY_PUBLISH_TIMEOUT_MS);

                // Send the event
                ws.send(JSON.stringify(["EVENT", event]));
            };

            ws.onmessage = (msg) => {
                try {
                    const data = JSON.parse(msg.data);
                    // ["OK", event_id, success, message]
                    if (data[0] === "OK" && data[1] === event.id) {
                        const success = data[2] === true;
                        if (success) {
                            console.log(`[ClientPublish] Successfully published to ${relayUrl}`);
                        } else {
                            console.log(`[ClientPublish] Relay rejected event at ${relayUrl}: ${data[3]}`);
                        }
                        cleanup();
                        resolve(success);
                    }
                } catch {
                    // Ignore parse errors
                }
            };

            ws.onerror = (error) => {
                console.log(`[ClientPublish] WebSocket error for ${relayUrl}:`, error);
                cleanup();
                resolve(false);
            };

            ws.onclose = () => {
                if (!resolved) {
                    console.log(`[ClientPublish] WebSocket closed unexpectedly for ${relayUrl}`);
                    cleanup();
                    resolve(false);
                }
            };
        } catch (error) {
            console.log(`[ClientPublish] Failed to create WebSocket for ${relayUrl}:`, error);
            cleanup();
            resolve(false);
        }
    });
}

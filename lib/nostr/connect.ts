import {
    generatePrivateKey,
    getPublicKey,
    nip04Decrypt,
    nip04Encrypt,
    getEventHash,
    signEvent,
    generateSecret,
    type NostrEvent,
} from "./crypto";

export interface NostrConnectSession {
    clientPrivateKey: string;
    clientPubkey: string;
    relay: string;
    secret: string;
    remotePubkey?: string;
    ws?: WebSocket;
}

export interface NostrConnectCallbacks {
    onConnected: (remotePubkey: string) => void;
    onError: (error: string) => void;
    onTimeout: () => void;
}

const DEFAULT_RELAY = "wss://relay.nsec.app";
const CONNECTION_TIMEOUT = 120000; // 2 minutes

// Generate nostrconnect:// URI for QR code
export function generateNostrConnectURI(session: NostrConnectSession, appName: string): string {
    const params = new URLSearchParams({
        relay: session.relay,
        secret: session.secret,
        name: appName,
    });

    return `nostrconnect://${session.clientPubkey}?${params.toString()}`;
}

// Create a new Nostr Connect session
export function createNostrConnectSession(relay: string = DEFAULT_RELAY): NostrConnectSession {
    const clientPrivateKey = generatePrivateKey();
    const clientPubkey = getPublicKey(clientPrivateKey);
    const secret = generateSecret();

    return {
        clientPrivateKey,
        clientPubkey,
        relay,
        secret,
    };
}

// Start listening for connection on the relay
export function startNostrConnect(
    session: NostrConnectSession,
    callbacks: NostrConnectCallbacks
): () => void {
    let ws: WebSocket | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let isConnected = false;

    const cleanup = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        if (ws) {
            ws.close();
            ws = null;
        }
    };

    try {
        ws = new WebSocket(session.relay);
        session.ws = ws;

        ws.onopen = () => {
            // Subscribe to events addressed to our ephemeral pubkey
            const subId = `nostrconnect-${Date.now()}`;
            const filter = {
                kinds: [24133], // NIP-46 response kind
                "#p": [session.clientPubkey],
                since: Math.floor(Date.now() / 1000) - 60,
            };

            ws?.send(JSON.stringify(["REQ", subId, filter]));

            // Set connection timeout
            timeoutId = setTimeout(() => {
                if (!isConnected) {
                    cleanup();
                    callbacks.onTimeout();
                }
            }, CONNECTION_TIMEOUT);
        };

        ws.onmessage = async (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data[0] === "EVENT") {
                    const nostrEvent: NostrEvent = data[2];

                    // Decrypt the content
                    const decrypted = await nip04Decrypt(
                        session.clientPrivateKey,
                        nostrEvent.pubkey,
                        nostrEvent.content
                    );

                    const response = JSON.parse(decrypted);

                    // Check if this is an ACK response with our secret
                    if (response.result === "ack" || response.method === "connect") {
                        isConnected = true;
                        session.remotePubkey = nostrEvent.pubkey;

                        // Store the session for future signing requests
                        sessionStorage.setItem("nostr_connect_session", JSON.stringify({
                            clientPrivateKey: session.clientPrivateKey,
                            clientPubkey: session.clientPubkey,
                            remotePubkey: nostrEvent.pubkey,
                            relay: session.relay,
                        }));

                        cleanup();
                        callbacks.onConnected(nostrEvent.pubkey);
                    }
                }
            } catch (err) {
                console.error("Error processing nostr connect message:", err);
            }
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            cleanup();
            callbacks.onError("Connection failed. Please try again.");
        };

        ws.onclose = () => {
            if (!isConnected) {
                // Don't call error if we're already connected or timed out
            }
        };
    } catch (err) {
        callbacks.onError("Failed to connect to relay.");
    }

    return cleanup;
}

// Send a signing request through Nostr Connect
export async function requestSignature(
    event: Omit<NostrEvent, "sig" | "id">,
    sessionData?: {
        clientPrivateKey: string;
        clientPubkey: string;
        remotePubkey: string;
        relay: string;
    }
): Promise<NostrEvent | null> {
    // Get session from storage if not provided
    const storedSession = sessionData || JSON.parse(
        sessionStorage.getItem("nostr_connect_session") || "null"
    );

    if (!storedSession) {
        throw new Error("No Nostr Connect session found");
    }

    return new Promise((resolve, reject) => {
        const ws = new WebSocket(storedSession.relay);
        const requestId = Math.random().toString(36).substring(2);
        let timeoutId: ReturnType<typeof setTimeout>;

        ws.onopen = async () => {
            // Subscribe to responses
            const subId = `sign-${Date.now()}`;
            ws.send(JSON.stringify(["REQ", subId, {
                kinds: [24133],
                "#p": [storedSession.clientPubkey],
                since: Math.floor(Date.now() / 1000) - 10,
            }]));

            // Send signing request
            const request = {
                id: requestId,
                method: "sign_event",
                params: [JSON.stringify(event)],
            };

            const encrypted = await nip04Encrypt(
                storedSession.clientPrivateKey,
                storedSession.remotePubkey,
                JSON.stringify(request)
            );

            const requestEvent: NostrEvent = {
                pubkey: storedSession.clientPubkey,
                created_at: Math.floor(Date.now() / 1000),
                kind: 24133,
                tags: [["p", storedSession.remotePubkey]],
                content: encrypted,
            };

            requestEvent.id = getEventHash(requestEvent);
            requestEvent.sig = await signEvent(requestEvent, storedSession.clientPrivateKey);

            ws.send(JSON.stringify(["EVENT", requestEvent]));

            // Set timeout
            timeoutId = setTimeout(() => {
                ws.close();
                reject(new Error("Signing request timed out"));
            }, 60000);
        };

        ws.onmessage = async (msg) => {
            try {
                const data = JSON.parse(msg.data);

                if (data[0] === "EVENT") {
                    const responseEvent: NostrEvent = data[2];

                    const decrypted = await nip04Decrypt(
                        storedSession.clientPrivateKey,
                        responseEvent.pubkey,
                        responseEvent.content
                    );

                    const response = JSON.parse(decrypted);

                    if (response.id === requestId) {
                        clearTimeout(timeoutId);
                        ws.close();

                        if (response.result) {
                            resolve(JSON.parse(response.result));
                        } else if (response.error) {
                            reject(new Error(response.error.message || "Signing rejected"));
                        }
                    }
                }
            } catch (err) {
                console.error("Error processing signature response:", err);
            }
        };

        ws.onerror = () => {
            clearTimeout(timeoutId);
            reject(new Error("Connection error"));
        };
    });
}

// Check if there's an active Nostr Connect session
export function hasNostrConnectSession(): boolean {
    return !!sessionStorage.getItem("nostr_connect_session");
}

// Clear Nostr Connect session
export function clearNostrConnectSession(): void {
    sessionStorage.removeItem("nostr_connect_session");
}

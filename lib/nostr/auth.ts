import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import * as secp256k1 from "@noble/secp256k1";
import {
    generatePrivateKey,
    getPublicKey,
    nip04Encrypt,
    nip04Decrypt,
    getEventHash,
    signEvent as signNostrEvent,
    type NostrEvent,
} from "./crypto";

export type SigningMethod = "nsec" | "extension" | "bunker";

// Bunker session storage key
const BUNKER_SESSION_KEY = "nostr_bunker_session";

interface BunkerSession {
    clientPrivateKey: string;
    clientPubkey: string;
    remotePubkey: string;
    relay: string;
    secret?: string;
}

/**
 * Sign a challenge using the appropriate method
 * Returns the signature as a hex string
 */
export async function signChallenge(
    challenge: string,
    method: SigningMethod
): Promise<string> {
    switch (method) {
        case "nsec":
            return signWithNsec(challenge);
        case "extension":
            return signWithExtension(challenge);
        case "bunker":
            return signWithBunker(challenge);
        default:
            throw new Error(`Unsupported signing method: ${method}`);
    }
}

/**
 * Sign challenge using a private key stored in session storage
 */
async function signWithNsec(challenge: string): Promise<string> {
    const privateKey = sessionStorage.getItem("nostr_privkey");
    if (!privateKey) {
        throw new Error("Private key not found. Please log in again.");
    }

    // Hash the challenge
    const messageHash = sha256(new TextEncoder().encode(challenge));

    // Create Schnorr signature
    const signature = await secp256k1.schnorr.sign(messageHash, hexToBytes(privateKey));

    return bytesToHex(signature);
}

/**
 * Sign challenge using a browser extension (NIP-07)
 */
async function signWithExtension(challenge: string): Promise<string> {
    if (typeof window === "undefined" || !window.nostr) {
        throw new Error("No Nostr extension found. Please install Alby or nos2x.");
    }

    // Create a Nostr event for signing
    // We use kind 27235 (NIP-98 HTTP Auth) style event for challenge signing
    const pubkey = await window.nostr.getPublicKey();
    const created_at = Math.floor(Date.now() / 1000);

    const event = {
        kind: 27235, // NIP-98 HTTP Auth
        pubkey,
        created_at,
        tags: [["challenge", challenge]],
        content: "",
    };

    // The extension will return a signed event
    const signedEvent = await window.nostr.signEvent(event);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(signedEvent as any).sig) {
        throw new Error("Extension did not return a signature");
    }

    // For NIP-07 extensions, we need to use a workaround:
    // Sign a specially constructed event that embeds our challenge
    const challengeEvent = {
        kind: 22242, // Custom kind for challenge response
        pubkey,
        created_at,
        tags: [],
        content: challenge,
    };

    const signedChallengeEvent = await window.nostr.signEvent(challengeEvent);

    // The signature in the event is over the event hash, not our challenge
    // So we need to extract and return the event signature
    // The server will need to verify this differently

    // Actually, for simplicity, let's use the NIP-07 approach:
    // Return the event signature - the server can verify the challenge
    // was signed by checking the event content matches and signature is valid

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (signedChallengeEvent as any).sig as string;
}

/**
 * Parse a bunker URL to extract connection parameters
 * Format: bunker://<pubkey>?relay=<relay>&secret=<secret>
 */
function parseBunkerUrl(bunkerUrl: string): { remotePubkey: string; relay: string; secret?: string } {
    try {
        const url = new URL(bunkerUrl);
        // The pubkey can be in the host or pathname
        let remotePubkey = url.hostname || url.pathname.replace(/^\/\//, "");

        // Handle bunker:// where pubkey might be after the ://
        if (!remotePubkey && bunkerUrl.startsWith("bunker://")) {
            const withoutScheme = bunkerUrl.slice("bunker://".length);
            const queryStart = withoutScheme.indexOf("?");
            remotePubkey = queryStart > -1 ? withoutScheme.slice(0, queryStart) : withoutScheme;
        }

        const relay = url.searchParams.get("relay") || "wss://relay.nsec.app";
        const secret = url.searchParams.get("secret") || undefined;

        if (!remotePubkey || remotePubkey.length !== 64) {
            throw new Error("Invalid pubkey in bunker URL");
        }

        return { remotePubkey, relay, secret };
    } catch (e) {
        throw new Error(`Failed to parse bunker URL: ${e instanceof Error ? e.message : "Invalid format"}`);
    }
}

/**
 * Get or create a bunker session
 */
function getBunkerSession(bunkerUrl: string): BunkerSession {
    const stored = sessionStorage.getItem(BUNKER_SESSION_KEY);

    if (stored) {
        try {
            const session: BunkerSession = JSON.parse(stored);
            // Verify the session matches the current bunker
            const { remotePubkey, relay } = parseBunkerUrl(bunkerUrl);
            if (session.remotePubkey === remotePubkey && session.relay === relay) {
                return session;
            }
        } catch {
            // Invalid stored session, create new one
        }
    }

    // Create new session
    const { remotePubkey, relay, secret } = parseBunkerUrl(bunkerUrl);
    const clientPrivateKey = generatePrivateKey();
    const clientPubkey = getPublicKey(clientPrivateKey);

    const session: BunkerSession = {
        clientPrivateKey,
        clientPubkey,
        remotePubkey,
        relay,
        secret,
    };

    sessionStorage.setItem(BUNKER_SESSION_KEY, JSON.stringify(session));
    return session;
}

/**
 * Sign challenge using a remote signer (NIP-46)
 */
async function signWithBunker(challenge: string): Promise<string> {
    const bunkerUrl = sessionStorage.getItem("nostr_bunker");
    if (!bunkerUrl) {
        throw new Error("Bunker connection not found. Please reconnect.");
    }

    const session = getBunkerSession(bunkerUrl);

    // Create a Nostr event with the challenge as content
    // This is what the remote signer will sign
    const eventToSign: Omit<NostrEvent, "sig" | "id"> = {
        pubkey: session.remotePubkey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 22242, // Custom kind for challenge-response (same as extension)
        tags: [],
        content: challenge,
    };

    // Request signature from remote signer via NIP-46
    const signedEvent = await requestBunkerSignature(session, eventToSign);

    if (!signedEvent.sig) {
        throw new Error("Remote signer did not return a signature");
    }

    return signedEvent.sig;
}

/**
 * Send a sign_event request to a remote signer via NIP-46
 */
async function requestBunkerSignature(
    session: BunkerSession,
    event: Omit<NostrEvent, "sig" | "id">
): Promise<NostrEvent> {
    return new Promise((resolve, reject) => {
        let ws: WebSocket | null = null;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        const requestId = Math.random().toString(36).substring(2, 15);

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

            ws.onopen = async () => {
                // Subscribe to responses addressed to our client pubkey
                const subId = `bunker-sign-${Date.now()}`;
                ws?.send(JSON.stringify(["REQ", subId, {
                    kinds: [24133], // NIP-46 response kind
                    "#p": [session.clientPubkey],
                    since: Math.floor(Date.now() / 1000) - 60,
                }]));

                // Create the sign_event request
                const request = {
                    id: requestId,
                    method: "sign_event",
                    params: [JSON.stringify(event)],
                };

                // Encrypt the request using NIP-04
                const encryptedContent = await nip04Encrypt(
                    session.clientPrivateKey,
                    session.remotePubkey,
                    JSON.stringify(request)
                );

                // Create and sign the request event
                const requestEvent: NostrEvent = {
                    pubkey: session.clientPubkey,
                    created_at: Math.floor(Date.now() / 1000),
                    kind: 24133, // NIP-46 request kind
                    tags: [["p", session.remotePubkey]],
                    content: encryptedContent,
                };

                requestEvent.id = getEventHash(requestEvent);
                requestEvent.sig = await signNostrEvent(requestEvent, session.clientPrivateKey);

                // Send the request
                ws?.send(JSON.stringify(["EVENT", requestEvent]));

                // Set timeout for response
                timeoutId = setTimeout(() => {
                    cleanup();
                    reject(new Error("Bunker signing request timed out. Please approve the request in your signer."));
                }, 60000); // 60 second timeout
            };

            ws.onmessage = async (msg) => {
                try {
                    const data = JSON.parse(msg.data);

                    if (data[0] === "EVENT") {
                        const responseEvent: NostrEvent = data[2];

                        // Only process events from our remote signer
                        if (responseEvent.pubkey !== session.remotePubkey) {
                            return;
                        }

                        // Decrypt the response
                        const decrypted = await nip04Decrypt(
                            session.clientPrivateKey,
                            responseEvent.pubkey,
                            responseEvent.content
                        );

                        const response = JSON.parse(decrypted);

                        // Check if this is the response to our request
                        if (response.id === requestId) {
                            cleanup();

                            if (response.error) {
                                reject(new Error(response.error.message || "Signing request was rejected"));
                                return;
                            }

                            if (response.result) {
                                // The result should be the signed event as JSON string
                                const signedEvent = typeof response.result === "string"
                                    ? JSON.parse(response.result)
                                    : response.result;
                                resolve(signedEvent);
                                return;
                            }

                            reject(new Error("Invalid response from remote signer"));
                        }
                    }
                } catch (err) {
                    console.error("Error processing bunker response:", err);
                }
            };

            ws.onerror = (error) => {
                console.error("Bunker WebSocket error:", error);
                cleanup();
                reject(new Error("Failed to connect to bunker relay"));
            };

            ws.onclose = () => {
                // Only reject if we haven't already resolved/rejected
                if (timeoutId) {
                    cleanup();
                    reject(new Error("Connection to bunker relay closed unexpectedly"));
                }
            };
        } catch (err) {
            cleanup();
            reject(new Error(`Failed to connect to bunker: ${err instanceof Error ? err.message : "Unknown error"}`));
        }
    });
}

// Re-export for convenience
export { signWithNsec, signWithExtension, signWithBunker };

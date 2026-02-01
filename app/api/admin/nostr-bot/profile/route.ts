import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { serverEnv, publicEnv } from "@/lib/Environment";
import { getPublicKey, getEventHash, signEvent, hexToNpub, NostrEvent } from "@/lib/nostr/crypto";
import { NOSTR_RELAYS } from "@/lib/nostr/config";
import WebSocket from "ws";

interface NostrProfile {
    name?: string;
    display_name?: string;
    about?: string;
    picture?: string;
    banner?: string;
    website?: string;
    nip05?: string;
    lud16?: string;
}

/**
 * Create a NIP-42 AUTH event for relay authentication
 */
async function createAuthEvent(
    privateKey: string,
    challenge: string,
    relay: string
): Promise<NostrEvent> {
    const pubkey = getPublicKey(privateKey);

    const event: NostrEvent = {
        pubkey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 22242, // NIP-42 AUTH event
        tags: [
            ["relay", relay],
            ["challenge", challenge],
        ],
        content: "",
    };

    event.id = getEventHash(event);
    event.sig = await signEvent(event, privateKey);

    return event;
}

async function fetchProfileFromRelay(pubkey: string, relay: string, privateKey?: string): Promise<NostrProfile | null> {
    return new Promise((resolve) => {
        console.log(`[NostrBot] Fetching profile from ${relay}...`);

        let ws: WebSocket | null = null;
        let resolved = false;
        let profile: NostrProfile | null = null;
        let authenticated = false;

        const cleanup = () => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                try {
                    ws.close();
                } catch {
                    // Ignore close errors
                }
            }
        };

        const finish = (result: NostrProfile | null) => {
            if (!resolved) {
                resolved = true;
                cleanup();
                resolve(result);
            }
        };

        const sendProfileRequest = () => {
            const filter = {
                kinds: [0],
                authors: [pubkey],
                limit: 1,
            };
            ws!.send(JSON.stringify(["REQ", "profile", filter]));
        };

        // Timeout after 10 seconds
        const timeout = setTimeout(() => {
            console.log(`[NostrBot] Timeout fetching from ${relay}`);
            finish(null);
        }, 10000);

        try {
            ws = new WebSocket(relay);

            ws.on("open", () => {
                console.log(`[NostrBot] Connected to ${relay}`);
                sendProfileRequest();
            });

            ws.on("message", async (data) => {
                try {
                    const parsed = JSON.parse(data.toString());

                    // Handle NIP-42 AUTH challenge
                    if (parsed[0] === "AUTH" && privateKey && !authenticated) {
                        const challenge = parsed[1];
                        console.log(`[NostrBot] Received AUTH challenge from ${relay}`);
                        const authEvent = await createAuthEvent(privateKey, challenge, relay);
                        ws!.send(JSON.stringify(["AUTH", authEvent]));
                        authenticated = true;
                        // Re-send profile request after auth
                        setTimeout(sendProfileRequest, 100);
                        return;
                    }

                    if (parsed[0] === "EVENT" && parsed[2]?.kind === 0) {
                        console.log(`[NostrBot] Received profile event from ${relay}`);
                        profile = JSON.parse(parsed[2].content);
                    } else if (parsed[0] === "EOSE") {
                        console.log(`[NostrBot] EOSE from ${relay}, profile found: ${!!profile}`);
                        clearTimeout(timeout);
                        finish(profile);
                    } else if (parsed[0] === "OK" && parsed[1] && parsed[2] === true) {
                        console.log(`[NostrBot] AUTH accepted by ${relay}`);
                    } else if (parsed[0] === "NOTICE") {
                        console.log(`[NostrBot] NOTICE from ${relay}: ${parsed[1]}`);
                    }
                } catch (e) {
                    console.log(`[NostrBot] Parse error from ${relay}:`, e);
                }
            });

            ws.on("error", (err) => {
                console.log(`[NostrBot] WebSocket error from ${relay}:`, err.message);
                clearTimeout(timeout);
                finish(null);
            });

            ws.on("close", () => {
                clearTimeout(timeout);
                if (!resolved) {
                    finish(profile);
                }
            });
        } catch (err) {
            console.log(`[NostrBot] Failed to connect to ${relay}:`, err);
            clearTimeout(timeout);
            finish(null);
        }
    });
}

async function publishToRelay(event: NostrEvent, relay: string, privateKey: string): Promise<boolean> {
    return new Promise((resolve) => {
        console.log(`[NostrBot] Publishing to ${relay}...`);

        let ws: WebSocket | null = null;
        let resolved = false;
        let authenticated = false;
        let eventSent = false;

        const cleanup = () => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                try {
                    ws.close();
                } catch {
                    // Ignore close errors
                }
            }
        };

        const finish = (result: boolean) => {
            if (!resolved) {
                resolved = true;
                cleanup();
                resolve(result);
            }
        };

        const sendEvent = () => {
            if (!eventSent) {
                console.log(`[NostrBot] Sending event to ${relay}...`);
                ws!.send(JSON.stringify(["EVENT", event]));
                eventSent = true;
            }
        };

        // Timeout after 15 seconds
        const timeout = setTimeout(() => {
            console.log(`[NostrBot] Timeout publishing to ${relay}`);
            finish(false);
        }, 15000);

        try {
            ws = new WebSocket(relay);

            ws.on("open", () => {
                console.log(`[NostrBot] Connected to ${relay}`);
                // Send event immediately, handle auth if challenged
                sendEvent();
            });

            ws.on("message", async (data) => {
                try {
                    const parsed = JSON.parse(data.toString());
                    console.log(`[NostrBot] Message from ${relay}:`, JSON.stringify(parsed).slice(0, 200));

                    // Handle NIP-42 AUTH challenge
                    if (parsed[0] === "AUTH") {
                        const challenge = parsed[1];
                        console.log(`[NostrBot] Received AUTH challenge from ${relay}, authenticating...`);
                        const authEvent = await createAuthEvent(privateKey, challenge, relay);
                        ws!.send(JSON.stringify(["AUTH", authEvent]));
                        authenticated = true;
                        return;
                    }

                    // Handle OK response for AUTH
                    if (parsed[0] === "OK" && parsed[2] === true && authenticated && !eventSent) {
                        console.log(`[NostrBot] AUTH accepted by ${relay}, sending event...`);
                        sendEvent();
                        return;
                    }

                    // Handle OK response for our event
                    if (parsed[0] === "OK" && parsed[1] === event.id) {
                        clearTimeout(timeout);
                        if (parsed[2] === true) {
                            console.log(`[NostrBot] Successfully published to ${relay}`);
                            finish(true);
                        } else {
                            const reason = parsed[3] || "Unknown reason";
                            console.log(`[NostrBot] Rejected by ${relay}: ${reason}`);

                            // If rejected due to auth, try authenticating
                            if (reason.includes("auth") && !authenticated) {
                                console.log(`[NostrBot] Will wait for AUTH challenge from ${relay}`);
                                // Don't finish yet, wait for AUTH
                            } else {
                                finish(false);
                            }
                        }
                        return;
                    }

                    // Handle NOTICE
                    if (parsed[0] === "NOTICE") {
                        console.log(`[NostrBot] NOTICE from ${relay}: ${parsed[1]}`);
                    }
                } catch (e) {
                    console.log(`[NostrBot] Parse error from ${relay}:`, e);
                }
            });

            ws.on("error", (err) => {
                console.log(`[NostrBot] WebSocket error publishing to ${relay}:`, err.message);
                clearTimeout(timeout);
                finish(false);
            });

            ws.on("close", () => {
                clearTimeout(timeout);
                if (!resolved) {
                    console.log(`[NostrBot] Connection closed before confirmation from ${relay}`);
                    finish(false);
                }
            });
        } catch (err) {
            console.log(`[NostrBot] Failed to connect to ${relay}:`, err);
            clearTimeout(timeout);
            finish(false);
        }
    });
}

async function publishToRelays(event: NostrEvent, privateKey: string): Promise<{ success: number; failed: number; details: string[] }> {
    const details: string[] = [];
    let success = 0;
    let failed = 0;

    // Publish to all relays in parallel
    const results = await Promise.all(
        NOSTR_RELAYS.map(async (relay) => {
            const ok = await publishToRelay(event, relay, privateKey);
            return { relay, ok };
        })
    );

    for (const { relay, ok } of results) {
        if (ok) {
            success++;
            details.push(`${relay}: OK`);
        } else {
            failed++;
            details.push(`${relay}: FAILED`);
        }
    }

    console.log(`[NostrBot] Publish results: ${success} success, ${failed} failed`);
    return { success, failed, details };
}

/**
 * GET /api/admin/nostr-bot/profile
 * Fetch the bot's current Nostr profile
 */
export async function GET(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (!authResult.success) return authResult.response;

    const privateKey = serverEnv.nostrBotPrivateKey;
    if (!privateKey) {
        return NextResponse.json(
            { error: "Bot private key not configured. Set MAPPING_BITCOIN_BOT_PRIVATE_KEY env variable." },
            { status: 500 }
        );
    }

    try {
        const pubkey = getPublicKey(privateKey);
        const npub = hexToNpub(pubkey);

        console.log(`[NostrBot] Fetching profile for pubkey: ${pubkey}`);

        // Try to fetch profile from relays (prioritizing our own relay)
        let profile: NostrProfile | null = null;
        for (const relay of NOSTR_RELAYS) {
            profile = await fetchProfileFromRelay(pubkey, relay, privateKey);
            if (profile) {
                console.log(`[NostrBot] Got profile from ${relay}`);
                break;
            }
        }

        if (!profile) {
            console.log(`[NostrBot] No profile found on any relay`);
        }

        return NextResponse.json({
            pubkey,
            npub,
            profile: profile || {},
            relays: NOSTR_RELAYS,
        });
    } catch (error) {
        console.error("[NostrBot] Failed to fetch bot profile:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch profile" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/nostr-bot/profile
 * Update the bot's Nostr profile (kind 0 event)
 */
export async function PUT(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (!authResult.success) return authResult.response;

    const privateKey = serverEnv.nostrBotPrivateKey;
    if (!privateKey) {
        return NextResponse.json(
            { error: "Bot private key not configured. Set MAPPING_BITCOIN_BOT_PRIVATE_KEY env variable." },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();
        const profile: NostrProfile = {
            name: body.name,
            display_name: body.display_name,
            about: body.about,
            picture: body.picture,
            banner: body.banner,
            website: body.website || publicEnv.siteUrl,
            nip05: body.nip05,
            lud16: body.lud16,
        };

        // Remove undefined/empty values
        Object.keys(profile).forEach((key) => {
            const value = profile[key as keyof NostrProfile];
            if (value === undefined || value === "") {
                delete profile[key as keyof NostrProfile];
            }
        });

        const pubkey = getPublicKey(privateKey);

        console.log(`[NostrBot] Creating profile event for pubkey: ${pubkey}`);
        console.log(`[NostrBot] Profile content:`, profile);

        const event: NostrEvent = {
            pubkey,
            created_at: Math.floor(Date.now() / 1000),
            kind: 0,
            tags: [],
            content: JSON.stringify(profile),
        };

        event.id = getEventHash(event);
        event.sig = await signEvent(event, privateKey);

        console.log(`[NostrBot] Event ID: ${event.id}`);

        const { success, failed, details } = await publishToRelays(event, privateKey);

        return NextResponse.json({
            success: success > 0,
            eventId: event.id,
            relays: { success, failed, details },
        });
    } catch (error) {
        console.error("[NostrBot] Failed to update bot profile:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to update profile" },
            { status: 500 }
        );
    }
}

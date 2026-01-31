import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { serverEnv, publicEnv } from "@/lib/Environment";
import { getPublicKey, getEventHash, signEvent, hexToNpub, NostrEvent } from "@/lib/nostr/crypto";
import WebSocket, { type Data as WebSocketData } from "ws";

const RELAYS = [
    "wss://relay.mappingbitcoin.com",
    "wss://relay.damus.io",
    "wss://relay.nostr.band",
    "wss://nos.lol",
    "wss://relay.primal.net",
];

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

async function connectWithTimeout(url: string, timeout: number): Promise<WebSocket> {
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

async function fetchProfileFromRelay(pubkey: string, relay: string): Promise<NostrProfile | null> {
    try {
        const ws = await connectWithTimeout(relay, 5000);

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                ws.close();
                resolve(null);
            }, 10000);

            let profile: NostrProfile | null = null;

            ws.on("message", (data: WebSocketData) => {
                try {
                    const parsed = JSON.parse(data.toString());
                    if (parsed[0] === "EVENT" && parsed[2]?.kind === 0) {
                        profile = JSON.parse(parsed[2].content);
                    } else if (parsed[0] === "EOSE") {
                        clearTimeout(timeout);
                        ws.close();
                        resolve(profile);
                    }
                } catch {
                    // Ignore parse errors
                }
            });

            ws.on("error", () => {
                clearTimeout(timeout);
                ws.close();
                resolve(null);
            });

            // Request kind 0 (profile) events
            const filter = {
                kinds: [0],
                authors: [pubkey],
                limit: 1,
            };
            ws.send(JSON.stringify(["REQ", "profile", filter]));
        });
    } catch {
        return null;
    }
}

async function publishToRelays(event: NostrEvent): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    const promises = RELAYS.map(async (relay) => {
        try {
            const ws = await connectWithTimeout(relay, 5000);
            return new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    ws.close();
                    reject(new Error("Publish timeout"));
                }, 10000);

                ws.on("message", (data: WebSocketData) => {
                    try {
                        const parsed = JSON.parse(data.toString());
                        if (parsed[0] === "OK" && parsed[1] === event.id) {
                            clearTimeout(timeout);
                            ws.close();
                            if (parsed[2] === true) {
                                resolve();
                            } else {
                                reject(new Error(parsed[3] || "Rejected"));
                            }
                        }
                    } catch {
                        // Ignore parse errors
                    }
                });

                ws.on("error", () => {
                    clearTimeout(timeout);
                    ws.close();
                    reject(new Error("WebSocket error"));
                });

                ws.send(JSON.stringify(["EVENT", event]));
            });
        } catch (error) {
            throw error;
        }
    });

    const results = await Promise.allSettled(promises);
    results.forEach((r) => {
        if (r.status === "fulfilled") success++;
        else failed++;
    });

    return { success, failed };
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
            { error: "Bot private key not configured" },
            { status: 500 }
        );
    }

    try {
        const pubkey = getPublicKey(privateKey);
        const npub = hexToNpub(pubkey);

        // Try to fetch profile from relays
        let profile: NostrProfile | null = null;
        for (const relay of RELAYS) {
            profile = await fetchProfileFromRelay(pubkey, relay);
            if (profile) break;
        }

        return NextResponse.json({
            pubkey,
            npub,
            profile: profile || {},
            relays: RELAYS,
        });
    } catch (error) {
        console.error("Failed to fetch bot profile:", error);
        return NextResponse.json(
            { error: "Failed to fetch profile" },
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
            { error: "Bot private key not configured" },
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

        // Remove undefined values
        Object.keys(profile).forEach((key) => {
            if (profile[key as keyof NostrProfile] === undefined) {
                delete profile[key as keyof NostrProfile];
            }
        });

        const pubkey = getPublicKey(privateKey);

        const event: NostrEvent = {
            pubkey,
            created_at: Math.floor(Date.now() / 1000),
            kind: 0,
            tags: [],
            content: JSON.stringify(profile),
        };

        event.id = getEventHash(event);
        event.sig = await signEvent(event, privateKey);

        const { success, failed } = await publishToRelays(event);

        return NextResponse.json({
            success: true,
            eventId: event.id,
            relays: { success, failed },
        });
    } catch (error) {
        console.error("Failed to update bot profile:", error);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}

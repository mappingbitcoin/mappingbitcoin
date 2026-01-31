import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { serverEnv } from "@/lib/Environment";
import { getPublicKey, getEventHash, signEvent, NostrEvent } from "@/lib/nostr/crypto";
import WebSocket, { type Data as WebSocketData } from "ws";

const RELAYS = [
    "wss://relay.mappingbitcoin.com",
    "wss://relay.damus.io",
    "wss://relay.nostr.band",
    "wss://nos.lol",
    "wss://relay.primal.net",
];

interface NostrPost {
    id: string;
    pubkey: string;
    created_at: number;
    content: string;
    tags: string[][];
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

async function fetchPostsFromRelay(pubkey: string, relay: string, limit: number = 50): Promise<NostrPost[]> {
    try {
        const ws = await connectWithTimeout(relay, 5000);

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                ws.close();
                resolve([]);
            }, 15000);

            const posts: NostrPost[] = [];

            ws.on("message", (data: WebSocketData) => {
                try {
                    const parsed = JSON.parse(data.toString());
                    if (parsed[0] === "EVENT" && parsed[2]?.kind === 1) {
                        posts.push({
                            id: parsed[2].id,
                            pubkey: parsed[2].pubkey,
                            created_at: parsed[2].created_at,
                            content: parsed[2].content,
                            tags: parsed[2].tags || [],
                        });
                    } else if (parsed[0] === "EOSE") {
                        clearTimeout(timeout);
                        ws.close();
                        resolve(posts);
                    }
                } catch {
                    // Ignore parse errors
                }
            });

            ws.on("error", () => {
                clearTimeout(timeout);
                ws.close();
                resolve(posts);
            });

            // Request kind 1 (text note) events
            const filter = {
                kinds: [1],
                authors: [pubkey],
                limit,
            };
            ws.send(JSON.stringify(["REQ", "posts", filter]));
        });
    } catch {
        return [];
    }
}

async function publishToRelays(event: NostrEvent): Promise<{ success: number; failed: number; details: { relay: string; success: boolean; error?: string }[] }> {
    const details: { relay: string; success: boolean; error?: string }[] = [];

    const promises = RELAYS.map(async (relay) => {
        try {
            const ws = await connectWithTimeout(relay, 5000);
            return new Promise<{ relay: string; success: boolean; error?: string }>((resolve) => {
                const timeout = setTimeout(() => {
                    ws.close();
                    resolve({ relay, success: false, error: "Timeout" });
                }, 10000);

                ws.on("message", (data: WebSocketData) => {
                    try {
                        const parsed = JSON.parse(data.toString());
                        if (parsed[0] === "OK" && parsed[1] === event.id) {
                            clearTimeout(timeout);
                            ws.close();
                            if (parsed[2] === true) {
                                resolve({ relay, success: true });
                            } else {
                                resolve({ relay, success: false, error: parsed[3] || "Rejected" });
                            }
                        }
                    } catch {
                        // Ignore parse errors
                    }
                });

                ws.on("error", () => {
                    clearTimeout(timeout);
                    ws.close();
                    resolve({ relay, success: false, error: "Connection error" });
                });

                ws.send(JSON.stringify(["EVENT", event]));
            });
        } catch (error) {
            return { relay, success: false, error: String(error) };
        }
    });

    const results = await Promise.all(promises);
    results.forEach((r) => details.push(r));

    const success = details.filter((d) => d.success).length;
    const failed = details.filter((d) => !d.success).length;

    return { success, failed, details };
}

/**
 * GET /api/admin/nostr-bot/posts
 * Fetch the bot's recent posts
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

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    try {
        const pubkey = getPublicKey(privateKey);

        // Fetch posts from multiple relays and deduplicate
        const allPosts: Map<string, NostrPost> = new Map();

        const fetchPromises = RELAYS.slice(0, 3).map((relay) =>
            fetchPostsFromRelay(pubkey, relay, limit)
        );

        const results = await Promise.allSettled(fetchPromises);
        results.forEach((result) => {
            if (result.status === "fulfilled") {
                result.value.forEach((post) => {
                    if (!allPosts.has(post.id)) {
                        allPosts.set(post.id, post);
                    }
                });
            }
        });

        // Sort by timestamp descending
        const posts = Array.from(allPosts.values()).sort(
            (a, b) => b.created_at - a.created_at
        );

        return NextResponse.json({
            posts: posts.slice(0, limit),
            total: posts.length,
        });
    } catch (error) {
        console.error("Failed to fetch bot posts:", error);
        return NextResponse.json(
            { error: "Failed to fetch posts" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/nostr-bot/posts
 * Create a new post from the bot
 */
export async function POST(request: NextRequest) {
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
        const { content, hashtags, mentionPubkeys, url } = body;

        if (!content || typeof content !== "string" || content.trim().length === 0) {
            return NextResponse.json(
                { error: "Content is required" },
                { status: 400 }
            );
        }

        if (content.length > 5000) {
            return NextResponse.json(
                { error: "Content too long (max 5000 characters)" },
                { status: 400 }
            );
        }

        const pubkey = getPublicKey(privateKey);

        // Build tags
        const tags: string[][] = [];

        // Add hashtags
        if (hashtags && Array.isArray(hashtags)) {
            hashtags.forEach((tag: string) => {
                const cleanTag = tag.replace(/^#/, "").trim();
                if (cleanTag) {
                    tags.push(["t", cleanTag.toLowerCase()]);
                }
            });
        }

        // Add mention pubkeys
        if (mentionPubkeys && Array.isArray(mentionPubkeys)) {
            mentionPubkeys.forEach((pk: string) => {
                if (pk && pk.length === 64) {
                    tags.push(["p", pk]);
                }
            });
        }

        // Add URL reference
        if (url) {
            tags.push(["r", url]);
        }

        const event: NostrEvent = {
            pubkey,
            created_at: Math.floor(Date.now() / 1000),
            kind: 1,
            tags,
            content: content.trim(),
        };

        event.id = getEventHash(event);
        event.sig = await signEvent(event, privateKey);

        const { success, failed, details } = await publishToRelays(event);

        if (success === 0) {
            return NextResponse.json(
                { error: "Failed to publish to any relay", details },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            eventId: event.id,
            relays: { success, failed },
            details,
        });
    } catch (error) {
        console.error("Failed to create post:", error);
        return NextResponse.json(
            { error: "Failed to create post" },
            { status: 500 }
        );
    }
}

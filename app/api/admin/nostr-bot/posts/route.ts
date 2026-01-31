import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { serverEnv, publicEnv } from "@/lib/Environment";
import { getPublicKey, getEventHash, signEvent, NostrEvent } from "@/lib/nostr/crypto";
import WebSocket, { type Data as WebSocketData } from "ws";

// ============================================================================
// Message Templates - New Venue (30 variations)
// ============================================================================
const NEW_VENUE_TEMPLATES = [
    "New Bitcoin spot just dropped! {name} in {location} now accepts sats. Check it out on the map: {url}",
    "The Bitcoin map grows stronger. Welcome {name} ({location}) to the network! {url}",
    "Another merchant joins the circular economy! {name} in {location} is now accepting Bitcoin. {url}",
    "Stack sats, spend sats at {name} in {location}. Fresh on the map! {url}",
    "Bitcoin adoption in action: {name} ({location}) just got listed. Find them here: {url}",
    "New pin on the map! {name} in {location} accepts Bitcoin payments. {url}",
    "The network effect is real. {name} ({location}) now takes BTC. {url}",
    "Bitcoiners in {location} have a new spot: {name}. Visit the map: {url}",
    "Fresh merchant alert: {name} in {location} is open for Bitcoin business. {url}",
    "One more for the orange team! {name} ({location}) joins the map. {url}",
    "Hyperbitcoinization in progress. {name} in {location} now on the map: {url}",
    "New listing: {name} in {location} accepts sats. Time to spend some Bitcoin! {url}",
    "The map just got better. {name} ({location}) is now accepting Bitcoin. {url}",
    "Another business sees the light! {name} in {location} takes BTC now. {url}",
    "Bitcoin spending just got easier in {location}. Welcome {name}! {url}",
    "New merchant: {name} in {location}. The circular economy grows! {url}",
    "Found: Another place to spend your sats. {name}, {location}. {url}",
    "Bitcoin map update: {name} ({location}) added! Check it out: {url}",
    "More merchants, more adoption. {name} in {location} now accepts Bitcoin. {url}",
    "The orange wave reaches {location}. {name} is now on the map: {url}",
    "Spend Bitcoin at {name} in {location}. Just added to the map! {url}",
    "New Bitcoin-friendly business: {name} ({location}). Find it here: {url}",
    "Building the Bitcoin economy one merchant at a time. Welcome {name}, {location}! {url}",
    "Plot twist: {name} in {location} now accepts the hardest money. {url}",
    "Mapping Bitcoin grows! {name} ({location}) joins the revolution. {url}",
    "Another one joins the network. {name} in {location} accepts BTC. {url}",
    "Bitcoin accepted here: {name}, {location}. Added to the map! {url}",
    "The future is being built in {location}. {name} now takes Bitcoin. {url}",
    "New spot for plebs: {name} in {location}. Find it on the map: {url}",
    "Orange pill in action at {name} ({location}). Now accepting Bitcoin! {url}",
];

// ============================================================================
// Message Templates - Verified Venue (30 variations)
// ============================================================================
const VERIFIED_VENUE_TEMPLATES = [
    "Verified! {name} in {location} is officially confirmed via {method}. Trust, but verify. {url}",
    "{name} ({location}) just got the verified badge via {method}. Real Bitcoin merchant confirmed! {url}",
    "Verification complete: {name} in {location} verified through {method}. {url}",
    "Trust level: maximum. {name} ({location}) verified via {method}. {url}",
    "Official: {name} in {location} is a verified Bitcoin merchant ({method}). {url}",
    "Green check for {name} ({location})! Verified through {method}. {url}",
    "{name} in {location} passes the vibe check. Verified via {method}. {url}",
    "Confirmed and verified: {name} ({location}) - {method} verification complete. {url}",
    "No more guessing. {name} in {location} is officially verified ({method}). {url}",
    "Badge earned! {name} ({location}) verified through {method}. {url}",
    "Merchant verification: {name} in {location} confirmed via {method}. {url}",
    "The real deal: {name} ({location}) is now verified through {method}. {url}",
    "Verification success! {name} in {location} confirmed via {method}. {url}",
    "{name} ({location}) is legit. Verified through {method}. Check them out: {url}",
    "Stamp of approval: {name} in {location} verified via {method}. {url}",
    "100% verified: {name} ({location}). Confirmation method: {method}. {url}",
    "Trust established. {name} in {location} verified through {method}. {url}",
    "Another verified merchant: {name} ({location}) - confirmed via {method}. {url}",
    "Proof of merchant: {name} in {location} verified ({method}). {url}",
    "{name} ({location}) just leveled up with {method} verification. {url}",
    "Verified and trusted: {name} in {location}. Method: {method}. {url}",
    "Confirmation received: {name} ({location}) is a verified Bitcoin merchant via {method}. {url}",
    "Don't trust, verify. {name} in {location} passed the test ({method}). {url}",
    "New verified merchant: {name} ({location}). Verified through {method}. {url}",
    "Quality confirmed: {name} in {location} verified via {method}. {url}",
    "Authenticity verified: {name} ({location}) confirmed through {method}. {url}",
    "Blue check energy: {name} in {location} verified via {method}. {url}",
    "{name} ({location}) joins the verified club. Method: {method}. {url}",
    "Verification complete for {name} in {location}. Confirmed via {method}. {url}",
    "Officially Bitcoin: {name} ({location}) verified through {method}. {url}",
];

function getRandomTemplate(templates: string[]): string {
    const index = Math.floor(Math.random() * templates.length);
    return templates[index];
}

function formatVerificationMethod(method: string): string {
    switch (method) {
        case "EMAIL":
            return "email";
        case "DOMAIN":
            return "domain";
        case "PHONE":
            return "phone";
        case "MANUAL":
            return "manual review";
        case "PHYSICAL":
            return "physical visit";
        case "GOOGLE":
            return "Google verification";
        default:
            return method.toLowerCase();
    }
}

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

/**
 * Check if a duplicate post already exists
 * A duplicate is defined as a post with matching:
 * - osm tag (same place)
 * - post-type tag (same type: new, verified, created)
 * - p tag (same verifier/creator pubkey) - for verified/created posts
 * - verification-method tag (same method) - for verified posts
 */
async function checkForDuplicatePost(
    botPubkey: string,
    osmId: string,
    postType: string,
    verifierPubkey?: string,
    verificationMethod?: string
): Promise<{ isDuplicate: boolean; existingPostId?: string; existingPostDate?: Date }> {
    console.log(`[NostrBot] Checking for duplicate post: osm=${osmId}, type=${postType}, verifier=${verifierPubkey?.slice(0, 8)}...`);

    // Fetch recent posts from the bot
    const allPosts: NostrPost[] = [];

    // Try multiple relays for better coverage
    const fetchPromises = RELAYS.slice(0, 3).map((relay) =>
        fetchPostsFromRelay(botPubkey, relay, 200)
    );

    const results = await Promise.allSettled(fetchPromises);
    const seenIds = new Set<string>();

    results.forEach((result) => {
        if (result.status === "fulfilled") {
            result.value.forEach((post) => {
                if (!seenIds.has(post.id)) {
                    seenIds.add(post.id);
                    allPosts.push(post);
                }
            });
        }
    });

    console.log(`[NostrBot] Fetched ${allPosts.length} posts to check for duplicates`);

    // Helper to get tag value
    const getTagValue = (tags: string[][], key: string): string | undefined => {
        const tag = tags.find((t) => t[0] === key);
        return tag?.[1];
    };

    // Check each post for duplicates
    for (const post of allPosts) {
        const postOsmId = getTagValue(post.tags, "osm");
        const postPostType = getTagValue(post.tags, "post-type");
        const postPubkeys = post.tags.filter((t) => t[0] === "p").map((t) => t[1]);
        const postVerificationMethod = getTagValue(post.tags, "verification-method");

        // Must match OSM ID
        if (postOsmId !== osmId) continue;

        // Must match post type
        if (postPostType !== postType) continue;

        // For verified posts, check verifier pubkey and verification method
        if (postType === "verified") {
            // Must have matching verifier
            if (verifierPubkey && !postPubkeys.includes(verifierPubkey)) continue;

            // Must have matching verification method
            if (verificationMethod && postVerificationMethod !== verificationMethod) continue;
        }

        // For created posts, check creator pubkey
        if (postType === "created") {
            if (verifierPubkey && !postPubkeys.includes(verifierPubkey)) continue;
        }

        // Found a duplicate
        console.log(`[NostrBot] Found duplicate post: ${post.id} from ${new Date(post.created_at * 1000).toISOString()}`);
        return {
            isDuplicate: true,
            existingPostId: post.id,
            existingPostDate: new Date(post.created_at * 1000),
        };
    }

    console.log(`[NostrBot] No duplicate found`);
    return { isDuplicate: false };
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

export interface PlacePostData {
    osmId: string;
    name: string;
    city?: string;
    state?: string;
    country?: string;
    category?: string;
    slug?: string;
    isVerified: boolean;
    verificationMethod?: string;
    verifierPubkey?: string;
    creatorPubkey?: string;
}

/**
 * POST /api/admin/nostr-bot/posts
 * Create a new post from the bot
 *
 * Supports two modes:
 * 1. Manual post: { content, hashtags, mentionPubkeys, url }
 * 2. Place-based post: { postType, place, useTemplate }
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
        const {
            content: manualContent,
            hashtags: manualHashtags,
            mentionPubkeys,
            url: manualUrl,
            // Place-based post fields
            postType,
            place,
            useTemplate,
            customContent,
        } = body;

        const pubkey = getPublicKey(privateKey);
        let content: string;
        let hashtags: string[] = [];
        let url: string | undefined;
        const tags: string[][] = [];

        // Handle place-based post
        if (postType && place) {
            const placeData = place as PlacePostData;
            const location = [placeData.city, placeData.country].filter(Boolean).join(", ") || "unknown location";
            url = `${publicEnv.siteUrl}/places/${placeData.slug || placeData.osmId}`;

            // Check for duplicate posts before proceeding
            const duplicateCheck = await checkForDuplicatePost(
                pubkey,
                placeData.osmId,
                postType,
                postType === "verified" ? placeData.verifierPubkey : placeData.creatorPubkey,
                postType === "verified" ? placeData.verificationMethod : undefined
            );

            if (duplicateCheck.isDuplicate) {
                const dateStr = duplicateCheck.existingPostDate
                    ? duplicateCheck.existingPostDate.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                      })
                    : "unknown date";

                return NextResponse.json(
                    {
                        error: `A ${postType} post for this place already exists`,
                        details: `Existing post ID: ${duplicateCheck.existingPostId} (posted on ${dateStr})`,
                        existingPostId: duplicateCheck.existingPostId,
                        existingPostDate: duplicateCheck.existingPostDate,
                    },
                    { status: 409 } // Conflict
                );
            }

            if (useTemplate) {
                // Generate content from template
                if (postType === "verified" && placeData.isVerified) {
                    const template = getRandomTemplate(VERIFIED_VENUE_TEMPLATES);
                    content = template
                        .replace("{name}", placeData.name || "Venue")
                        .replace("{location}", location)
                        .replace("{method}", formatVerificationMethod(placeData.verificationMethod || "MANUAL"))
                        .replace("{url}", url);
                    hashtags = ["bitcoin", "bitcoinmerchant", "mappingbitcoin", "verified"];
                } else {
                    // new or created place
                    const template = getRandomTemplate(NEW_VENUE_TEMPLATES);
                    content = template
                        .replace("{name}", placeData.name || "New venue")
                        .replace("{location}", location)
                        .replace("{url}", url);
                    hashtags = ["bitcoin", "bitcoinmerchant", "mappingbitcoin"];
                }
            } else if (customContent) {
                // Use custom content but with place context
                content = customContent;
                hashtags = manualHashtags || ["bitcoin", "mappingbitcoin"];
            } else {
                return NextResponse.json(
                    { error: "Either useTemplate or customContent is required for place posts" },
                    { status: 400 }
                );
            }

            // Add place-specific tags
            tags.push(["osm", placeData.osmId]);
            tags.push(["post-type", postType]); // Track post type for duplicate detection
            tags.push(["r", url]);

            // Tag the verifier if verified post
            if (postType === "verified" && placeData.verifierPubkey) {
                tags.push(["p", placeData.verifierPubkey]);
                // Add verification method tag for duplicate detection
                if (placeData.verificationMethod) {
                    tags.push(["verification-method", placeData.verificationMethod.toLowerCase()]);
                }
            }

            // Tag the creator if created post
            if (postType === "created" && placeData.creatorPubkey) {
                tags.push(["p", placeData.creatorPubkey]);
            }

            // Add country tag if available
            if (placeData.country) {
                hashtags.push(placeData.country.toLowerCase().replace(/\s+/g, ""));
            }

            // Add category tag if available
            if (placeData.category) {
                hashtags.push(placeData.category.toLowerCase().replace(/\s+/g, ""));
            }
        } else {
            // Manual post mode
            if (!manualContent || typeof manualContent !== "string" || manualContent.trim().length === 0) {
                return NextResponse.json(
                    { error: "Content is required" },
                    { status: 400 }
                );
            }
            content = manualContent;
            hashtags = manualHashtags || [];
            url = manualUrl;
        }

        if (content.length > 5000) {
            return NextResponse.json(
                { error: "Content too long (max 5000 characters)" },
                { status: 400 }
            );
        }

        // Add hashtags
        if (hashtags && Array.isArray(hashtags)) {
            hashtags.forEach((tag: string) => {
                const cleanTag = tag.replace(/^#/, "").trim();
                if (cleanTag) {
                    tags.push(["t", cleanTag.toLowerCase()]);
                }
            });
        }

        // Add mention pubkeys (manual mode)
        if (mentionPubkeys && Array.isArray(mentionPubkeys)) {
            mentionPubkeys.forEach((pk: string) => {
                if (pk && pk.length === 64) {
                    tags.push(["p", pk]);
                }
            });
        }

        // Add URL reference (manual mode, if not already added)
        if (url && !tags.some(t => t[0] === "r" && t[1] === url)) {
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
            content,
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

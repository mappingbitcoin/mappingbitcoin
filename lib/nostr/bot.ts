/**
 * Mapping Bitcoin Nostr Bot
 *
 * Posts automated announcements for new venues and verifications
 */

import { serverEnv, publicEnv } from "@/lib/Environment";
import { getPublicKey, signEvent, getEventHash, hexToNpub, NostrEvent } from "./crypto";
import WebSocket, { type Data as WebSocketData } from "ws";

// Nostr relays to publish to
const PUBLISH_RELAYS = [
    "wss://relay.damus.io",
    "wss://relay.nostr.band",
    "wss://nos.lol",
    "wss://relay.primal.net",
];

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

// ============================================================================
// Helper Functions
// ============================================================================

function getRandomTemplate(templates: string[]): string {
    const index = Math.floor(Math.random() * templates.length);
    return templates[index];
}

function formatVerificationMethod(method: string, detail?: string): string {
    switch (method) {
        case "EMAIL":
            return detail ? `email (${maskEmail(detail)})` : "email";
        case "DOMAIN":
            return detail ? `domain (${detail})` : "domain";
        case "PHONE":
            return "phone";
        case "MANUAL":
            return "manual review";
        default:
            return method.toLowerCase();
    }
}

function maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    if (!domain) return email;
    const maskedLocal = local.length > 2
        ? local[0] + "*".repeat(local.length - 2) + local[local.length - 1]
        : local[0] + "*";
    return `${maskedLocal}@${domain}`;
}

async function publishToRelays(event: NostrEvent): Promise<void> {
    const promises = PUBLISH_RELAYS.map(async (relay) => {
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
                            resolve();
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
            console.error(`Failed to publish to ${relay}:`, error);
            throw error;
        }
    });

    // Wait for at least one relay to accept (Promise.any polyfill for older Node)
    const results = await Promise.allSettled(promises);
    const succeeded = results.some((r) => r.status === "fulfilled");
    if (!succeeded) {
        console.error("Failed to publish to any relay");
    }
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

// ============================================================================
// Public API
// ============================================================================

export interface VenueInfo {
    osmId: string;
    name: string;
    city?: string;
    country?: string;
    category?: string;
}

export interface VerificationInfo {
    method: "EMAIL" | "DOMAIN" | "PHONE" | "MANUAL";
    detail?: string; // email address or domain
    ownerPubkey: string;
}

/**
 * Post a Nostr event announcing a new venue
 */
export async function announceNewVenue(
    venue: VenueInfo,
    posterPubkey?: string
): Promise<{ success: boolean; eventId?: string; error?: string }> {
    const privateKey = serverEnv.nostrBotPrivateKey;
    if (!privateKey) {
        console.log("[NostrBot] Bot private key not configured, skipping announcement");
        return { success: false, error: "Bot not configured" };
    }

    try {
        const botPubkey = getPublicKey(privateKey);
        const location = [venue.city, venue.country].filter(Boolean).join(", ") || "unknown location";
        const url = `${publicEnv.siteUrl}/places/${venue.osmId}`;

        const template = getRandomTemplate(NEW_VENUE_TEMPLATES);
        const content = template
            .replace("{name}", venue.name || "New venue")
            .replace("{location}", location)
            .replace("{url}", url);

        const tags: string[][] = [
            ["t", "bitcoin"],
            ["t", "bitcoinmerchant"],
            ["t", "mappingbitcoin"],
            ["r", url],
        ];

        // Add OSM reference tag
        tags.push(["osm", venue.osmId]);

        // Tag the poster if provided
        if (posterPubkey) {
            tags.push(["p", posterPubkey]);
        }

        // Add location tag if available
        if (venue.country) {
            tags.push(["t", venue.country.toLowerCase().replace(/\s+/g, "")]);
        }

        const event: NostrEvent = {
            pubkey: botPubkey,
            created_at: Math.floor(Date.now() / 1000),
            kind: 1,
            tags,
            content,
        };

        event.id = getEventHash(event);
        event.sig = await signEvent(event, privateKey);

        await publishToRelays(event);

        console.log(`[NostrBot] New venue announced: ${venue.name} (${event.id})`);
        return { success: true, eventId: event.id };
    } catch (error) {
        console.error("[NostrBot] Failed to announce new venue:", error);
        return { success: false, error: String(error) };
    }
}

/**
 * Post a Nostr event announcing a venue verification
 */
export async function announceVerification(
    venue: VenueInfo,
    verification: VerificationInfo
): Promise<{ success: boolean; eventId?: string; error?: string }> {
    const privateKey = serverEnv.nostrBotPrivateKey;
    if (!privateKey) {
        console.log("[NostrBot] Bot private key not configured, skipping announcement");
        return { success: false, error: "Bot not configured" };
    }

    try {
        const botPubkey = getPublicKey(privateKey);
        const location = [venue.city, venue.country].filter(Boolean).join(", ") || "unknown location";
        const url = `${publicEnv.siteUrl}/places/${venue.osmId}`;
        const method = formatVerificationMethod(verification.method, verification.detail);

        const template = getRandomTemplate(VERIFIED_VENUE_TEMPLATES);
        const content = template
            .replace("{name}", venue.name || "Venue")
            .replace("{location}", location)
            .replace("{method}", method)
            .replace("{url}", url);

        const tags: string[][] = [
            ["t", "bitcoin"],
            ["t", "bitcoinmerchant"],
            ["t", "mappingbitcoin"],
            ["t", "verified"],
            ["r", url],
        ];

        // Add OSM reference tag
        tags.push(["osm", venue.osmId]);

        // Tag the business owner
        tags.push(["p", verification.ownerPubkey]);

        // Add location tag if available
        if (venue.country) {
            tags.push(["t", venue.country.toLowerCase().replace(/\s+/g, "")]);
        }

        const event: NostrEvent = {
            pubkey: botPubkey,
            created_at: Math.floor(Date.now() / 1000),
            kind: 1,
            tags,
            content,
        };

        event.id = getEventHash(event);
        event.sig = await signEvent(event, privateKey);

        await publishToRelays(event);

        console.log(`[NostrBot] Verification announced: ${venue.name} (${event.id})`);
        return { success: true, eventId: event.id };
    } catch (error) {
        console.error("[NostrBot] Failed to announce verification:", error);
        return { success: false, error: String(error) };
    }
}

/**
 * Get the bot's public key (npub)
 */
export function getBotNpub(): string | null {
    const privateKey = serverEnv.nostrBotPrivateKey;
    if (!privateKey) return null;
    const pubkey = getPublicKey(privateKey);
    return hexToNpub(pubkey);
}

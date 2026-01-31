/**
 * Nostr Bot Test Script
 *
 * Run with: npx tsx scripts/test-nostr-bot.ts
 *
 * This script tests the Nostr bot by posting:
 * 1. A "new place created" event for dandelion-labs
 * 2. A "place verified" event for dandelion-labs
 */

import "dotenv/config";
import * as secp256k1 from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import WebSocket, { type Data as WebSocketData } from "ws";

// Configure secp256k1 with sha256
secp256k1.hashes.sha256 = sha256;

// ============================================================================
// Configuration
// ============================================================================

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mappingbitcoin.com";
const BOT_PRIVATE_KEY = process.env.MAPPING_BITCOIN_BOT_PRIVATE_KEY;

const PUBLISH_RELAYS = [
    "wss://relay.mappingbitcoin.com",
    "wss://relay.damus.io",
    "wss://relay.nostr.band",
    "wss://nos.lol",
    "wss://relay.primal.net",
];

// Test venue data for "dandelion-labs"
const VENUE = {
    osmId: "node/11892802953",
    name: "Dandelion Labs",
    city: "Buenos Aires",
    country: "Argentina",
};

// Test verification data (using a sample pubkey)
const VERIFICATION = {
    method: "DOMAIN" as const,
    detail: "dandelion-labs.io",
    ownerPubkey: "a0b0c0d0e0f0a0b0c0d0e0f0a0b0c0d0e0f0a0b0c0d0e0f0a0b0c0d0e0f0a0b0", // placeholder
};

// ============================================================================
// Crypto helpers
// ============================================================================

interface NostrEvent {
    id?: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
    sig?: string;
}

function getPublicKey(privateKey: string): string {
    const pubkeyBytes = secp256k1.getPublicKey(hexToBytes(privateKey), true);
    return bytesToHex(pubkeyBytes.slice(1));
}

function getEventHash(event: NostrEvent): string {
    const serialized = JSON.stringify([
        0,
        event.pubkey,
        event.created_at,
        event.kind,
        event.tags,
        event.content,
    ]);
    return bytesToHex(sha256(new TextEncoder().encode(serialized)));
}

async function signEvent(event: NostrEvent, privateKey: string): Promise<string> {
    const serialized = JSON.stringify([
        0,
        event.pubkey,
        event.created_at,
        event.kind,
        event.tags,
        event.content,
    ]);
    const hash = sha256(new TextEncoder().encode(serialized));
    const sig = await secp256k1.signAsync(hash, hexToBytes(privateKey));
    return bytesToHex(sig);
}

function hexToNpub(hex: string): string {
    const ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
    const hrp = "npub";

    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }

    const values: number[] = [];
    let acc = 0;
    let bits = 0;
    for (const byte of bytes) {
        acc = (acc << 8) | byte;
        bits += 8;
        while (bits >= 5) {
            bits -= 5;
            values.push((acc >> bits) & 0x1f);
        }
    }
    if (bits > 0) {
        values.push((acc << (5 - bits)) & 0x1f);
    }

    const polymod = (values: number[]): number => {
        const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
        let chk = 1;
        for (const v of values) {
            const b = chk >> 25;
            chk = ((chk & 0x1ffffff) << 5) ^ v;
            for (let i = 0; i < 5; i++) {
                if ((b >> i) & 1) chk ^= GEN[i];
            }
        }
        return chk;
    };

    const hrpExpand = (hrp: string): number[] => {
        const ret: number[] = [];
        for (const c of hrp) ret.push(c.charCodeAt(0) >> 5);
        ret.push(0);
        for (const c of hrp) ret.push(c.charCodeAt(0) & 31);
        return ret;
    };

    const createChecksum = (hrp: string, data: number[]): number[] => {
        const polymodValue = polymod([...hrpExpand(hrp), ...data, 0, 0, 0, 0, 0, 0]) ^ 1;
        const checksum: number[] = [];
        for (let i = 0; i < 6; i++) {
            checksum.push((polymodValue >> (5 * (5 - i))) & 31);
        }
        return checksum;
    };

    const checksum = createChecksum(hrp, values);
    const combined = [...values, ...checksum];

    return hrp + "1" + combined.map(v => ALPHABET[v]).join("");
}

// ============================================================================
// WebSocket helpers
// ============================================================================

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
                            console.log(`  ✓ Published to ${relay}`);
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
            console.log(`  ✗ Failed to publish to ${relay}:`, error);
            throw error;
        }
    });

    const results = await Promise.allSettled(promises);
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    console.log(`  Published to ${succeeded}/${PUBLISH_RELAYS.length} relays`);
}

// ============================================================================
// Message Templates
// ============================================================================

const NEW_VENUE_TEMPLATES = [
    "New Bitcoin spot just dropped! {name} in {location} now accepts sats. Check it out on the map: {url}",
    "The Bitcoin map grows stronger. Welcome {name} ({location}) to the network! {url}",
    "Another merchant joins the circular economy! {name} in {location} is now accepting Bitcoin. {url}",
    "Stack sats, spend sats at {name} in {location}. Fresh on the map! {url}",
    "Bitcoin adoption in action: {name} ({location}) just got listed. Find them here: {url}",
];

const VERIFIED_VENUE_TEMPLATES = [
    "Verified! {name} in {location} is officially confirmed via {method}. Trust, but verify. {url}",
    "{name} ({location}) just got the verified badge via {method}. Real Bitcoin merchant confirmed! {url}",
    "Verification complete: {name} in {location} verified through {method}. {url}",
    "Trust level: maximum. {name} ({location}) verified via {method}. {url}",
    "Official: {name} in {location} is a verified Bitcoin merchant ({method}). {url}",
];

function getRandomTemplate(templates: string[]): string {
    return templates[Math.floor(Math.random() * templates.length)];
}

// ============================================================================
// Event creators
// ============================================================================

async function announceNewVenue(): Promise<void> {
    if (!BOT_PRIVATE_KEY) {
        throw new Error("MAPPING_BITCOIN_BOT_PRIVATE_KEY not set");
    }

    console.log("\n1. Creating 'New Place' event...\n");

    const botPubkey = getPublicKey(BOT_PRIVATE_KEY);
    const location = [VENUE.city, VENUE.country].filter(Boolean).join(", ");
    const url = `${SITE_URL}/places/${VENUE.osmId}`;

    const template = getRandomTemplate(NEW_VENUE_TEMPLATES);
    const content = template
        .replace("{name}", VENUE.name)
        .replace("{location}", location)
        .replace("{url}", url);

    console.log("Content:", content);
    console.log("");

    const tags: string[][] = [
        ["t", "bitcoin"],
        ["t", "bitcoinmerchant"],
        ["t", "mappingbitcoin"],
        ["r", url],
        ["osm", VENUE.osmId],
        ["t", VENUE.country.toLowerCase().replace(/\s+/g, "")],
    ];

    const event: NostrEvent = {
        pubkey: botPubkey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 1,
        tags,
        content,
    };

    event.id = getEventHash(event);
    event.sig = await signEvent(event, BOT_PRIVATE_KEY);

    console.log("Event ID:", event.id);
    console.log("Bot npub:", hexToNpub(botPubkey));
    console.log("");

    await publishToRelays(event);
}

async function announceVerification(): Promise<void> {
    if (!BOT_PRIVATE_KEY) {
        throw new Error("MAPPING_BITCOIN_BOT_PRIVATE_KEY not set");
    }

    console.log("\n2. Creating 'Verification' event...\n");

    const botPubkey = getPublicKey(BOT_PRIVATE_KEY);
    const location = [VENUE.city, VENUE.country].filter(Boolean).join(", ");
    const url = `${SITE_URL}/places/${VENUE.osmId}`;
    const method = `domain (${VERIFICATION.detail})`;

    const template = getRandomTemplate(VERIFIED_VENUE_TEMPLATES);
    const content = template
        .replace("{name}", VENUE.name)
        .replace("{location}", location)
        .replace("{method}", method)
        .replace("{url}", url);

    console.log("Content:", content);
    console.log("");

    const tags: string[][] = [
        ["t", "bitcoin"],
        ["t", "bitcoinmerchant"],
        ["t", "mappingbitcoin"],
        ["t", "verified"],
        ["r", url],
        ["osm", VENUE.osmId],
        ["p", VERIFICATION.ownerPubkey],
        ["t", VENUE.country.toLowerCase().replace(/\s+/g, "")],
    ];

    const event: NostrEvent = {
        pubkey: botPubkey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 1,
        tags,
        content,
    };

    event.id = getEventHash(event);
    event.sig = await signEvent(event, BOT_PRIVATE_KEY);

    console.log("Event ID:", event.id);
    console.log("Bot npub:", hexToNpub(botPubkey));
    console.log("");

    await publishToRelays(event);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
    console.log("=== Nostr Bot Test Script ===");
    console.log("");
    console.log("Venue:", VENUE.name);
    console.log("OSM ID:", VENUE.osmId);
    console.log("Location:", `${VENUE.city}, ${VENUE.country}`);

    if (!BOT_PRIVATE_KEY) {
        console.error("\n✗ Error: MAPPING_BITCOIN_BOT_PRIVATE_KEY not set in environment");
        process.exit(1);
    }

    try {
        await announceNewVenue();

        // Small delay between events
        await new Promise(resolve => setTimeout(resolve, 2000));

        await announceVerification();

        console.log("\n✓ Both events published successfully!\n");
    } catch (error) {
        console.error("\n✗ Error:", error);
        process.exit(1);
    }
}

main();

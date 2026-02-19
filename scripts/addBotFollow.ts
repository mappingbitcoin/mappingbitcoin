#!/usr/bin/env tsx
/**
 * Add a follow to the bot's contact list
 *
 * Usage: npx tsx scripts/addBotFollow.ts <npub>
 */

import "dotenv/config";
import WebSocket from "ws";
import { getPublicKey, finalizeEvent } from "nostr-tools";
import { decode } from "nostr-tools/nip19";

const RELAYS = [
    "wss://relay.damus.io",
    "wss://relay.nostr.band",
    "wss://nos.lol",
    "wss://relay.primal.net"
];

async function getCurrentFollows(pubkey: string): Promise<string[][]> {
    return new Promise((resolve) => {
        const ws = new WebSocket(RELAYS[0]);
        const follows: string[][] = [];

        const timeout = setTimeout(() => {
            ws.close();
            resolve(follows);
        }, 10000);

        ws.on("open", () => {
            ws.send(JSON.stringify(["REQ", "contacts", { kinds: [3], authors: [pubkey], limit: 1 }]));
        });

        ws.on("message", (data) => {
            const msg = JSON.parse(data.toString());
            if (msg[0] === "EVENT" && msg[1] === "contacts") {
                const tags = msg[2].tags.filter((t: string[]) => t[0] === "p");
                clearTimeout(timeout);
                ws.close();
                resolve(tags);
            } else if (msg[0] === "EOSE") {
                clearTimeout(timeout);
                ws.close();
                resolve(follows);
            }
        });

        ws.on("error", () => {
            clearTimeout(timeout);
            resolve(follows);
        });
    });
}

async function publishToRelay(relay: string, event: object): Promise<boolean> {
    return new Promise((resolve) => {
        try {
            const ws = new WebSocket(relay);

            const timeout = setTimeout(() => {
                ws.close();
                resolve(false);
            }, 5000);

            ws.on("open", () => {
                ws.send(JSON.stringify(["EVENT", event]));
            });

            ws.on("message", (data) => {
                const msg = JSON.parse(data.toString());
                if (msg[0] === "OK") {
                    console.log(`${relay}: ${msg[2] ? "published" : "rejected - " + msg[3]}`);
                    clearTimeout(timeout);
                    ws.close();
                    resolve(msg[2]);
                }
            });

            ws.on("error", (err) => {
                console.log(`${relay}: error - ${err.message}`);
                clearTimeout(timeout);
                resolve(false);
            });
        } catch {
            resolve(false);
        }
    });
}

async function main() {
    const npubToFollow = process.argv[2];

    if (!npubToFollow) {
        console.error("Usage: npx tsx scripts/addBotFollow.ts <npub>");
        process.exit(1);
    }

    // Get bot keys
    const nsec = process.env.MAPPING_BITCOIN_BOT_PRIVATE_KEY;
    if (!nsec) {
        console.error("MAPPING_BITCOIN_BOT_PRIVATE_KEY not set");
        process.exit(1);
    }

    const decoded = decode(nsec);
    const secretKey = decoded.data as Uint8Array;
    const botPubkey = getPublicKey(secretKey);

    // Decode the npub to follow
    const followDecoded = decode(npubToFollow);
    if (followDecoded.type !== "npub") {
        console.error("Invalid npub");
        process.exit(1);
    }
    const followPubkey = followDecoded.data as string;

    console.log("Bot pubkey:", botPubkey);
    console.log("Adding follow:", followPubkey);

    // Get current follows
    console.log("\nFetching current contact list...");
    const currentFollows = await getCurrentFollows(botPubkey);
    console.log(`Current follows: ${currentFollows.length}`);

    // Check if already following
    if (currentFollows.some(t => t[1] === followPubkey)) {
        console.log("Already following this pubkey!");
        process.exit(0);
    }

    // Add new follow
    const updatedFollows = [...currentFollows, ["p", followPubkey]];

    // Create kind 3 event
    const eventTemplate = {
        kind: 3,
        created_at: Math.floor(Date.now() / 1000),
        tags: updatedFollows,
        content: ""
    };

    const signedEvent = finalizeEvent(eventTemplate, secretKey);
    console.log("\nSigned event ID:", signedEvent.id);

    // Publish to relays
    console.log("\nPublishing to relays...");
    let published = 0;
    for (const relay of RELAYS) {
        const success = await publishToRelay(relay, signedEvent);
        if (success) published++;
    }

    console.log(`\nPublished to ${published}/${RELAYS.length} relays`);
    console.log(`Bot now follows ${updatedFollows.length} accounts`);
}

main().catch(console.error);

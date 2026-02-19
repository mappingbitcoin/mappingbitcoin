import { serverEnv } from "../Environment";
import { getPublicKey } from "nostr-tools";
import { decode } from "nostr-tools/nip19";

// Cache the bot pubkey
let botPubkey: string | null = null;

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}

function getBotPubkey(): string {
    if (botPubkey) return botPubkey;

    const privateKey = serverEnv.nostrBotPrivateKey;
    if (!privateKey) {
        throw new Error("MAPPING_BITCOIN_BOT_PRIVATE_KEY not configured");
    }

    // Remove 'nsec' prefix if present and convert
    let secretKey: Uint8Array;
    if (privateKey.startsWith("nsec")) {
        const decoded = decode(privateKey);
        if (decoded.type !== "nsec") {
            throw new Error("Invalid nsec format");
        }
        secretKey = decoded.data as Uint8Array;
    } else {
        secretKey = hexToBytes(privateKey);
    }

    botPubkey = getPublicKey(secretKey);
    return botPubkey;
}

export interface WoTDistanceResult {
    hops: number | null;  // null means unreachable
    pathCount: number;
    mutual: boolean;
}

/**
 * Query WoT oracle for distance between bot and target pubkey
 */
export async function getWoTDistance(
    targetPubkey: string,
    fromPubkey?: string
): Promise<WoTDistanceResult> {
    const from = fromPubkey || getBotPubkey();
    const oracleUrl = serverEnv.wotOracleUrl;

    try {
        const url = `${oracleUrl}/distance?from=${from}&to=${targetPubkey}`;
        const response = await fetch(url, {
            headers: { "User-Agent": "MappingBitcoin/1.0" },
            signal: AbortSignal.timeout(5000), // 5s timeout
        });

        if (!response.ok) {
            console.error(`[WoT] Oracle returned ${response.status}`);
            return { hops: null, pathCount: 0, mutual: false };
        }

        const data = await response.json();
        return {
            hops: data.hops ?? null,
            pathCount: data.pathCount ?? 0,
            mutual: data.mutual ?? false,
        };
    } catch (error) {
        console.error("[WoT] Oracle query failed:", error);
        return { hops: null, pathCount: 0, mutual: false };
    }
}

/**
 * Batch query WoT distances for multiple pubkeys
 */
export async function getWoTDistanceBatch(
    targetPubkeys: string[],
    fromPubkey?: string
): Promise<Map<string, WoTDistanceResult>> {
    const from = fromPubkey || getBotPubkey();
    const oracleUrl = serverEnv.wotOracleUrl;
    const results = new Map<string, WoTDistanceResult>();

    // Initialize with defaults
    for (const pubkey of targetPubkeys) {
        results.set(pubkey, { hops: null, pathCount: 0, mutual: false });
    }

    try {
        const response = await fetch(`${oracleUrl}/distance/batch`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "MappingBitcoin/1.0",
            },
            body: JSON.stringify({ from, targets: targetPubkeys }),
            signal: AbortSignal.timeout(30000), // 30s for batch
        });

        if (!response.ok) {
            console.error(`[WoT] Batch query returned ${response.status}`);
            return results;
        }

        const data = await response.json();

        // Process results
        if (data.results && Array.isArray(data.results)) {
            for (const item of data.results) {
                results.set(item.pubkey, {
                    hops: item.hops ?? null,
                    pathCount: item.pathCount ?? 0,
                    mutual: item.mutual ?? false,
                });
            }
        }

        return results;
    } catch (error) {
        console.error("[WoT] Batch query failed:", error);
        return results;
    }
}

/**
 * Get bot pubkey for frontend use
 */
export function getMappingBitcoinBotPubkey(): string {
    return getBotPubkey();
}

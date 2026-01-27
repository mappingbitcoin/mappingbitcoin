import * as secp256k1 from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";

// Generate a random 32-byte private key
export function generatePrivateKey(): string {
    const privateKey = secp256k1.utils.randomSecretKey();
    return bytesToHex(privateKey);
}

// Derive public key from private key
export function getPublicKey(privateKey: string): string {
    const pubkeyBytes = secp256k1.getPublicKey(hexToBytes(privateKey), true);
    // Remove the prefix byte (02 or 03) to get the x-coordinate only
    return bytesToHex(pubkeyBytes.slice(1));
}

// Convert hex to npub (bech32)
export function hexToNpub(hex: string): string {
    const ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
    const hrp = "npub";

    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }

    // Convert 8-bit to 5-bit
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

// Decode bech32 (nsec/npub) to hex
export function bech32ToHex(bech32: string): { type: "nsec" | "npub"; hex: string } | null {
    try {
        const ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
        const lower = bech32.toLowerCase();
        const prefix = lower.startsWith("nsec") ? "nsec" : lower.startsWith("npub") ? "npub" : null;
        if (!prefix) return null;

        const data = lower.slice(prefix.length + 1);
        const values: number[] = [];
        for (const char of data) {
            const idx = ALPHABET.indexOf(char);
            if (idx === -1) return null;
            values.push(idx);
        }

        let acc = 0;
        let bits = 0;
        const bytes: number[] = [];
        for (const value of values.slice(0, -6)) {
            acc = (acc << 5) | value;
            bits += 5;
            while (bits >= 8) {
                bits -= 8;
                bytes.push((acc >> bits) & 0xff);
            }
        }

        const hex = bytes.map(b => b.toString(16).padStart(2, "0")).join("");
        return { type: prefix as "nsec" | "npub", hex };
    } catch {
        return null;
    }
}

// NIP-04 encryption (simplified - for NIP-46 communication)
export async function nip04Encrypt(
    privateKey: string,
    recipientPubkey: string,
    message: string
): Promise<string> {
    const sharedPoint = secp256k1.getSharedSecret(hexToBytes(privateKey), hexToBytes("02" + recipientPubkey));
    const sharedX = sharedPoint.slice(1, 33);

    const iv = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.importKey(
        "raw",
        sharedX,
        { name: "AES-CBC" },
        false,
        ["encrypt"]
    );

    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-CBC", iv },
        key,
        new TextEncoder().encode(message)
    );

    const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    const ivBase64 = btoa(String.fromCharCode(...iv));

    return `${encryptedBase64}?iv=${ivBase64}`;
}

// NIP-04 decryption
export async function nip04Decrypt(
    privateKey: string,
    senderPubkey: string,
    ciphertext: string
): Promise<string> {
    const [encryptedBase64, ivPart] = ciphertext.split("?iv=");
    const ivBase64 = ivPart || "";

    const sharedPoint = secp256k1.getSharedSecret(hexToBytes(privateKey), hexToBytes("02" + senderPubkey));
    const sharedX = sharedPoint.slice(1, 33);

    const key = await crypto.subtle.importKey(
        "raw",
        sharedX,
        { name: "AES-CBC" },
        false,
        ["decrypt"]
    );

    const encrypted = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-CBC", iv },
        key,
        encrypted
    );

    return new TextDecoder().decode(decrypted);
}

// Sign a Nostr event
export async function signEvent(event: NostrEvent, privateKey: string): Promise<string> {
    const serialized = JSON.stringify([
        0,
        event.pubkey,
        event.created_at,
        event.kind,
        event.tags,
        event.content,
    ]);
    const hash = sha256(new TextEncoder().encode(serialized));
    // signAsync returns 64-byte compact signature as Uint8Array in v3.x
    const sig = await secp256k1.signAsync(hash, hexToBytes(privateKey));
    return bytesToHex(sig);
}

// Calculate event ID
export function getEventHash(event: NostrEvent): string {
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

export interface NostrEvent {
    id?: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
    sig?: string;
}

// Generate a random secret for nostrconnect
export function generateSecret(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return bytesToHex(bytes);
}

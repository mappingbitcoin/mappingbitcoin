import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import * as secp256k1 from "@noble/secp256k1";

export type SigningMethod = "nsec" | "extension" | "bunker";

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

    // Hash the challenge and sign directly for our verification
    // Re-sign the challenge itself (not the event) for server verification
    const messageHash = sha256(new TextEncoder().encode(challenge));

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
 * Sign challenge using a remote signer (NIP-46)
 */
async function signWithBunker(challenge: string): Promise<string> {
    // Bunker signing is more complex and requires relay communication
    // For now, throw an error indicating this needs to be implemented
    // with the existing bunker connection infrastructure

    const bunkerUrl = sessionStorage.getItem("nostr_bunker");
    if (!bunkerUrl) {
        throw new Error("Bunker connection not found. Please reconnect.");
    }

    // TODO: Implement bunker signing using NIP-46
    // This requires:
    // 1. Connecting to the bunker's relay
    // 2. Sending a sign_event request
    // 3. Waiting for the response

    throw new Error("Bunker signing not yet implemented. Please use extension or nsec.");
}

// Re-export for convenience
export { signWithNsec, signWithExtension, signWithBunker };

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export type AuthMode = "write" | "read" | null;

interface NostrUser {
    pubkey: string;
    mode: AuthMode;
    method: "nsec" | "npub" | "extension" | "bunker";
}

interface NostrAuthContextType {
    user: NostrUser | null;
    isLoading: boolean;
    error: string | null;
    authToken: string | null;
    isAuthenticated: boolean;
    loginWithKey: (key: string) => Promise<void>;
    loginWithExtension: () => Promise<void>;
    loginWithBunker: (bunkerUrl: string) => Promise<void>;
    logout: () => void;
    clearError: () => void;
    authenticate: () => Promise<string>;
}

const NostrAuthContext = createContext<NostrAuthContextType | undefined>(undefined);

const STORAGE_KEY = "nostr_auth";
const AUTH_TOKEN_KEY = "nostr_auth_token";

// Helper to decode bech32 (nsec/npub) to hex
function bech32ToHex(bech32: string): { type: "nsec" | "npub"; hex: string } | null {
    try {
        const ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
        const lower = bech32.toLowerCase();
        const prefix = lower.startsWith("nsec") ? "nsec" : lower.startsWith("npub") ? "npub" : null;
        if (!prefix) return null;

        const data = lower.slice(prefix.length + 1); // skip prefix and separator
        const values: number[] = [];
        for (const char of data) {
            const idx = ALPHABET.indexOf(char);
            if (idx === -1) return null;
            values.push(idx);
        }

        // Convert 5-bit to 8-bit
        let acc = 0;
        let bits = 0;
        const bytes: number[] = [];
        for (const value of values.slice(0, -6)) { // exclude checksum
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

// Helper to convert hex to npub
function hexToNpub(hex: string): string {
    const ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
    const hrp = "npub";

    // Convert hex to bytes
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

    // Create checksum (simplified - in production use proper bech32 checksum)
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

// Derive pubkey from private key using secp256k1
async function derivePublicKey(privateKeyHex: string): Promise<string> {
    // Dynamically import to avoid SSR issues
    const { getPublicKey } = await import("@/lib/nostr/crypto");
    return getPublicKey(privateKeyHex);
}

declare global {
    interface Window {
        nostr?: {
            getPublicKey: () => Promise<string>;
            signEvent: (event: object) => Promise<object>;
            nip04?: {
                encrypt: (pubkey: string, plaintext: string) => Promise<string>;
                decrypt: (pubkey: string, ciphertext: string) => Promise<string>;
            };
        };
    }
}

export function NostrAuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<NostrUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [authToken, setAuthToken] = useState<string | null>(null);

    // Load user and auth token from storage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setUser(parsed);
            }
            const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
            if (storedToken) {
                // Check if token is expired by decoding JWT
                try {
                    const payload = JSON.parse(atob(storedToken.split(".")[1]));
                    if (payload.exp * 1000 > Date.now()) {
                        setAuthToken(storedToken);
                    } else {
                        localStorage.removeItem(AUTH_TOKEN_KEY);
                    }
                } catch {
                    localStorage.removeItem(AUTH_TOKEN_KEY);
                }
            }
        } catch (e) {
            console.error("Failed to load auth state:", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Persist user to storage
    useEffect(() => {
        if (user) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [user]);

    const loginWithKey = useCallback(async (key: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const trimmedKey = key.trim();

            // Check if it's a bech32 key
            if (trimmedKey.startsWith("nsec") || trimmedKey.startsWith("npub")) {
                const decoded = bech32ToHex(trimmedKey);
                if (!decoded) {
                    throw new Error("Invalid key format");
                }

                if (decoded.type === "npub") {
                    // Read-only mode with npub
                    setUser({
                        pubkey: decoded.hex,
                        mode: "read",
                        method: "npub",
                    });
                } else {
                    // Write mode with nsec
                    const pubkey = await derivePublicKey(decoded.hex);
                    // Store private key securely (in production, use better encryption)
                    sessionStorage.setItem("nostr_privkey", decoded.hex);
                    setUser({
                        pubkey,
                        mode: "write",
                        method: "nsec",
                    });
                }
            } else if (/^[0-9a-fA-F]{64}$/.test(trimmedKey)) {
                // Raw hex key - assume it's a private key
                const pubkey = await derivePublicKey(trimmedKey);
                sessionStorage.setItem("nostr_privkey", trimmedKey);
                setUser({
                    pubkey,
                    mode: "write",
                    method: "nsec",
                });
            } else {
                throw new Error("Invalid key format. Please enter an nsec, npub, or hex key.");
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to login with key");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loginWithExtension = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            if (typeof window === "undefined" || !window.nostr) {
                throw new Error("No Nostr extension found. Please install Alby or nos2x.");
            }

            const pubkey = await window.nostr.getPublicKey();
            if (!pubkey) {
                throw new Error("Failed to get public key from extension");
            }

            setUser({
                pubkey,
                mode: "write",
                method: "extension",
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to login with extension");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loginWithBunker = useCallback(async (bunkerUrl: string) => {
        setIsLoading(true);
        setError(null);

        try {
            // Parse bunker URL: bunker://<pubkey>?relay=<relay>&secret=<secret>
            const url = new URL(bunkerUrl);
            const pubkey = url.hostname || url.pathname.replace("//", "");

            if (!pubkey || pubkey.length !== 64) {
                throw new Error("Invalid bunker URL");
            }

            // Store bunker connection info
            sessionStorage.setItem("nostr_bunker", bunkerUrl);

            setUser({
                pubkey,
                mode: "write",
                method: "bunker",
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to connect to bunker");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setAuthToken(null);
        sessionStorage.removeItem("nostr_privkey");
        sessionStorage.removeItem("nostr_bunker");
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(AUTH_TOKEN_KEY);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Authenticate: perform challenge-response flow to get JWT
    const authenticate = useCallback(async (): Promise<string> => {
        if (!user) {
            throw new Error("Must be logged in to authenticate");
        }

        if (user.mode !== "write") {
            throw new Error("Write mode required for authentication");
        }

        // Check if we already have a valid token
        if (authToken) {
            try {
                const payload = JSON.parse(atob(authToken.split(".")[1]));
                if (payload.exp * 1000 > Date.now()) {
                    return authToken;
                }
            } catch {
                // Token invalid, continue to get new one
            }
        }

        // Request challenge
        const challengeRes = await fetch("/api/auth/nostr/challenge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pubkey: user.pubkey }),
        });

        if (!challengeRes.ok) {
            const error = await challengeRes.json();
            throw new Error(error.error || "Failed to get challenge");
        }

        const { challenge } = await challengeRes.json();

        // Sign the challenge based on auth method
        let signature: string;
        const { signChallenge } = await import("@/lib/nostr/auth");

        if (user.method === "nsec") {
            signature = await signChallenge(challenge, "nsec");
        } else if (user.method === "extension") {
            signature = await signChallenge(challenge, "extension");
        } else if (user.method === "bunker") {
            signature = await signChallenge(challenge, "bunker");
        } else {
            throw new Error("Cannot authenticate with read-only access");
        }

        // Verify signature and get token
        const verifyRes = await fetch("/api/auth/nostr/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                pubkey: user.pubkey,
                challenge,
                signature,
            }),
        });

        if (!verifyRes.ok) {
            const error = await verifyRes.json();
            throw new Error(error.error || "Authentication failed");
        }

        const { token } = await verifyRes.json();

        // Store token
        setAuthToken(token);
        localStorage.setItem(AUTH_TOKEN_KEY, token);

        return token;
    }, [user, authToken]);

    const isAuthenticated = authToken !== null;

    return (
        <NostrAuthContext.Provider
            value={{
                user,
                isLoading,
                error,
                authToken,
                isAuthenticated,
                loginWithKey,
                loginWithExtension,
                loginWithBunker,
                logout,
                clearError,
                authenticate,
            }}
        >
            {children}
        </NostrAuthContext.Provider>
    );
}

export function useNostrAuth() {
    const context = useContext(NostrAuthContext);
    if (context === undefined) {
        throw new Error("useNostrAuth must be used within a NostrAuthProvider");
    }
    return context;
}

// Helper hook to get npub from pubkey
export function useNpub(pubkey: string | undefined): string | null {
    if (!pubkey) return null;
    try {
        return hexToNpub(pubkey);
    } catch {
        return null;
    }
}

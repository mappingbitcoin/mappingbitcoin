"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Type definitions for nostr-wot-sdk
interface NostrWoTSDK {
    isConfigured: () => Promise<boolean>;
    getDistance: (pubkey: string) => Promise<number | null>;
    getTrustScore: (pubkey: string) => Promise<number>;
    getDistanceBatch: (pubkeys: string[]) => Promise<Map<string, number | null>>;
}

declare global {
    interface Window {
        nostrWoT?: NostrWoTSDK;
    }
}

export interface UseWoTResult {
    isExtensionAvailable: boolean;
    isLoading: boolean;
    source: "extension" | "oracle" | "none";
    getDistance: (pubkey: string) => Promise<number | null>;
    getDistanceBatch: (pubkeys: string[]) => Promise<Map<string, number | null>>;
}

/**
 * Hook for Web of Trust integration
 * Checks for browser extension first, falls back to backend oracle
 */
export function useWoT(): UseWoTResult {
    const [isExtensionAvailable, setIsExtensionAvailable] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const checkedRef = useRef(false);

    useEffect(() => {
        if (checkedRef.current) return;
        checkedRef.current = true;

        const checkExtension = async () => {
            try {
                // Check if nostr-wot-sdk extension is available
                if (typeof window !== "undefined" && window.nostrWoT) {
                    const configured = await window.nostrWoT.isConfigured();
                    setIsExtensionAvailable(configured);
                } else {
                    // Try dynamic import of nostr-wot-sdk
                    const sdk = await import("nostr-wot-sdk").catch(() => null);
                    if (sdk && typeof sdk.isConfigured === "function") {
                        const configured = await sdk.isConfigured();
                        setIsExtensionAvailable(configured);
                    }
                }
            } catch {
                setIsExtensionAvailable(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkExtension();
    }, []);

    const getDistance = useCallback(async (pubkey: string): Promise<number | null> => {
        if (isExtensionAvailable) {
            try {
                const sdk = await import("nostr-wot-sdk");
                if (typeof sdk.getDistance === "function") {
                    return await sdk.getDistance(pubkey);
                }
            } catch {
                // Fall through to oracle
            }
        }

        // Fallback to backend oracle
        try {
            const response = await fetch(`/api/wot/distance?pubkey=${pubkey}`);
            if (!response.ok) return null;
            const data = await response.json();
            return data.distance;
        } catch {
            return null;
        }
    }, [isExtensionAvailable]);

    const getDistanceBatch = useCallback(async (
        pubkeys: string[]
    ): Promise<Map<string, number | null>> => {
        const results = new Map<string, number | null>();

        if (isExtensionAvailable) {
            try {
                const sdk = await import("nostr-wot-sdk");
                if (typeof sdk.getDistanceBatch === "function") {
                    return await sdk.getDistanceBatch(pubkeys);
                }
            } catch {
                // Fall through to oracle
            }
        }

        // Fallback: query each individually (could optimize with batch endpoint)
        await Promise.all(
            pubkeys.map(async (pubkey) => {
                const distance = await getDistance(pubkey);
                results.set(pubkey, distance);
            })
        );

        return results;
    }, [isExtensionAvailable, getDistance]);

    return {
        isExtensionAvailable,
        isLoading,
        source: isExtensionAvailable ? "extension" : "oracle",
        getDistance,
        getDistanceBatch,
    };
}

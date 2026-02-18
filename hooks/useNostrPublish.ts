"use client";

import { useState, useCallback } from "react";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { publishEventFromBrowser, type PublishResult } from "@/lib/nostr/clientPublish";
import { signEvent, getEventHash, type NostrEvent } from "@/lib/nostr/crypto";

export interface UnsignedEvent {
    kind: number;
    tags: string[][];
    content: string;
    created_at?: number;
}

export interface SignedEvent extends NostrEvent {
    id: string;
    sig: string;
}

export interface UseNostrPublishReturn {
    publishEvent: (event: UnsignedEvent) => Promise<{ signedEvent: SignedEvent; result: PublishResult } | null>;
    signOnly: (event: UnsignedEvent) => Promise<SignedEvent | null>;
    isPublishing: boolean;
    error: string | null;
    clearError: () => void;
}

/**
 * Hook for signing and publishing Nostr events from the browser
 * Supports all auth methods: extension (NIP-07), nsec, and bunker (NIP-46)
 */
export function useNostrPublish(): UseNostrPublishReturn {
    const { user } = useNostrAuth();
    const [isPublishing, setIsPublishing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    /**
     * Sign an event using the current auth method
     */
    const signOnly = useCallback(async (unsignedEvent: UnsignedEvent): Promise<SignedEvent | null> => {
        if (!user) {
            setError("You must be logged in to sign events");
            return null;
        }

        if (user.mode !== "write") {
            setError("You need write access to sign events. Please log in with your nsec or browser extension.");
            return null;
        }

        try {
            const eventToSign: NostrEvent = {
                pubkey: user.pubkey,
                created_at: unsignedEvent.created_at || Math.floor(Date.now() / 1000),
                kind: unsignedEvent.kind,
                tags: unsignedEvent.tags,
                content: unsignedEvent.content,
            };

            let signedEvent: SignedEvent;

            if (user.method === "extension") {
                // Use NIP-07 browser extension
                if (!window.nostr?.signEvent) {
                    setError("Nostr extension not found or doesn't support signing. Please install a NIP-07 compatible extension like Alby.");
                    return null;
                }

                const signed = await window.nostr.signEvent(eventToSign) as SignedEvent;
                signedEvent = signed;
            } else if (user.method === "nsec") {
                // Use stored private key
                const privateKey = sessionStorage.getItem("nostr_privkey");
                if (!privateKey) {
                    setError("Private key not found. Please log in again.");
                    return null;
                }

                const id = getEventHash(eventToSign);
                const sig = await signEvent(eventToSign, privateKey);
                signedEvent = {
                    ...eventToSign,
                    id,
                    sig,
                };
            } else if (user.method === "bunker") {
                // NIP-46 bunker signing
                // For now, we'll use the extension if available, or show an error
                // Full NIP-46 implementation would require maintaining the bunker connection
                if (window.nostr?.signEvent) {
                    const signed = await window.nostr.signEvent(eventToSign) as SignedEvent;
                    signedEvent = signed;
                } else {
                    setError("Bunker signing requires a connected signer. Please use a browser extension or log in with nsec.");
                    return null;
                }
            } else {
                setError("Unsupported auth method for signing");
                return null;
            }

            return signedEvent;
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to sign event";
            setError(message);
            console.error("[useNostrPublish] Sign error:", err);
            return null;
        }
    }, [user]);

    /**
     * Sign and publish an event to relays
     */
    const publishEvent = useCallback(async (
        unsignedEvent: UnsignedEvent
    ): Promise<{ signedEvent: SignedEvent; result: PublishResult } | null> => {
        setIsPublishing(true);
        setError(null);

        try {
            // Sign the event
            const signedEvent = await signOnly(unsignedEvent);
            if (!signedEvent) {
                setIsPublishing(false);
                return null;
            }

            // Publish to relays
            console.log("[useNostrPublish] Publishing event:", signedEvent.id);
            const result = await publishEventFromBrowser(signedEvent);

            if (result.successCount === 0) {
                setError("Failed to publish to any relay. Please try again.");
                setIsPublishing(false);
                return null;
            }

            console.log(`[useNostrPublish] Published to ${result.successCount}/${result.successCount + result.failedCount} relays`);
            setIsPublishing(false);
            return { signedEvent, result };
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to publish event";
            setError(message);
            console.error("[useNostrPublish] Publish error:", err);
            setIsPublishing(false);
            return null;
        }
    }, [signOnly]);

    return {
        publishEvent,
        signOnly,
        isPublishing,
        error,
        clearError,
    };
}

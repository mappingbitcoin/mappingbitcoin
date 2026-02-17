"use client";

import { useState, useCallback } from "react";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { signEvent, getEventHash, getPublicKey } from "@/lib/nostr/crypto";

// Blossom servers to try
const BLOSSOM_SERVERS = [
    "https://blossom.primal.net",
    "https://blossom.oxtr.dev",
    "https://cdn.satellite.earth",
    "https://blossom.nostr.hu",
];

interface BlossomSignedEvent {
    id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
    sig: string;
}

interface UseBlossomUploadReturn {
    uploadFile: (file: File) => Promise<string | null>;
    isUploading: boolean;
    error: string | null;
    clearError: () => void;
    progress: string | null;
}

/**
 * Hook for uploading files to Blossom servers
 * Supports all auth methods: extension, nsec, and bunker
 */
export function useBlossomUpload(): UseBlossomUploadReturn {
    const { user } = useNostrAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<string | null>(null);

    const clearError = useCallback(() => setError(null), []);

    // Calculate SHA-256 hash of file bytes
    const calculateHash = async (arrayBuffer: ArrayBuffer): Promise<string> => {
        const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    };

    // Create and sign Blossom auth event based on auth method
    const createSignedAuthEvent = async (hash: string): Promise<string> => {
        if (!user) {
            throw new Error("You must be logged in to upload images.");
        }

        if (user.mode !== "write") {
            throw new Error("Write access is required to upload images. Please log in with nsec or a signing extension.");
        }

        const eventTemplate = {
            kind: 24242, // Blossom auth event kind
            created_at: Math.floor(Date.now() / 1000),
            tags: [
                ["t", "upload"],
                ["x", hash],
                ["expiration", String(Math.floor(Date.now() / 1000) + 300)], // 5 minutes
            ],
            content: "Upload review image",
        };

        let signedEvent: BlossomSignedEvent;

        if (user.method === "extension") {
            // Use NIP-07 browser extension
            if (!window.nostr) {
                throw new Error("Nostr extension not found. Please install a NIP-07 compatible extension like Alby or nos2x.");
            }
            signedEvent = await window.nostr.signEvent(eventTemplate) as BlossomSignedEvent;
        } else if (user.method === "nsec") {
            // Sign with stored private key
            const privateKey = sessionStorage.getItem("nostr_privkey");
            if (!privateKey) {
                throw new Error("Private key not found. Please log in again.");
            }

            const pubkey = getPublicKey(privateKey);
            const eventToSign = {
                ...eventTemplate,
                pubkey,
            };
            const id = getEventHash(eventToSign);
            const sig = await signEvent(eventToSign, privateKey);

            signedEvent = {
                ...eventToSign,
                id,
                sig,
            };
        } else if (user.method === "bunker") {
            // Try using extension if available (some bunker setups inject window.nostr)
            if (window.nostr?.signEvent) {
                try {
                    signedEvent = await window.nostr.signEvent(eventTemplate) as BlossomSignedEvent;
                } catch (e) {
                    throw new Error("Bunker signing for image uploads is not yet supported. Please use a browser extension or nsec login.");
                }
            } else {
                throw new Error("Bunker signing for image uploads is not yet supported. Please use a browser extension or nsec login.");
            }
        } else {
            throw new Error("Unsupported auth method for image uploads.");
        }

        // Return base64 encoded event
        return btoa(JSON.stringify(signedEvent));
    };

    // Upload file to Blossom
    const uploadToBlossom = async (file: File, arrayBuffer: ArrayBuffer, hash: string): Promise<string> => {
        const fileBytes = new Uint8Array(arrayBuffer);

        // Create signed auth event
        setProgress("Signing upload...");
        const authEvent = await createSignedAuthEvent(hash);

        // Try each Blossom server until one succeeds
        for (let i = 0; i < BLOSSOM_SERVERS.length; i++) {
            const server = BLOSSOM_SERVERS[i];
            setProgress(`Uploading to server ${i + 1}/${BLOSSOM_SERVERS.length}...`);

            try {
                console.log(`[Blossom] Trying to upload to ${server}...`);

                // Try PUT first (standard Blossom)
                let response = await fetch(`${server}/upload`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": file.type,
                        "Authorization": `Nostr ${authEvent}`,
                        "X-SHA-256": hash,
                    },
                    body: fileBytes,
                });

                // Some servers use POST instead of PUT
                if (response.status === 405) {
                    console.log(`[Blossom] ${server} returned 405, trying POST...`);
                    response = await fetch(`${server}/upload`, {
                        method: "POST",
                        headers: {
                            "Content-Type": file.type,
                            "Authorization": `Nostr ${authEvent}`,
                            "X-SHA-256": hash,
                        },
                        body: fileBytes,
                    });
                }

                if (response.ok) {
                    let uploadedUrl: string;

                    try {
                        const data = await response.json();
                        console.log(`[Blossom] Response from ${server}:`, data);

                        if (data.url && data.url.startsWith("http")) {
                            uploadedUrl = data.url;
                        } else if (data.blob?.url && data.blob.url.startsWith("http")) {
                            uploadedUrl = data.blob.url;
                        } else if (data.sha256) {
                            uploadedUrl = `${server}/${data.sha256}`;
                        } else {
                            uploadedUrl = `${server}/${hash}`;
                        }
                    } catch {
                        uploadedUrl = `${server}/${hash}`;
                    }

                    // Verify the URL looks like an image URL
                    if (uploadedUrl.includes("/upload") || uploadedUrl.endsWith("/")) {
                        uploadedUrl = `${server}/${hash}`;
                    }

                    console.log(`[Blossom] Successfully uploaded to ${server}: ${uploadedUrl}`);
                    return uploadedUrl;
                } else {
                    const errorText = await response.text().catch(() => "Unknown error");
                    console.log(`[Blossom] Failed to upload to ${server}: HTTP ${response.status}: ${errorText.slice(0, 200)}`);
                }
            } catch (err) {
                console.log(`[Blossom] Error uploading to ${server}:`, err);
            }
        }

        throw new Error("Failed to upload to any Blossom server. Please try again.");
    };

    const uploadFile = useCallback(async (file: File): Promise<string | null> => {
        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            setError("Invalid file type. Allowed: JPEG, PNG, GIF, WebP");
            return null;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setError("File too large. Maximum size is 5MB");
            return null;
        }

        // Check auth status
        if (!user) {
            setError("You must be logged in to upload images.");
            return null;
        }

        if (user.mode !== "write") {
            setError("Write access is required to upload images. Please log in with nsec or a signing extension.");
            return null;
        }

        setIsUploading(true);
        setError(null);
        setProgress("Preparing upload...");

        try {
            const arrayBuffer = await file.arrayBuffer();
            const hash = await calculateHash(arrayBuffer);

            const url = await uploadToBlossom(file, arrayBuffer, hash);
            setProgress(null);
            return url;
        } catch (err) {
            console.error("[useBlossomUpload] Upload error:", err);
            setError(err instanceof Error ? err.message : "Upload failed");
            return null;
        } finally {
            setIsUploading(false);
            setProgress(null);
        }
    }, [user]);

    return {
        uploadFile,
        isUploading,
        error,
        clearError,
        progress,
    };
}

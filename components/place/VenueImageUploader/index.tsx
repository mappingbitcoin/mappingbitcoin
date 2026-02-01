"use client";

import React, { useState, useRef, useCallback } from "react";
import { PhotoIcon, CloseIcon, SpinnerIcon } from "@/assets/icons/ui";
import { IconButton } from "@/components/ui/Button";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { LoginModal } from "@/components/auth";

// Blossom servers to try (files.v0l.io excluded - different upload API)
const BLOSSOM_SERVERS = [
    "https://blossom.primal.net",
    "https://blossom.oxtr.dev",
    "https://cdn.satellite.earth",
    "https://blossom.nostr.hu",
];

interface VenueImageUploaderProps {
    value?: string;
    onChange: (url: string | undefined) => void;
    disabled?: boolean;
}

// Extend window for NIP-07
declare global {
    interface Window {
        nostr?: {
            getPublicKey: () => Promise<string>;
            signEvent: (event: {
                kind: number;
                created_at: number;
                tags: string[][];
                content: string;
            }) => Promise<{
                id: string;
                pubkey: string;
                created_at: number;
                kind: number;
                tags: string[][];
                content: string;
                sig: string;
            }>;
        };
    }
}

export default function VenueImageUploader({
    value,
    onChange,
    disabled = false,
}: VenueImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useNostrAuth();

    // Calculate SHA-256 hash of file bytes
    const calculateHash = async (arrayBuffer: ArrayBuffer): Promise<string> => {
        const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    };

    // Create and sign Blossom auth event using NIP-07
    const createSignedAuthEvent = async (hash: string): Promise<string> => {
        if (!window.nostr) {
            throw new Error("Nostr extension not found. Please install a NIP-07 compatible extension like Alby or nos2x.");
        }

        const pubkey = await window.nostr.getPublicKey();

        const event = {
            kind: 24242, // Blossom auth event kind
            created_at: Math.floor(Date.now() / 1000),
            tags: [
                ["t", "upload"],
                ["x", hash],
                ["expiration", String(Math.floor(Date.now() / 1000) + 300)], // 5 minutes
            ],
            content: "Upload venue image",
        };

        const signedEvent = await window.nostr.signEvent(event);

        // Return base64 encoded event
        return btoa(JSON.stringify(signedEvent));
    };

    // Upload file to Blossom
    const uploadToBlossom = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const fileBytes = new Uint8Array(arrayBuffer);
        const hash = await calculateHash(arrayBuffer);

        // Create signed auth event
        const authEvent = await createSignedAuthEvent(hash);

        // Try each Blossom server until one succeeds
        for (const server of BLOSSOM_SERVERS) {
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

    // Process the upload after validation
    const processUpload = useCallback(async (file: File) => {
        setUploading(true);
        try {
            const url = await uploadToBlossom(file);
            onChange(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
            setPendingFile(null);
        }
    }, [onChange]);

    // Handle file selection
    const handleFile = useCallback(async (file: File) => {
        setError(null);

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            setError("Invalid file type. Allowed: JPEG, PNG, GIF, WebP");
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setError("File too large. Maximum size is 5MB");
            return;
        }

        // Check for NIP-07 extension - show login modal if not available
        if (!window.nostr) {
            setPendingFile(file);
            setShowLoginModal(true);
            return;
        }

        await processUpload(file);
    }, [processUpload]);

    // Handle successful login - continue with pending upload
    const handleLoginSuccess = useCallback(() => {
        setShowLoginModal(false);
        if (pendingFile && window.nostr) {
            processUpload(pendingFile);
        }
    }, [pendingFile, processUpload]);

    // Handle file input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
        // Reset input so same file can be selected again
        e.target.value = "";
    };

    // Handle drag and drop
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    };

    // Remove image
    const handleRemove = () => {
        onChange(undefined);
        setError(null);
    };

    // Click to select
    const handleClick = () => {
        if (!disabled && !uploading) {
            fileInputRef.current?.click();
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-text-light">
                Venue Image (optional)
            </label>

            {value ? (
                // Image preview
                <div className="relative rounded-lg overflow-hidden border border-border-light bg-surface-light">
                    <img
                        src={value}
                        alt="Venue"
                        className="w-full h-48 object-cover"
                    />
                    {!disabled && (
                        <IconButton
                            type="button"
                            onClick={handleRemove}
                            icon={<CloseIcon className="w-4 h-4" />}
                            aria-label="Remove image"
                            variant="solid"
                            color="neutral"
                            size="sm"
                            className="absolute top-2 right-2 !bg-black/60 hover:!bg-black/80"
                        />
                    )}
                </div>
            ) : (
                // Upload area
                <div
                    onClick={handleClick}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        dragOver
                            ? "border-primary bg-primary/10"
                            : "border-border-light hover:border-primary/50 hover:bg-surface-light"
                    } ${disabled || uploading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleInputChange}
                        disabled={disabled || uploading}
                        className="hidden"
                    />

                    {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <SpinnerIcon className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-sm text-text-light">Uploading to Blossom...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-3 bg-surface-light rounded-full">
                                <PhotoIcon className="w-6 h-6 text-text-light" />
                            </div>
                            <div>
                                <p className="text-sm text-white">
                                    <span className="text-primary hover:text-primary-light">Click to upload</span>
                                    {" "}or drag and drop
                                </p>
                                <p className="text-xs text-text-light mt-1">
                                    JPEG, PNG, GIF or WebP (max 5MB)
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <p className="text-sm text-red-400">{error}</p>
            )}

            <p className="text-xs text-text-light">
                {user ? (
                    "Image will be stored on Blossom and added to the OSM entry."
                ) : (
                    "Login with Nostr to upload images. They will be stored on Blossom."
                )}
            </p>

            {/* Nostr Login Modal */}
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => {
                    setShowLoginModal(false);
                    setPendingFile(null);
                }}
                titleKey="title"
                descriptionKey="default"
                onSuccess={handleLoginSuccess}
            />
        </div>
    );
}

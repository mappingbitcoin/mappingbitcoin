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
    onUploadingChange?: (uploading: boolean) => void;
    disabled?: boolean;
    compact?: boolean;
}

interface BlossomSignedEvent {
    id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
    sig: string;
}

export default function VenueImageUploader({
    value,
    onChange,
    onUploadingChange,
    disabled = false,
    compact = false,
}: VenueImageUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null); // Local preview while uploading
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useNostrAuth();

    // Notify parent of uploading state changes
    const setUploadingState = useCallback((isUploading: boolean) => {
        setUploading(isUploading);
        onUploadingChange?.(isUploading);
    }, [onUploadingChange]);

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

        await window.nostr.getPublicKey();

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

        const signedEvent = await window.nostr.signEvent(event) as BlossomSignedEvent;

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

    // Create local preview from file
    const createPreview = useCallback((file: File) => {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return url;
    }, []);

    // Clear local preview
    const clearPreview = useCallback(() => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    }, [previewUrl]);

    // Process the upload after validation
    const processUpload = useCallback(async (file: File) => {
        setUploadingState(true);
        setError(null);

        // Create local preview immediately
        createPreview(file);

        try {
            const url = await uploadToBlossom(file);
            console.log("[VenueImageUploader] Upload successful:", url);
            clearPreview();
            onChange(url);
        } catch (err) {
            console.error("[VenueImageUploader] Upload error:", err);
            setError(err instanceof Error ? err.message : "Upload failed");
            clearPreview();
        } finally {
            setUploadingState(false);
            setPendingFile(null);
        }
    }, [onChange, setUploadingState, createPreview, clearPreview]);

    // Handle file selection
    const handleFile = useCallback(async (file: File) => {
        setError(null);
        console.log("[VenueImageUploader] File selected:", file.name, file.type, file.size);

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

        // Check for NIP-07 extension
        if (!window.nostr) {
            console.log("[VenueImageUploader] No Nostr extension detected");
            // Create preview so user sees the image
            createPreview(file);
            setPendingFile(file);

            if (user) {
                // User is logged in but doesn't have the browser extension
                // Show error explaining they need to install an extension
                setError("To upload images, please install a Nostr browser extension like Alby or nos2x, then refresh the page.");
                return;
            }

            // User is not logged in - show login modal
            setShowLoginModal(true);
            return;
        }

        console.log("[VenueImageUploader] Starting upload...");
        await processUpload(file);
    }, [processUpload, createPreview]);

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

    // Click to select
    const handleClick = () => {
        if (!disabled && !uploading) {
            fileInputRef.current?.click();
        }
    };

    // The image to display (uploaded value or local preview)
    const displayImage = value || previewUrl;

    // Handle remove - clear both value and preview
    const handleRemoveImage = () => {
        clearPreview();
        onChange(undefined);
        setError(null);
    };

    return (
        <div className={compact ? "space-y-1" : "space-y-2"}>
            {!compact && (
                <label className="block text-sm font-medium text-white">
                    Venue Image <span className="text-text-light font-normal">(optional)</span>
                </label>
            )}

            {displayImage ? (
                // Image preview (either uploaded or local preview while uploading)
                <div className={`relative rounded-lg overflow-hidden border border-border-light bg-surface-light ${compact ? "h-28" : "h-48"}`}>
                    <img
                        src={displayImage}
                        alt="Venue"
                        className="w-full h-full object-cover"
                    />
                    {/* Uploading overlay */}
                    {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                                <SpinnerIcon className="w-8 h-8 text-white animate-spin" />
                                <p className="text-sm text-white font-medium">Uploading...</p>
                            </div>
                        </div>
                    )}
                    {/* Remove button - only show when not uploading */}
                    {!disabled && !uploading && (
                        <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-red-500 flex items-center justify-center transition-colors"
                            aria-label="Remove image"
                        >
                            <CloseIcon className="w-4 h-4 text-white" />
                        </button>
                    )}
                </div>
            ) : (
                // Upload area
                <div
                    onClick={handleClick}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`relative border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                        compact ? "p-3 h-28 flex items-center justify-center" : "p-6"
                    } ${
                        dragOver
                            ? "border-accent bg-accent/10"
                            : "border-border-light hover:border-accent/50 hover:bg-surface-light"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleInputChange}
                        disabled={disabled}
                        className="hidden"
                    />

                    <div className="flex flex-col items-center gap-1">
                        <div className={`${compact ? "p-2" : "p-3"} bg-surface-light rounded-full`}>
                            <PhotoIcon className={`${compact ? "w-4 h-4" : "w-6 h-6"} text-text-light`} />
                        </div>
                        <div>
                            <p className={`${compact ? "text-xs" : "text-sm"} text-white`}>
                                <span className="text-accent hover:text-accent-light">{compact ? "Upload" : "Click to upload"}</span>
                                {!compact && " or drag"}
                            </p>
                            {!compact && (
                                <p className="text-xs text-text-light mt-1">
                                    JPEG, PNG, GIF or WebP (max 5MB)
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <p className={`${compact ? "text-xs" : "text-sm"} text-red-400`}>{error}</p>
            )}

            {!compact && (
                <p className="text-xs text-text-light">
                    {user ? (
                        typeof window !== "undefined" && window.nostr
                            ? "Image will be stored on Blossom and added to the OSM entry."
                            : "Requires a Nostr browser extension (Alby, nos2x) to sign uploads."
                    ) : (
                        "Login with Nostr to upload images."
                    )}
                </p>
            )}

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

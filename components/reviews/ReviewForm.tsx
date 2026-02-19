"use client";

import React, { useState, useRef } from "react";
import StarRating from "./StarRating";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { LoginModal } from "@/components/auth";
import { SpinnerIcon, WarningIcon, PhotoIcon, CloseIcon, EditIcon } from "@/assets/icons/ui";
import { useBlossomUpload } from "@/hooks/useBlossomUpload";
import { UserIcon } from "@/assets/icons/ui";

const MAX_IMAGES = 5;

interface ReviewFormProps {
    onSubmit: (rating: number, content?: string, imageUrls?: string[]) => Promise<boolean>;
    isSubmitting: boolean;
    error: string | null;
}

interface UploadedImage {
    id: string;
    url: string;
    previewUrl: string;
}

export default function ReviewForm({ onSubmit, isSubmitting, error }: ReviewFormProps) {
    const { user } = useNostrAuth();
    const [rating, setRating] = useState(0);
    const [content, setContent] = useState("");
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    // Image upload state - multiple images
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [uploadingCount, setUploadingCount] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { uploadFile, isUploading, error: uploadError, clearError: clearUploadError } = useBlossomUpload();

    const isLoggedIn = !!user;
    const hasWriteAccess = user?.mode === "write";
    const hasNostrExtension = typeof window !== "undefined" && !!window.nostr;
    const canAddMoreImages = images.length < MAX_IMAGES && !isUploading;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        if (!isLoggedIn) {
            setShowLoginModal(true);
            return;
        }

        if (!hasWriteAccess) {
            setLocalError("You need write access to submit reviews. Please log in with your nsec or browser extension.");
            return;
        }

        if (rating === 0) {
            setLocalError("Please select a rating");
            return;
        }

        const imageUrls = images.map(img => img.url);
        const success = await onSubmit(rating, content || undefined, imageUrls.length > 0 ? imageUrls : undefined);
        if (success) {
            // Reset form
            setRating(0);
            setContent("");
            // Clean up preview URLs
            images.forEach(img => {
                if (img.previewUrl.startsWith("blob:")) {
                    URL.revokeObjectURL(img.previewUrl);
                }
            });
            setImages([]);
            setIsExpanded(false);
        }
    };

    const handleExpand = () => {
        if (!user) {
            setShowLoginModal(true);
            return;
        }
        setIsExpanded(true);
        // Focus textarea after expansion
        setTimeout(() => {
            textareaRef.current?.focus();
        }, 100);
    };

    const handleCollapse = () => {
        // Only collapse if no content has been entered
        if (rating === 0 && content === "" && images.length === 0) {
            setIsExpanded(false);
            setLocalError(null);
        }
    };

    // Handle file selection - supports multiple files
    const handleFileSelect = async (files: FileList) => {
        setLocalError(null);
        clearUploadError();

        const filesToUpload = Array.from(files).slice(0, MAX_IMAGES - images.length);

        if (filesToUpload.length === 0) {
            setLocalError(`Maximum ${MAX_IMAGES} images allowed`);
            return;
        }

        setUploadingCount(filesToUpload.length);

        // Upload files sequentially to avoid overwhelming the system
        for (const file of filesToUpload) {
            // Validate file type
            const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
            if (!allowedTypes.includes(file.type)) {
                setLocalError("Invalid file type. Allowed: JPEG, PNG, GIF, WebP");
                continue;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setLocalError("File too large. Maximum size is 5MB");
                continue;
            }

            // Create preview
            const previewUrl = URL.createObjectURL(file);
            const tempId = `temp-${Date.now()}-${Math.random()}`;

            // Add placeholder with preview
            setImages(prev => [...prev, { id: tempId, url: "", previewUrl }]);

            // Upload to Blossom
            const url = await uploadFile(file);

            if (url) {
                // Update with real URL
                setImages(prev => prev.map(img =>
                    img.id === tempId ? { ...img, url } : img
                ));
                console.log("[ReviewForm] Image uploaded:", url);
            } else {
                // Remove failed upload
                setImages(prev => prev.filter(img => img.id !== tempId));
                URL.revokeObjectURL(previewUrl);
            }

            setUploadingCount(prev => prev - 1);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files);
        }
        e.target.value = "";
    };

    const handleRemoveImage = (imageId: string) => {
        setImages(prev => {
            const img = prev.find(i => i.id === imageId);
            if (img?.previewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(img.previewUrl);
            }
            return prev.filter(i => i.id !== imageId);
        });
        clearUploadError();
    };

    const handleAddImageClick = () => {
        if (!canAddMoreImages || isSubmitting) return;

        if (!hasNostrExtension) {
            setLocalError("To upload images, please install a Nostr browser extension like Alby or nos2x.");
            return;
        }

        fileInputRef.current?.click();
    };

    const displayError = error || localError || uploadError;
    const isAnyUploading = isUploading || uploadingCount > 0;
    const hasContent = rating > 0 || content.length > 0 || images.length > 0;

    // Collapsed State - Click to expand
    if (!isExpanded) {
        return (
            <div className="bg-surface-light rounded-lg border border-border-light p-4">
                <button
                    type="button"
                    onClick={handleExpand}
                    className="w-full flex items-center gap-3 text-left group"
                >
                    {/* User Avatar */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-surface border border-border-light flex items-center justify-center overflow-hidden">
                        {user?.picture ? (
                            <img
                                src={user.picture}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <UserIcon className="w-5 h-5 text-text-light" />
                        )}
                    </div>

                    {/* Prompt */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-surface border border-border-light rounded-lg group-hover:border-accent/50 transition-colors">
                            <EditIcon className="w-4 h-4 text-text-light/50 flex-shrink-0" />
                            <span className="text-text-light/70 text-sm truncate">
                                {user ? "Share your experience..." : "Log in to write a review"}
                            </span>
                        </div>
                    </div>

                    {/* Star rating preview */}
                    <div className="flex-shrink-0 hidden sm:block">
                        <StarRating value={0} readOnly size="sm" />
                    </div>
                </button>

                {/* Login Modal */}
                <LoginModal
                    isOpen={showLoginModal}
                    onClose={() => setShowLoginModal(false)}
                    titleKey="title"
                    descriptionKey="default"
                    onSuccess={() => {
                        setShowLoginModal(false);
                        setIsExpanded(true);
                    }}
                />
            </div>
        );
    }

    // Expanded State - Full form
    return (
        <div className="bg-surface-light rounded-lg border border-border-light p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Write a Review</h3>
                {!hasContent && (
                    <button
                        type="button"
                        onClick={handleCollapse}
                        className="text-sm text-text-light hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Rating */}
                <div>
                    <label className="block text-sm font-medium text-text-light mb-2">
                        Your Rating <span className="text-red-400">*</span>
                    </label>
                    <StarRating
                        value={rating}
                        onChange={setRating}
                        size="lg"
                    />
                </div>

                {/* Content */}
                <div>
                    <label htmlFor="review-content" className="block text-sm font-medium text-text-light mb-2">
                        Your Review <span className="text-text-light/60">(optional)</span>
                    </label>
                    <textarea
                        ref={textareaRef}
                        id="review-content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Share your experience at this venue..."
                        rows={4}
                        maxLength={2000}
                        disabled={isSubmitting || isAnyUploading}
                        className="w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-white placeholder-text-light/50 focus:outline-none focus:ring-2 focus:ring-accent resize-none disabled:opacity-50"
                    />
                    <div className="text-xs text-text-light mt-1 text-right">
                        {content.length}/2000
                    </div>
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-text-light mb-2">
                        Add Photos <span className="text-text-light/60">(optional, max {MAX_IMAGES})</span>
                    </label>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleFileInputChange}
                        disabled={!canAddMoreImages || isSubmitting || !hasNostrExtension}
                        multiple
                        className="hidden"
                    />

                    {/* Image Grid */}
                    <div className="flex flex-wrap gap-2">
                        {images.map((image) => (
                            <div
                                key={image.id}
                                className="relative rounded-lg overflow-hidden border border-border-light bg-surface h-24 w-24"
                            >
                                <img
                                    src={image.previewUrl}
                                    alt="Review"
                                    className="w-full h-full object-cover"
                                />
                                {/* Uploading overlay */}
                                {!image.url && (
                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                                        <SpinnerIcon className="w-5 h-5 text-white animate-spin" />
                                        <span className="text-xs text-white mt-1">Uploading...</span>
                                    </div>
                                )}
                                {/* Remove button */}
                                {image.url && !isSubmitting && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(image.id)}
                                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-red-500 flex items-center justify-center transition-colors"
                                        aria-label="Remove image"
                                    >
                                        <CloseIcon className="w-3 h-3 text-white" />
                                    </button>
                                )}
                            </div>
                        ))}

                        {/* Add more button */}
                        {canAddMoreImages && (
                            <button
                                type="button"
                                onClick={handleAddImageClick}
                                disabled={isAnyUploading || isSubmitting}
                                className="flex flex-col items-center justify-center h-24 w-24 border border-dashed border-border-light rounded-lg hover:border-accent/50 hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <PhotoIcon className="w-5 h-5 text-text-light" />
                                <span className="text-xs text-text-light mt-1">
                                    {images.length === 0 ? "Add" : "+"}
                                </span>
                            </button>
                        )}
                    </div>

                    {hasNostrExtension && images.length === 0 && (
                        <p className="text-xs text-text-light mt-2">
                            JPEG, PNG, GIF or WebP (max 5MB each)
                        </p>
                    )}

                    {!hasNostrExtension && (
                        <p className="text-xs text-text-light mt-2">
                            Login with a Nostr extension to add photos
                        </p>
                    )}
                </div>

                {/* Error */}
                {displayError && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                        <WarningIcon className="w-4 h-4 flex-shrink-0" />
                        <span>{displayError}</span>
                    </div>
                )}

                {/* Login prompt for read-only users */}
                {isLoggedIn && !hasWriteAccess && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
                        You're logged in with read-only access (npub). To submit reviews, please log in with your nsec key or a browser extension.
                    </div>
                )}

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={isSubmitting || isAnyUploading || (isLoggedIn && !hasWriteAccess)}
                    className="w-full px-4 py-2.5 bg-accent hover:bg-accent-light text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <SpinnerIcon className="w-4 h-4 animate-spin" />
                            Submitting...
                        </>
                    ) : isAnyUploading ? (
                        <>
                            <SpinnerIcon className="w-4 h-4 animate-spin" />
                            Uploading {uploadingCount > 1 ? `${uploadingCount} images` : "image"}...
                        </>
                    ) : (
                        "Submit Review"
                    )}
                </button>
            </form>
        </div>
    );
}

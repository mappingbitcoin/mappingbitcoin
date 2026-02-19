"use client";

import React, { useState } from "react";
import TrustBadge from "./TrustBadge";
import WoTBadge from "./WoTBadge";
import StarRating from "./StarRating";
import { UserIcon, ChatIcon, ChevronDownIcon, CloseIcon, ChevronLeftIcon, ChevronRightIcon } from "@/assets/icons/ui";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { hexToNpub } from "@/lib/nostr/crypto";
import type { ReviewWithTrust } from "@/lib/db/services/reviews";

interface ReviewCardProps {
    review: ReviewWithTrust;
    onReply?: (reviewEventId: string, reviewAuthorPubkey: string) => void;
    showReplyForm?: boolean;
    replyForm?: React.ReactNode;
    ownerPubkey?: string;
}

export default function ReviewCard({
    review,
    onReply,
    showReplyForm,
    replyForm,
    ownerPubkey,
}: ReviewCardProps) {
    const { user } = useNostrAuth();
    const [isExpanded, setIsExpanded] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const MAX_CONTENT_LENGTH = 300;
    const shouldTruncate = review.content && review.content.length > MAX_CONTENT_LENGTH;
    const displayContent = shouldTruncate && !isExpanded
        ? review.content.slice(0, MAX_CONTENT_LENGTH) + "..."
        : review.content;

    const authorName = review.author.name || shortenPubkey(review.authorPubkey);
    const canReply = user?.mode === "write";
    const isOwner = ownerPubkey && review.authorPubkey.toLowerCase() === ownerPubkey.toLowerCase();

    // Use thumbnails for display, fall back to full images
    const displayImages = review.thumbnailUrls.length > 0
        ? review.thumbnailUrls
        : review.imageUrls;
    const fullImages = review.imageUrls;
    const hasImages = displayImages.length > 0;

    const openLightbox = (index: number) => {
        if (fullImages.length > 0) {
            setLightboxIndex(index);
        }
    };

    const closeLightbox = () => setLightboxIndex(null);

    const nextImage = () => {
        if (lightboxIndex !== null && lightboxIndex < fullImages.length - 1) {
            setLightboxIndex(lightboxIndex + 1);
        }
    };

    const prevImage = () => {
        if (lightboxIndex !== null && lightboxIndex > 0) {
            setLightboxIndex(lightboxIndex - 1);
        }
    };

    return (
        <div className="bg-surface-light rounded-lg border border-border-light p-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    {review.author.picture ? (
                        <img
                            src={review.author.picture}
                            alt={authorName}
                            className="w-10 h-10 rounded-full object-cover bg-surface"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-text-light" />
                        </div>
                    )}

                    {/* Author info */}
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-white">{authorName}</span>
                            {isOwner && (
                                <span className="text-xs px-2 py-0.5 bg-accent/20 text-accent rounded-full">
                                    Owner
                                </span>
                            )}
                            <TrustBadge score={review.trustScore} size="sm" />
                            {review.wotDistance !== null && (
                                <WoTBadge distance={review.wotDistance} source="oracle" size="sm" />
                            )}
                        </div>
                        {review.author.nip05 && (
                            <span className="text-xs text-text-light">{review.author.nip05}</span>
                        )}
                    </div>
                </div>

                {/* Rating */}
                {review.rating !== null && (
                    <StarRating value={review.rating} readOnly size="sm" />
                )}
            </div>

            {/* Content */}
            {review.content && (
                <div className="mb-3">
                    <p className="text-text-light whitespace-pre-wrap">{displayContent}</p>
                    {shouldTruncate && (
                        <button
                            type="button"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-accent text-sm hover:text-accent-light mt-1 flex items-center gap-1"
                        >
                            {isExpanded ? "Show less" : "Read more"}
                            <ChevronDownIcon
                                className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            />
                        </button>
                    )}
                </div>
            )}

            {/* Review Images */}
            {hasImages && (
                <div className="mb-3">
                    <div className="flex flex-wrap gap-2">
                        {displayImages.map((imageUrl, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => openLightbox(index)}
                                className="block rounded-lg overflow-hidden border border-border-light bg-surface hover:opacity-90 transition-opacity cursor-pointer"
                            >
                                <img
                                    src={imageUrl}
                                    alt={`Review photo ${index + 1}`}
                                    className="h-24 w-24 object-cover"
                                    loading="lazy"
                                />
                            </button>
                        ))}
                    </div>
                    {displayImages.length > 1 && (
                        <p className="text-xs text-text-light mt-1">
                            {displayImages.length} photos
                        </p>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-text-light">
                <time dateTime={review.eventCreatedAt.toString()}>
                    {formatRelativeTime(new Date(review.eventCreatedAt))}
                </time>

                {canReply && onReply && (
                    <button
                        type="button"
                        onClick={() => onReply(review.eventId, review.authorPubkey)}
                        className="flex items-center gap-1 text-text-light hover:text-accent transition-colors"
                    >
                        <ChatIcon className="w-4 h-4" />
                        <span>Reply</span>
                    </button>
                )}
            </div>

            {/* Reply Form */}
            {showReplyForm && replyForm && (
                <div className="mt-4 pt-4 border-t border-border-light">
                    {replyForm}
                </div>
            )}

            {/* Replies */}
            {review.replies.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border-light space-y-3">
                    {review.replies.map((reply) => (
                        <ReplyCard
                            key={reply.eventId}
                            reply={reply}
                            ownerPubkey={ownerPubkey}
                        />
                    ))}
                </div>
            )}

            {/* Lightbox for full-size images */}
            {lightboxIndex !== null && fullImages.length > 0 && (
                <ImageLightbox
                    images={fullImages}
                    currentIndex={lightboxIndex}
                    onClose={closeLightbox}
                    onNext={nextImage}
                    onPrev={prevImage}
                />
            )}
        </div>
    );
}

interface ImageLightboxProps {
    images: string[];
    currentIndex: number;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
}

function ImageLightbox({ images, currentIndex, onClose, onNext, onPrev }: ImageLightboxProps) {
    const hasMultiple = images.length > 1;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={onClose}
        >
            {/* Close button */}
            <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
                aria-label="Close"
            >
                <CloseIcon className="w-6 h-6 text-white" />
            </button>

            {/* Previous button */}
            {hasMultiple && currentIndex > 0 && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
                    aria-label="Previous image"
                >
                    <ChevronLeftIcon className="w-6 h-6 text-white" />
                </button>
            )}

            {/* Next button */}
            {hasMultiple && currentIndex < images.length - 1 && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
                    aria-label="Next image"
                >
                    <ChevronRightIcon className="w-6 h-6 text-white" />
                </button>
            )}

            {/* Image counter */}
            {hasMultiple && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 rounded-full text-white text-sm">
                    {currentIndex + 1} / {images.length}
                </div>
            )}

            {/* Image */}
            <img
                src={images[currentIndex]}
                alt={`Review photo ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}

interface ReplyCardProps {
    reply: ReviewWithTrust["replies"][number];
    ownerPubkey?: string;
}

function ReplyCard({ reply, ownerPubkey }: ReplyCardProps) {
    const authorName = reply.author.name || shortenPubkey(reply.authorPubkey);
    const isOwner = reply.isOwnerReply || (ownerPubkey && reply.authorPubkey.toLowerCase() === ownerPubkey.toLowerCase());

    return (
        <div className="flex gap-3 pl-4 border-l-2 border-border-light">
            {/* Avatar */}
            {reply.author.picture ? (
                <img
                    src={reply.author.picture}
                    alt={authorName}
                    className="w-8 h-8 rounded-full object-cover bg-surface flex-shrink-0"
                />
            ) : (
                <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-4 h-4 text-text-light" />
                </div>
            )}

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-white text-sm">{authorName}</span>
                    {isOwner && (
                        <span className="text-xs px-1.5 py-0.5 bg-accent/20 text-accent rounded-full">
                            Owner
                        </span>
                    )}
                    <span className="text-xs text-text-light">
                        {formatRelativeTime(new Date(reply.eventCreatedAt))}
                    </span>
                </div>
                <p className="text-text-light text-sm whitespace-pre-wrap">{reply.content}</p>
            </div>
        </div>
    );
}

function shortenPubkey(pubkey: string): string {
    try {
        const npub = hexToNpub(pubkey);
        return npub.slice(0, 8) + "..." + npub.slice(-4);
    } catch {
        return pubkey.slice(0, 8) + "..." + pubkey.slice(-4);
    }
}

function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSecs < 60) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return `${diffYears}y ago`;
}

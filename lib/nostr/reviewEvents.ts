/**
 * Parsers for review Nostr events (kind 38381, 38382)
 */

import { NOSTR_KINDS, parseRatingFromTags, parseOsmIdFromTags, parseImagesFromTags } from "./constants";
import type { IndexReviewInput, IndexReviewReplyInput } from "../db/services/reviews";

export interface NostrEvent {
    id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
    sig: string;
}

export interface ParsedReview {
    eventId: string;
    osmId: string;
    authorPubkey: string;
    rating: number | null;
    content: string | null;
    eventCreatedAt: Date;
}

export interface ParsedReply {
    eventId: string;
    reviewEventId: string;
    reviewAuthorPubkey: string;
    osmId: string;
    authorPubkey: string;
    content: string;
    eventCreatedAt: Date;
}

/**
 * Parse a review event (kind 38381) into IndexReviewInput format
 */
export function parseReviewEvent(event: NostrEvent): IndexReviewInput | null {
    if (event.kind !== NOSTR_KINDS.VENUE_REVIEW) {
        console.warn(`[parseReviewEvent] Expected kind ${NOSTR_KINDS.VENUE_REVIEW}, got ${event.kind}`);
        return null;
    }

    const osmId = parseOsmIdFromTags(event.tags);
    if (!osmId) {
        console.warn(`[parseReviewEvent] Missing OSM ID (d tag) in event ${event.id}`);
        return null;
    }

    const rating = parseRatingFromTags(event.tags);
    const content = event.content?.trim() || null;
    const imageUrls = parseImagesFromTags(event.tags);

    // Must have either rating or content
    if (rating === null && !content) {
        console.warn(`[parseReviewEvent] Review ${event.id} has no rating or content`);
        return null;
    }

    return {
        eventId: event.id,
        osmId,
        authorPubkey: event.pubkey,
        rating,
        content,
        eventCreatedAt: new Date(event.created_at * 1000),
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    };
}

/**
 * Parse a review reply event (kind 38382) into IndexReviewReplyInput format
 */
export function parseReplyEvent(event: NostrEvent): Omit<IndexReviewReplyInput, "isOwnerReply"> | null {
    if (event.kind !== NOSTR_KINDS.REVIEW_REPLY) {
        console.warn(`[parseReplyEvent] Expected kind ${NOSTR_KINDS.REVIEW_REPLY}, got ${event.kind}`);
        return null;
    }

    // Extract e tag (parent review event ID)
    const eTag = event.tags.find(t => t[0] === "e");
    if (!eTag || !eTag[1]) {
        console.warn(`[parseReplyEvent] Missing parent review ID (e tag) in event ${event.id}`);
        return null;
    }

    // Extract p tag (parent review author pubkey) - optional but useful
    const pTag = event.tags.find(t => t[0] === "p");

    // Extract d tag (OSM ID) - for context
    const osmId = parseOsmIdFromTags(event.tags);

    const content = event.content?.trim();
    if (!content) {
        console.warn(`[parseReplyEvent] Reply ${event.id} has no content`);
        return null;
    }

    return {
        eventId: event.id,
        reviewEventId: eTag[1],
        authorPubkey: event.pubkey,
        content,
        eventCreatedAt: new Date(event.created_at * 1000),
    };
}

/**
 * Validate a Nostr event signature (basic check)
 * For production, use a proper verification library
 */
export function validateEventId(event: NostrEvent): boolean {
    // In production, calculate the event hash and compare
    // For now, just check that the ID exists and has correct format
    return event.id && /^[0-9a-f]{64}$/i.test(event.id);
}

/**
 * Extract geohash from event tags
 */
export function parseGeohashFromTags(tags: string[][]): string | null {
    const gTag = tags.find(t => t[0] === "g");
    return gTag?.[1] || null;
}

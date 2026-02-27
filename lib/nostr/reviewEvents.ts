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
 * Parse a review reply event (kind 38382) into IndexReviewReplyInput format.
 * The d tag contains the parent review event ID (same value as the e tag).
 */
export function parseReplyEvent(event: NostrEvent): Omit<IndexReviewReplyInput, "isOwnerReply"> | null {
    if (event.kind !== NOSTR_KINDS.REVIEW_REPLY) {
        console.warn(`[parseReplyEvent] Expected kind ${NOSTR_KINDS.REVIEW_REPLY}, got ${event.kind}`);
        return null;
    }

    // Extract parent review event ID from e tag (or fall back to d tag)
    const eTag = event.tags.find(t => t[0] === "e");
    const dTag = event.tags.find(t => t[0] === "d");
    const reviewEventId = eTag?.[1] || dTag?.[1];
    if (!reviewEventId) {
        console.warn(`[parseReplyEvent] Missing parent review ID (e/d tag) in event ${event.id}`);
        return null;
    }

    const content = event.content?.trim();
    if (!content) {
        console.warn(`[parseReplyEvent] Reply ${event.id} has no content`);
        return null;
    }

    return {
        eventId: event.id,
        reviewEventId,
        authorPubkey: event.pubkey,
        content,
        eventCreatedAt: new Date(event.created_at * 1000),
    };
}

/**
 * Verify a Nostr event: checks that the id matches the hash of the
 * serialized event, and that the Schnorr signature is valid.
 */
export async function verifyEvent(event: NostrEvent): Promise<boolean> {
    try {
        const { getEventHash } = await import("./crypto");
        const { schnorr } = await import("@noble/secp256k1");
        const { hexToBytes } = await import("@noble/hashes/utils.js");

        const expectedId = getEventHash(event);
        if (event.id !== expectedId) return false;

        return schnorr.verify(
            hexToBytes(event.sig),
            hexToBytes(event.id),
            hexToBytes(event.pubkey)
        );
    } catch {
        return false;
    }
}

/**
 * Extract geohash from event tags
 */
export function parseGeohashFromTags(tags: string[][]): string | null {
    const gTag = tags.find(t => t[0] === "g");
    return gTag?.[1] || null;
}

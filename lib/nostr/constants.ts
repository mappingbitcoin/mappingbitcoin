/**
 * Nostr Event Kinds used by MappingBitcoin
 * Reference: https://github.com/nostr-protocol/nips
 */

export const NOSTR_KINDS = {
    // Standard NIP kinds
    METADATA: 0,            // NIP-01: User metadata (kind 0)
    TEXT_NOTE: 1,           // NIP-01: Short text note
    RECOMMEND_RELAY: 2,     // NIP-01: Recommend relay
    CONTACT_LIST: 3,        // NIP-02: Contact list (follows)
    ENCRYPTED_DM: 4,        // NIP-04: Encrypted direct message
    DELETE: 5,              // NIP-09: Event deletion
    REPOST: 6,              // NIP-18: Repost
    REACTION: 7,            // NIP-25: Reactions
    ZAP_REQUEST: 9734,      // NIP-57: Zap request
    ZAP_RECEIPT: 9735,      // NIP-57: Zap receipt

    // NIP-46 Nostr Connect
    NOSTR_CONNECT: 24133,   // NIP-46: Nostr Connect messages

    // MappingBitcoin custom kinds (38381 range for addressable replaceable events)
    VENUE_REVIEW: 38381,    // Venue review with rating
    REVIEW_REPLY: 38382,    // Reply to a review
    VENUE_CLAIM: 38383,     // Business claiming a venue
} as const;

/**
 * Review event structure (kind 38381)
 *
 * Tags:
 * - ["d", "<osm_id>"] - OSM ID like "node/123456" (makes it addressable)
 * - ["rating", "1-5"] - Star rating (1-5)
 * - ["g", "<geohash>"] - Location geohash for discovery
 * - ["t", "review"] - Category tag
 *
 * Content: Review text (markdown supported)
 */
export interface ReviewEventTags {
    d: string;        // OSM ID (e.g., "node/123456")
    rating?: string;  // "1" to "5"
    g?: string;       // Geohash
    t?: string;       // Category tag
}

/**
 * Review reply event structure (kind 38382)
 *
 * Tags:
 * - ["e", "<review_event_id>"] - Reference to parent review
 * - ["p", "<review_author_pubkey>"] - Author of the review being replied to
 * - ["d", "<osm_id>"] - OSM ID for context
 *
 * Content: Reply text
 */
export interface ReviewReplyEventTags {
    e: string;  // Parent review event ID
    p: string;  // Review author pubkey
    d: string;  // OSM ID
}

/**
 * Parse rating from event tags
 */
export function parseRatingFromTags(tags: string[][]): number | null {
    const ratingTag = tags.find(t => t[0] === "rating");
    if (!ratingTag || !ratingTag[1]) return null;

    const rating = parseInt(ratingTag[1], 10);
    if (isNaN(rating) || rating < 1 || rating > 5) return null;

    return rating;
}

/**
 * Parse OSM ID from event tags (d tag)
 */
export function parseOsmIdFromTags(tags: string[][]): string | null {
    const dTag = tags.find(t => t[0] === "d");
    return dTag?.[1] || null;
}

/**
 * Create tags for a review event
 */
export function createReviewTags(
    osmId: string,
    rating?: number,
    geohash?: string
): string[][] {
    const tags: string[][] = [
        ["d", osmId],
        ["t", "review"],
    ];

    if (rating !== undefined && rating >= 1 && rating <= 5) {
        tags.push(["rating", rating.toString()]);
    }

    if (geohash) {
        tags.push(["g", geohash]);
    }

    return tags;
}

/**
 * Create tags for a review reply event
 */
export function createReviewReplyTags(
    reviewEventId: string,
    reviewAuthorPubkey: string,
    osmId: string
): string[][] {
    return [
        ["e", reviewEventId],
        ["p", reviewAuthorPubkey],
        ["d", osmId],
    ];
}

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
 * - ["d", "<osm_d_tag>"] - OSM identifier like "osm:node:123456" (makes it addressable)
 * - ["rating", "1-5"] - Star rating (1-5)
 * - ["g", "<geohash>"] - Location geohash for discovery
 * - ["t", "review"] - Category tag
 * - ["image", "<url>"] - Optional image URL (Blossom)
 *
 * Content: Review text (markdown supported)
 */
export interface ReviewEventTags {
    d: string;        // OSM d tag (e.g., "osm:node:123456")
    rating?: string;  // "1" to "5"
    g?: string;       // Geohash
    t?: string;       // Category tag
    image?: string;   // Image URL (Blossom)
}

/**
 * Review reply event structure (kind 38382)
 *
 * Tags:
 * - ["e", "<review_event_id>"] - Reference to parent review
 * - ["p", "<review_author_pubkey>"] - Author of the review being replied to
 * - ["d", "<osm_d_tag>"] - OSM identifier for context
 *
 * Content: Reply text
 */
export interface ReviewReplyEventTags {
    e: string;  // Parent review event ID
    p: string;  // Review author pubkey
    d: string;  // OSM d tag (e.g., "osm:node:123456")
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
 * Convert internal osmId (e.g., "node/123456") to Nostr d tag format ("osm:node:123456")
 */
export function osmIdToDTag(osmId: string): string {
    // "node/123456" → "osm:node:123456"
    return `osm:${osmId.replace("/", ":")}`;
}

/**
 * Convert Nostr d tag value back to internal osmId format.
 * Handles both new format ("osm:node:123456") and legacy format ("node/123456").
 */
export function dTagToOsmId(dTagValue: string): string {
    if (dTagValue.startsWith("osm:")) {
        // "osm:node:123456" → "node/123456"
        const withoutPrefix = dTagValue.slice(4); // "node:123456"
        const colonIdx = withoutPrefix.indexOf(":");
        if (colonIdx !== -1) {
            return withoutPrefix.slice(0, colonIdx) + "/" + withoutPrefix.slice(colonIdx + 1);
        }
    }
    // Legacy format or fallback — already "node/123456"
    return dTagValue;
}

/**
 * Parse OSM ID from event tags (d tag).
 * Handles both new format ("osm:node:123456") and legacy ("node/123456").
 * Always returns the internal format ("node/123456").
 */
export function parseOsmIdFromTags(tags: string[][]): string | null {
    const dTag = tags.find(t => t[0] === "d");
    if (!dTag?.[1]) return null;
    return dTagToOsmId(dTag[1]);
}

/**
 * Parse all image URLs from event tags (multiple "image" tags supported)
 */
export function parseImagesFromTags(tags: string[][]): string[] {
    return tags
        .filter(t => t[0] === "image" && t[1])
        .map(t => t[1]);
}

/**
 * @deprecated Use parseImagesFromTags for multiple image support
 * Parse single image URL from event tags (for backwards compatibility)
 */
export function parseImageFromTags(tags: string[][]): string | null {
    const imageTag = tags.find(t => t[0] === "image");
    return imageTag?.[1] || null;
}

/**
 * Create tags for a review event
 */
export function createReviewTags(
    osmId: string,
    rating?: number,
    geohash?: string,
    imageUrls?: string[]
): string[][] {
    const tags: string[][] = [
        ["d", osmIdToDTag(osmId)],
        ["t", "review"],
    ];

    if (rating !== undefined && rating >= 1 && rating <= 5) {
        tags.push(["rating", rating.toString()]);
    }

    if (geohash) {
        tags.push(["g", geohash]);
    }

    // Add multiple image tags
    if (imageUrls && imageUrls.length > 0) {
        for (const url of imageUrls) {
            tags.push(["image", url]);
        }
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
        ["d", osmIdToDTag(osmId)],
    ];
}

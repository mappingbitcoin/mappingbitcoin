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
 * Event Formats
 *
 * Review (kind 38381) — addressable by (author, "osm:node:123456")
 *   tags:
 *     ["d",      "osm:node:123456"]       addressable key
 *     ["i",      "osm:node/123456"]       venue reference (query via #i)
 *     ["t",      "review"]                category
 *     ["rating", "1"–"5"]                 optional star rating
 *     ["g",      "<geohash9>"]            chained geohash (9→3 chars)
 *     ["g",      "<geohash8>"]
 *     ...
 *     ["g",      "<geohash3>"]
 *     ["image",  "<url>"]                 optional, repeatable (Blossom)
 *   content: review text (markdown)
 *
 * Reply (kind 38382) — addressable by (author, review_event_id)
 *   tags:
 *     ["d", "<review_event_id>"]          addressable key (one reply per review)
 *     ["e", "<review_event_id>"]          parent review reference
 *     ["p", "<review_author_pubkey>"]     parent review author
 *     ["i", "osm:node/123456"]            venue reference (query via #i)
 *     ["g", "<geohash9>"]                 chained geohash (9→3 chars)
 *     ...
 *     ["g", "<geohash3>"]
 *   content: reply text
 */

/**
 * Produce chained geohash tags at decreasing precision for geographic discovery.
 * e.g. "u09tunq6x" → [["g","u09tunq6x"],["g","u09tunq6"],…,["g","u09"]]
 */
function geohashChain(geohash: string, minLength = 3): string[][] {
    const tags: string[][] = [];
    for (let len = geohash.length; len >= minLength; len--) {
        tags.push(["g", geohash.slice(0, len)]);
    }
    return tags;
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
        ["i", `osm:${osmId}`],
        ["t", "review"],
    ];

    if (rating !== undefined && rating >= 1 && rating <= 5) {
        tags.push(["rating", rating.toString()]);
    }

    if (geohash) {
        tags.push(...geohashChain(geohash));
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
 * Create tags for a review reply event.
 * The d tag is the review event ID so each (author, review) pair is
 * addressable — the owner can edit their reply while having separate
 * replies for different reviews.
 * The i tag carries the OSM reference so relays can filter all review
 * activity (reviews + replies) for a venue via #i.
 */
export function createReviewReplyTags(
    reviewEventId: string,
    reviewAuthorPubkey: string,
    osmId: string,
    geohash?: string,
): string[][] {
    const tags: string[][] = [
        ["d", reviewEventId],
        ["e", reviewEventId],
        ["p", reviewAuthorPubkey],
        ["i", `osm:${osmId}`],
    ];

    if (geohash) {
        tags.push(...geohashChain(geohash));
    }

    return tags;
}

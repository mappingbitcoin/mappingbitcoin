/**
 * Nostr Configuration
 *
 * Central configuration for all Nostr-related operations
 */

// Primary relays for publishing and fetching
// Our own relay is first for priority
export const NOSTR_RELAYS = [
    "wss://relay.mappingbitcoin.com",
    "wss://relay.damus.io",
    "wss://relay.nostr.band",
    "wss://nos.lol",
    "wss://relay.primal.net",
] as const;

// Timeouts for relay operations
export const RELAY_CONNECT_TIMEOUT_MS = 5000;
export const RELAY_PUBLISH_TIMEOUT_MS = 10000;
export const RELAY_FETCH_TIMEOUT_MS = 15000;

// Export type for relay URLs
export type NostrRelay = (typeof NOSTR_RELAYS)[number];

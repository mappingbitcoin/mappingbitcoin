# Nostr Integration

MappingBitcoin integrates with the Nostr protocol for decentralized identity, reviews, and social features.

## What is Nostr?

Nostr (Notes and Other Stuff Transmitted by Relays) is a decentralized protocol for social communication. It provides:

- **Censorship resistance** - No central authority can remove content
- **User ownership** - You control your identity with cryptographic keys
- **Interoperability** - Works across multiple clients and relays
- **Transparency** - All actions are publicly verifiable

## Authentication

Users can log in to MappingBitcoin using their Nostr identity.

| Method | Description |
|--------|-------------|
| NIP-07 Extension | Alby, nos2x, Flamingo, and other browser extensions |
| Private Key (nsec) | Direct nsec input (keys never leave your browser) |
| NIP-46 Bunker | Remote signing via Nostr Connect |

Your Nostr identity is used for reviews, verification, and all social features on the platform.

## Reviews & Ratings

Reviews are published as Nostr events, making them decentralized and portable.

| Feature | Description |
|---------|-------------|
| Star Ratings | 1-5 star ratings for venues |
| Text Reviews | Optional written feedback |
| Image Attachments | Up to 5 images per review via Blossom |
| Owner Replies | Verified venue owners can respond |

Reviews are stored on Nostr relays and indexed locally for fast querying. Your reviews belong to you, not the platform.

See [Reviews](/docs/reviews) for detailed documentation.

## Web of Trust

Reviews are weighted by Web of Trust (WoT) distance to provide Sybil-resistant ratings.

| Feature | Description |
|---------|-------------|
| Trust Scoring | Reviews weighted by community trust |
| WoT Distance | Visual badges show connection to trust network |
| Spam Resistance | Low-trust reviews have minimal impact on ratings |
| Filtering | Filter reviews by trust level |

See [Web of Trust](/docs/web-of-trust) for detailed documentation.

## Venue Announcements

When venues are added or verified, announcements are published to Nostr.

### New Venue Announcements

| Event | Description |
|-------|-------------|
| Trigger | New venue submitted via the platform |
| Content | Venue name, location, and payment methods |
| Visibility | Public on Nostr relays |
| Purpose | Spread awareness of new Bitcoin merchants |

### Verification Announcements

| Event | Description |
|-------|-------------|
| Trigger | Successful email or domain verification |
| Content | Venue name, verification method, owner pubkey |
| Visibility | Public on Nostr relays |
| Purpose | Build trust and social proof |

## Custom Event Kinds

MappingBitcoin uses custom Nostr event kinds in the addressable replaceable range:

| Kind | Purpose | Description |
|------|---------|-------------|
| 38381 | Venue Reviews | Star ratings (1-5) with optional text and images |
| 38382 | Review Replies | Responses from verified venue owners only |
| 38383 | Venue Claims | Business ownership verification claims |

## Why Nostr?

| Benefit | Description |
|---------|-------------|
| Decentralization | No single point of failure or control |
| Ownership | Users own their data and identity |
| Transparency | All actions are publicly verifiable |
| Interoperability | Data accessible from any Nostr client |
| Bitcoin Alignment | Shares values with the Bitcoin community |

Nostr aligns perfectly with the Bitcoin ethos of decentralization and user sovereignty.

# Nostr Integration

MappingBitcoin.com integrates with the Nostr protocol for decentralized social features and announcements.

## What is Nostr?

Nostr (Notes and Other Stuff Transmitted by Relays) is a decentralized protocol for social communication. It provides:

- **Censorship resistance** - No central authority can remove content
- **User ownership** - You control your identity with cryptographic keys
- **Interoperability** - Works across multiple clients and relays
- **Transparency** - All announcements are publicly verifiable

## Current Integrations

### New Venue Announcements

When a new Bitcoin-accepting venue is added to the platform, it's automatically announced on Nostr.

| Event | Description |
|-------|-------------|
| Trigger | New venue submitted via the platform |
| Content | Venue name, location, and payment methods |
| Visibility | Public on Nostr relays |
| Purpose | Spread awareness of new Bitcoin merchants |

This helps the Bitcoin community discover new places to spend their sats in real-time.

### Verification Announcements

When a business owner verifies their venue, we announce it on Nostr.

| Event | Description |
|-------|-------------|
| Trigger | Successful email or domain verification |
| Content | Venue name, verification method, owner pubkey |
| Visibility | Public on Nostr relays |
| Purpose | Build trust and social proof |

Verification announcements create an immutable record of ownership claims that anyone can verify.

### Authentication

Users can log in to MappingBitcoin.com using their Nostr identity.

| Feature | Description |
|---------|-------------|
| Method | NIP-07 browser extension |
| Extensions | Alby, nos2x, Flamingo, etc. |
| Benefits | No password needed, use existing identity |
| Used for | Verification, comments, reviews |

## Coming Soon

We're expanding Nostr integration to include more social features:

### Comments

> **In Development**

- Leave comments on venue pages
- Comments stored on Nostr relays
- Portable across Nostr clients
- Tied to your Nostr identity

### Reviews

> **In Development**

- Detailed venue reviews
- Stored as Nostr events
- Verifiable authorship
- Discoverable across the Nostr ecosystem

### Ratings

> **Planned**

- Rate venues on multiple criteria
- Aggregate ratings from Nostr events
- Sybil-resistant through web of trust
- Transparent scoring methodology

### Reports

> **Planned**

- Report closed or incorrect venues
- Community-driven data quality
- Transparent moderation
- Appeals via Nostr

## Technical Details

### Event Types

| Feature | Nostr Kind | Status |
|---------|------------|--------|
| Announcements | Custom | Active |
| Authentication | NIP-07 | Active |
| Comments | TBD | Planned |
| Reviews | TBD | Planned |
| Ratings | TBD | Planned |

### Relay Configuration

Announcements are published to multiple relays for redundancy and reach.

### Bot Account

The MappingBitcoin.com bot publishes announcements from a dedicated Nostr account. Follow it to stay updated on new Bitcoin venues worldwide.

## Why Nostr?

| Benefit | Description |
|---------|-------------|
| Decentralization | No single point of failure or control |
| Ownership | Users own their data and identity |
| Transparency | All actions are publicly verifiable |
| Interoperability | Data accessible from any Nostr client |
| Bitcoin Alignment | Shares values with the Bitcoin community |

Nostr aligns perfectly with the Bitcoin ethos of decentralization and user sovereignty.

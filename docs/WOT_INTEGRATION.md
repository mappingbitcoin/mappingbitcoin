# Web of Trust (WoT) Integration

This document explains how Web of Trust works in MappingBitcoin, both from a user perspective and technical implementation details.

## Table of Contents

1. [What is Web of Trust?](#what-is-web-of-trust)
2. [How WoT Works in MappingBitcoin](#how-wot-works-in-mappingbitcoin)
3. [User Guide](#user-guide)
4. [Technical Architecture](#technical-architecture)
5. [WoT Oracle](#wot-oracle)
6. [Database Schema](#database-schema)
7. [API Reference](#api-reference)
8. [Scripts & Maintenance](#scripts--maintenance)
9. [Configuration](#configuration)

---

## What is Web of Trust?

Web of Trust (WoT) is a decentralized trust model based on social connections. Instead of relying on a central authority to verify identities, trust is derived from your personal social graph.

**Key Concept: "Distance" or "Hops"**

In Nostr, when you follow someone, you create a direct connection (1 hop). When that person follows someone else, they're 2 hops away from you. The fewer hops between you and another person, the closer they are in your trust network.

```
You ──follows──> Alice ──follows──> Bob ──follows──> Carol
     (1 hop)           (2 hops)          (3 hops)
```

**Why WoT Matters for Reviews**

- Reviews from people you follow (1 hop) are more trustworthy to you
- Spam accounts typically have no connections to legitimate users
- WoT helps surface reviews from real community members
- It's censorship-resistant - no central authority decides who's "trusted"

---

## How WoT Works in MappingBitcoin

MappingBitcoin uses the **Mapping Bitcoin Bot** as the root of trust for the community. The bot follows trusted community members (seeders), and trust flows outward from there.

### The Trust Model

```
                    ┌─────────────────────┐
                    │ Mapping Bitcoin Bot │
                    │    (Root of Trust)  │
                    └─────────────────────┘
                              │
                              │ follows
                              ▼
              ┌───────────────────────────────┐
              │         Community Seeders      │
              │  (Trusted Bitcoin advocates)   │
              │        Distance: 1 hop         │
              └───────────────────────────────┘
                              │
                              │ follows
                              ▼
              ┌───────────────────────────────┐
              │      Active Community Members  │
              │        Distance: 2 hops        │
              └───────────────────────────────┘
                              │
                              │ follows
                              ▼
              ┌───────────────────────────────┐
              │         Extended Network       │
              │        Distance: 3+ hops       │
              └───────────────────────────────┘
```

### WoT Distance Levels

| Distance | Label | Meaning | Trust Level |
|----------|-------|---------|-------------|
| 0 | You | The reviewer is you | Highest |
| 1 | Direct | Bot follows this person directly | Very High |
| 2 | 2nd | Friend of a bot-followed person | High |
| 3 | 3rd | 3 connections away | Medium |
| 4+ | 4+ | Distant connection | Low |
| null | Unknown | No path found to trust network | Unknown |

---

## User Guide

### Understanding WoT Badges

When viewing reviews, you'll see WoT badges next to reviewers:

- **Direct** (emerald) - This person is directly followed by the Mapping Bitcoin bot
- **2nd** (yellow) - This person is followed by someone the bot follows
- **3rd** (orange) - 3 hops away from the bot
- **Unknown** (gray, dashed) - No connection found to the trust network

### Filtering Reviews by WoT

On venue pages, you can filter reviews by WoT distance:

1. **All Reviews** - Shows all reviews regardless of WoT connection
2. **Trusted (3 hops)** - Shows only reviews from people within 3 hops
3. **Close (2 hops)** - Shows only reviews from direct or second-degree connections

### Sorting by WoT

You can sort reviews by:
- **Trust Score** - Internal trust score (default)
- **WoT Distance** - Closest connections first
- **Most Recent** - Newest reviews first

### Why Some Reviews Show "Unknown"

A review shows "Unknown" WoT when:
- The reviewer has no Nostr followers/following
- The reviewer is completely disconnected from the Bitcoin/Nostr community
- The WoT computation hasn't been performed yet
- The WoT oracle couldn't find a path

This doesn't mean the review is fake - it just means we couldn't verify a trust path.

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           WoT System                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐    │
│  │  Review Indexed │────▶│  WoT Oracle     │────▶│  Database       │    │
│  │  (API/Listener) │     │  Query          │     │  Update         │    │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘    │
│                                 │                                        │
│                                 ▼                                        │
│                    ┌─────────────────────────────┐                       │
│                    │   WoT Oracle Server         │                       │
│                    │   wot-oracle.mappingbitcoin │                       │
│                    │   .com                      │                       │
│                    └─────────────────────────────┘                       │
│                                 │                                        │
│                                 ▼                                        │
│                    ┌─────────────────────────────┐                       │
│                    │   Nostr Relay Network       │                       │
│                    │   (kind 3 contact lists)    │                       │
│                    └─────────────────────────────┘                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Review Submission**
   - User submits a review
   - Review is indexed in the database
   - WoT distance is computed for the author

2. **WoT Computation**
   - Query WoT oracle with bot pubkey and author pubkey
   - Oracle returns: hops (distance), pathCount, mutual
   - Store in Review record: wotDistance, wotPathCount, wotComputedAt

3. **Display**
   - WoTBadge component renders based on distance
   - ReviewList supports filtering/sorting by WoT

### Components

| Component | Purpose |
|-----------|---------|
| `lib/wot/oracleClient.ts` | API client for WoT oracle |
| `components/reviews/WoTBadge.tsx` | Visual badge component |
| `components/reviews/ReviewList.tsx` | List with WoT filtering |
| `app/api/wot/distance/route.ts` | Public WoT API endpoint |
| `scripts/recomputeWoT.ts` | Backfill/refresh WoT data |

---

## WoT Oracle

The WoT Oracle is a separate service that computes trust distances by analyzing Nostr kind 3 (contact list) events.

### Oracle URL

```
https://wot-oracle.mappingbitcoin.com
```

### Endpoints

**GET /distance**

Compute distance between two pubkeys.

```http
GET /distance?from={source_pubkey}&to={target_pubkey}
```

Response:
```json
{
  "hops": 2,
  "pathCount": 3,
  "mutual": false
}
```

**POST /distance/batch**

Compute distances for multiple targets at once.

```http
POST /distance/batch
Content-Type: application/json

{
  "from": "source_pubkey_hex",
  "targets": ["pubkey1", "pubkey2", "pubkey3"]
}
```

Response:
```json
{
  "results": [
    {"pubkey": "pubkey1", "hops": 1, "pathCount": 1, "mutual": true},
    {"pubkey": "pubkey2", "hops": 3, "pathCount": 5, "mutual": false},
    {"pubkey": "pubkey3", "hops": null, "pathCount": 0, "mutual": false}
  ]
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `hops` | number \| null | Number of hops (null = unreachable) |
| `pathCount` | number | Number of distinct paths found |
| `mutual` | boolean | Whether both follow each other |

---

## Database Schema

### Review Model (WoT fields)

```prisma
model Review {
    // ... other fields ...

    // Web of Trust
    wotDistance    Int?       @map("wot_distance")     // Hops from bot
    wotPathCount   Int?       @map("wot_path_count")   // Paths found
    wotComputedAt  DateTime?  @map("wot_computed_at")  // Computation time
}
```

### User Model (cached WoT)

```prisma
model User {
    // ... other fields ...

    // Web of Trust cache
    wotDistance    Int?       @map("wot_distance")
    wotComputedAt  DateTime?  @map("wot_computed_at")
}
```

---

## API Reference

### GET /api/wot/distance

Public endpoint to check WoT distance for any pubkey.

**Request:**
```http
GET /api/wot/distance?pubkey=abc123...
```

**Response:**
```json
{
  "pubkey": "abc123...",
  "distance": 2,
  "pathCount": 3,
  "mutual": false,
  "fromPubkey": "def456...",
  "source": "oracle"
}
```

**Error Response:**
```json
{
  "error": "Invalid pubkey format"
}
```

### Internal: oracleClient.ts

```typescript
// Single pubkey query
const result = await getWoTDistance(targetPubkey);
// result: { hops: 2, pathCount: 3, mutual: false }

// Batch query (more efficient for multiple pubkeys)
const results = await getWoTDistanceBatch(["pubkey1", "pubkey2"]);
// results: Map<string, WoTDistanceResult>
```

---

## Scripts & Maintenance

### Recompute WoT Data

The `recomputeWoT.ts` script updates WoT data for existing reviews.

```bash
# Reviews without WoT data
npm run recompute:wot

# All reviews (force refresh)
npm run recompute:wot -- --all

# Stale data (older than 24 hours)
npm run recompute:wot -- --stale
```

**When to use:**

- After adding new seeders to the bot's follow list
- After initial setup to backfill existing reviews
- Periodically to refresh stale data
- When WoT oracle has been updated

### Bot Follow Management

To add follows to the Mapping Bitcoin bot's contact list:

```bash
# Add a pubkey to bot's follows
npm run bot:follow -- npub1...

# Or with hex pubkey
npm run bot:follow -- abc123...
```

This updates the bot's kind 3 event, which affects WoT distances for everyone.

---

## Configuration

### Environment Variables

```env
# WoT Oracle URL
WOT_ORACLE_URL=https://wot-oracle.mappingbitcoin.com

# Bot private key (for computing "from" pubkey)
MAPPING_BITCOIN_BOT_PRIVATE_KEY=nsec1...
```

### Timeouts

| Operation | Timeout |
|-----------|---------|
| Single distance query | 5 seconds |
| Batch distance query | 30 seconds |

### Rate Limits

The WoT oracle has rate limiting. For bulk operations, use:
- Batch queries instead of individual queries
- Delays between batches (1 second recommended)
- The `recomputeWoT.ts` script handles this automatically

---

## Troubleshooting

### WoT Shows "Unknown" for All Reviews

1. Check if `WOT_ORACLE_URL` is configured
2. Verify the oracle is accessible
3. Run `npm run recompute:wot` to backfill data

### WoT Data Not Updating

1. Check `wotComputedAt` timestamps in database
2. Run with `--stale` flag to refresh old data
3. Verify network connectivity to oracle

### High WoT Distances

If many users show high distances (4+):
1. Consider adding more seeders to the bot's follow list
2. Encourage community members to follow each other
3. This is normal for new or isolated accounts

---

## Future Enhancements

- **Personal WoT**: Use user's own follow graph via browser extension
- **Mutual follows**: Weight reviews higher when mutual follows exist
- **Path visualization**: Show the trust path graphically
- **WoT in spam scoring**: Factor WoT into automatic spam detection

# Web of Trust (WoT) Integration Design

## Overview

Integrate `nostr-wot-sdk` to provide Web of Trust scoring for reviews. Users with the WoT browser extension see personalized trust scores based on their own follow graph. Users without the extension see scores computed by the backend oracle relative to the Mapping Bitcoin bot's pubkey.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
├─────────────────────────────────────────────────────────────┤
│  ReviewCard / ReviewList                                     │
│    ├── useWoT() hook checks for extension via nostr-wot-sdk │
│    │     ├── Extension available → getTrustScore(pubkey)    │
│    │     └── No extension → use backend wotDistance          │
│    └── WoTBadge displays score + source indicator           │
│                                                              │
│  Filter Controls                                             │
│    ├── "Show trusted only" toggle (≤3 hops)                 │
│    └── Sort by WoT distance option                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
├─────────────────────────────────────────────────────────────┤
│  Review Listener (scripts/reviewListener.ts)                 │
│    └── On new review:                                        │
│          1. Call wot-oracle.mappingbitcoin.com               │
│          2. GET /distance?from=BOT_PUBKEY&to=REVIEWER        │
│          3. Store wotDistance in reviews table               │
│                                                              │
│  Cron Job (scripts/recomputeWoT.ts)                         │
│    └── Daily recomputation of all reviewer distances        │
│                                                              │
│  API Endpoint                                                │
│    └── GET /api/wot/distance?pubkey={pubkey}                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              wot-oracle.mappingbitcoin.com                   │
│    GET /distance?from={botPubkey}&to={reviewerPubkey}       │
│    Returns: { hops, pathCount, mutual }                      │
└─────────────────────────────────────────────────────────────┘
```

## Data Model

### Database Schema Changes

Add columns to `reviews` table:
```prisma
model Review {
  // ... existing fields ...

  wotDistance    Int?      // Hops from bot pubkey (null = unreachable/not computed)
  wotPathCount   Int?      // Number of paths found
  wotComputedAt  DateTime? // When oracle score was computed
}
```

Add to `users` table for caching:
```prisma
model User {
  // ... existing fields ...

  wotDistance    Int?      // Cached distance from bot
  wotComputedAt  DateTime? // When computed
}
```

### Environment Variables

```env
WOT_ORACLE_URL=https://wot-oracle.mappingbitcoin.com
MAPPING_BITCOIN_BOT_PUBKEY=<derived from MAPPING_BITCOIN_BOT_PRIVATE_KEY>
```

## API Design

### GET /api/wot/distance

Query WoT distance for a pubkey (with caching).

**Request:**
```
GET /api/wot/distance?pubkey=abc123...
```

**Response:**
```json
{
  "pubkey": "abc123...",
  "distance": 2,
  "pathCount": 5,
  "computedAt": "2026-02-19T12:00:00Z",
  "source": "oracle"
}
```

### Reviews API Enhancement

`GET /api/places/[slug]/reviews` now includes:
```json
{
  "reviews": [
    {
      "eventId": "...",
      "authorPubkey": "...",
      "rating": 5,
      "content": "...",
      "wotDistance": 2,
      "wotPathCount": 5,
      "trustScore": 0.4
    }
  ]
}
```

## Frontend Components

### useWoT Hook

```typescript
interface UseWoTResult {
  isExtensionAvailable: boolean;
  source: 'extension' | 'oracle';
  getDistance: (pubkey: string) => Promise<number | null>;
  getDistanceBatch: (pubkeys: string[]) => Promise<Map<string, number | null>>;
  filterTrusted: <T extends { authorPubkey: string }>(
    items: T[],
    maxHops: number
  ) => Promise<T[]>;
}
```

### WoTBadge Component

Visual indicator showing:
- **0 hops**: "You" or "Bot" (green)
- **1 hop**: "Direct" (emerald)
- **2 hops**: "Friend of friend" (yellow)
- **3+ hops**: "Distant" (gray)
- **null**: "Unknown" (gray, dashed)

Shows source indicator: small icon for extension vs oracle.

### Filter Controls

- Toggle: "Show trusted only" (filters to ≤3 hops)
- Dropdown: Sort by "Most trusted" | "Most recent" | "Highest rated"

## Backend Services

### WoT Oracle Client

```typescript
// lib/wot/oracleClient.ts
export async function getWoTDistance(
  targetPubkey: string,
  fromPubkey?: string // defaults to bot pubkey
): Promise<{ hops: number | null; pathCount: number }>;

export async function getWoTDistanceBatch(
  targetPubkeys: string[],
  fromPubkey?: string
): Promise<Map<string, { hops: number | null; pathCount: number }>>;
```

### Review Listener Integration

In `processEvent()`:
1. After indexing review, call `getWoTDistance(authorPubkey)`
2. Update review with `wotDistance`, `wotPathCount`, `wotComputedAt`

### Cron Job: Recompute WoT

```typescript
// scripts/recomputeWoT.ts
// Runs daily via PM2 cron or external scheduler
// 1. Get all unique reviewer pubkeys
// 2. Batch query oracle
// 3. Update reviews and users tables
```

## Trust Score Integration

The existing `trustScore` (0-1) from the seeder graph remains separate from WoT distance. Both are displayed:

- **Trust Badge**: Existing seeder-based score (Seeder/Trusted/Known/New)
- **WoT Badge**: New distance-based indicator (Direct/2-hop/3-hop/Unknown)

Users can filter/sort by either metric.

## Implementation Stages

### Stage 1: Backend Oracle Integration
- Create `lib/wot/oracleClient.ts`
- Add Prisma schema changes
- Update review listener to compute WoT on indexing

### Stage 2: API Updates
- Create `GET /api/wot/distance` endpoint
- Update reviews API to include WoT data

### Stage 3: Frontend SDK Integration
- Install `nostr-wot-sdk`
- Create `useWoT` hook with extension detection
- Create `WoTBadge` component

### Stage 4: UI Integration
- Add WoT badges to ReviewCard
- Add filter/sort controls to ReviewList
- Handle loading states for extension queries

### Stage 5: Cron Job
- Create `scripts/recomputeWoT.ts`
- Add to PM2 configuration

## Dependencies

- `nostr-wot-sdk` - npm package for extension integration
- `wot-oracle.mappingbitcoin.com` - Backend oracle service

## Success Criteria

- [ ] Reviews display WoT distance badges
- [ ] Extension users see personalized scores
- [ ] Non-extension users see bot-relative scores
- [ ] Filter by trusted reviewers works
- [ ] New reviews automatically get WoT scores
- [ ] Daily recomputation keeps scores fresh

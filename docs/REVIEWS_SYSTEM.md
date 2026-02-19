# Reviews & Ratings System Documentation

This document describes the complete reviews system for MappingBitcoin, including ratings, reviews, replies, image uploads, and the background indexing listener.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Nostr Event Structure](#nostr-event-structure)
4. [Database Schema](#database-schema)
5. [Review Submission Flow](#review-submission-flow)
6. [Image Upload System](#image-upload-system)
7. [Trust-Weighted Ratings](#trust-weighted-ratings)
8. [Web of Trust Integration](#web-of-trust-integration)
9. [Review Listener](#review-listener)
10. [API Reference](#api-reference)
11. [Component Reference](#component-reference)

> **See also:** [WOT_INTEGRATION.md](./WOT_INTEGRATION.md) for detailed Web of Trust documentation.

---

## Overview

The reviews system allows users to rate and review Bitcoin-accepting venues. Reviews are published as Nostr events, providing decentralization and censorship resistance, while being indexed in a PostgreSQL database for fast querying and trust-weighted sorting.

**Key Features:**
- Star ratings (1-5)
- Text content with markdown support
- Multiple image attachments (up to 5)
- Reply functionality
- Trust-weighted rating aggregation
- Spam filtering and moderation
- Real-time indexing via Nostr relay listener

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  ReviewForm.tsx                                                          │
│  ├─ Star rating selector                                                 │
│  ├─ Text content input                                                   │
│  └─ Image upload (useBlossomUpload)                                      │
│         │                                                                │
│         ▼                                                                │
│  ┌──────────────┐                                                        │
│  │ Blossom      │ ◄── Upload original images (NIP-07/nsec signed)        │
│  │ Servers      │                                                        │
│  └──────────────┘                                                        │
│         │                                                                │
│         ▼ (image URLs)                                                   │
│  useNostrPublish.ts                                                      │
│  ├─ Create kind 38381 event                                              │
│  ├─ Sign (extension/nsec/bunker)                                         │
│  └─ Publish to Nostr relays                                              │
│         │                                                                │
│         ├──────────────────────────┐                                     │
│         ▼                          ▼                                     │
│  ┌──────────────┐           ┌──────────────┐                             │
│  │ Nostr        │           │ POST /api/   │ ◄── Immediate indexing      │
│  │ Relays       │           │ reviews/index│                             │
│  └──────────────┘           └──────────────┘                             │
│         │                          │                                     │
└─────────│──────────────────────────│─────────────────────────────────────┘
          │                          │
          ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              SERVER                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  reviewListener.ts (Background)                                          │
│  ├─ Subscribe to relays                                                  │
│  ├─ Parse kind 38381/38382 events                                        │
│  ├─ Process images → Hetzner                                             │
│  └─ Index to database                                                    │
│         │                                                                │
│         ▼                                                                │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐              │
│  │ PostgreSQL   │ ◄───│ reviews.ts   │ ◄───│ Spam Filter  │              │
│  │ Database     │     │ (services)   │     │              │              │
│  └──────────────┘     └──────────────┘     └──────────────┘              │
│         │                                                                │
│         ▼                                                                │
│  ┌──────────────┐                                                        │
│  │ Hetzner      │ ◄── Optimized WebP thumbnails                          │
│  │ Storage      │                                                        │
│  └──────────────┘                                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Nostr Event Structure

### Review Event (kind 38381)

Reviews are published as addressable Nostr events.

```json
{
  "kind": 38381,
  "pubkey": "<author_pubkey_hex>",
  "created_at": 1699999999,
  "tags": [
    ["d", "node/123456789"],
    ["rating", "4"],
    ["g", "u4pruydqqvj"],
    ["t", "review"],
    ["image", "https://blossom.primal.net/<hash1>"],
    ["image", "https://blossom.primal.net/<hash2>"]
  ],
  "content": "Great coffee and they accept Bitcoin via Lightning! Fast service.",
  "id": "<event_id>",
  "sig": "<signature>"
}
```

**Tag Definitions:**

| Tag | Required | Description |
|-----|----------|-------------|
| `d` | Yes | OSM ID in format `node/123456` or `way/789` |
| `rating` | No* | Star rating 1-5 |
| `g` | No | Geohash for location filtering |
| `t` | No | Category tag (always "review") |
| `image` | No | Blossom URL for attached image (can have multiple) |

*Either rating or content must be present

### Review Reply Event (kind 38382)

```json
{
  "kind": 38382,
  "pubkey": "<replier_pubkey_hex>",
  "created_at": 1700000000,
  "tags": [
    ["e", "<parent_review_event_id>"],
    ["p", "<parent_review_author_pubkey>"],
    ["d", "node/123456789"]
  ],
  "content": "Thank you for the kind review!",
  "id": "<event_id>",
  "sig": "<signature>"
}
```

**Tag Definitions:**

| Tag | Required | Description |
|-----|----------|-------------|
| `e` | Yes | Parent review event ID |
| `p` | Yes | Parent review author pubkey |
| `d` | No | OSM ID for context |

---

## Database Schema

### Review Model

```prisma
model Review {
    id              String       @id @default(cuid())
    eventId         String       @unique @map("event_id")
    venue           Venue        @relation(fields: [venueId], references: [id])
    venueId         String       @map("venue_id")
    author          User?        @relation(fields: [authorPubkey], references: [pubkey])
    authorPubkey    String       @map("author_pubkey")
    rating          Int?         // 1-5, null if text-only review
    content         String?
    eventCreatedAt  DateTime     @map("event_created_at")
    indexedAt       DateTime     @default(now()) @map("indexed_at")

    // Multiple image support
    imageUrls       String[]     @default([]) @map("image_urls")
    thumbnailUrls   String[]     @default([]) @map("thumbnail_urls")
    thumbnailKeys   String[]     @default([]) @map("thumbnail_keys")

    // Web of Trust (computed from WoT Oracle)
    wotDistance     Int?         @map("wot_distance")     // Hops from bot pubkey
    wotPathCount    Int?         @map("wot_path_count")   // Number of paths found
    wotComputedAt   DateTime?    @map("wot_computed_at")  // When computed

    // Spam filtering
    spamScore       Float?       @map("spam_score")
    spamStatus      SpamStatus   @default(PENDING) @map("spam_status")
    spamReasons     String[]     @default([]) @map("spam_reasons")

    replies         ReviewReply[]
}

enum SpamStatus {
    PENDING   // Awaiting moderation
    APPROVED  // Manually or auto-approved
    FLAGGED   // Flagged for review
    BLOCKED   // Blocked as spam
}
```

### ReviewReply Model

```prisma
model ReviewReply {
    id              String   @id @default(cuid())
    eventId         String   @unique @map("event_id")
    review          Review   @relation(fields: [reviewId], references: [id])
    reviewId        String   @map("review_id")
    author          User?    @relation(fields: [authorPubkey], references: [pubkey])
    authorPubkey    String   @map("author_pubkey")
    content         String
    isOwnerReply    Boolean  @default(false) @map("is_owner_reply")
    eventCreatedAt  DateTime @map("event_created_at")
    indexedAt       DateTime @default(now()) @map("indexed_at")
}
```

---

## Review Submission Flow

### 1. User Interface (ReviewForm.tsx)

```
User opens review form
         │
         ▼
┌─────────────────────┐
│ Check authentication │
│ - Logged in?         │
│ - Write mode?        │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Fill review form     │
│ - Select stars (1-5) │
│ - Enter text         │
│ - Upload images      │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Submit review        │
└─────────────────────┘
```

### 2. Image Upload (useBlossomUpload.ts)

For each image:
1. Validate file type (JPEG, PNG, GIF, WebP)
2. Validate file size (max 5MB)
3. Calculate SHA-256 hash
4. Create Blossom auth event (kind 24242)
5. Sign auth event based on auth method:
   - **Extension**: `window.nostr.signEvent()`
   - **nsec**: Local signing with stored private key
   - **Bunker**: Attempt via injected `window.nostr` or show error
6. Upload to Blossom servers (tries multiple servers)
7. Return Blossom URL

### 3. Event Publishing (useNostrPublish.ts)

```typescript
const event = {
    kind: 38381,
    tags: createReviewTags(osmId, rating, geohash, imageUrls),
    content: reviewText,
};

// Sign based on auth method
const signedEvent = await signEvent(event);

// Publish to relays
await publishToRelays(signedEvent);
```

### 4. Immediate Indexing (useReviews.ts → API)

After publishing to relays, the client immediately calls the indexing API:

```typescript
await fetch("/api/reviews/index", {
    method: "POST",
    body: JSON.stringify({
        type: "review",
        eventId: signedEvent.id,
        osmId,
        authorPubkey: user.pubkey,
        rating,
        content,
        eventCreatedAt: signedEvent.created_at,
        imageUrls,
    }),
});
```

This provides instant feedback without waiting for the relay listener.

### 5. Optimistic UI Update

The client immediately adds the review to the local state:

```typescript
const newReview: ReviewWithTrust = {
    id: signedEvent.id,
    eventId: signedEvent.id,
    authorPubkey: user.pubkey,
    rating,
    content,
    trustScore: 0.02, // Default, corrected on refetch
    imageUrls,
    thumbnailUrls, // From indexing response
    // ...
};

setReviews(prev => [newReview, ...prev]);
```

---

## Image Upload System

### Storage Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Original Image  │     │ Thumbnail       │     │ Database        │
│ (Blossom)       │────▶│ (Hetzner)       │────▶│ (PostgreSQL)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
     Full size           400px WebP 80%          URLs + Keys
     Decentralized       Optimized CDN           Queryable
```

### Blossom Upload Flow

Blossom is a decentralized media hosting protocol for Nostr.

**Supported Servers:**
- `https://blossom.primal.net`
- `https://blossom.oxtr.dev`
- `https://cdn.satellite.earth`
- `https://blossom.nostr.hu`

**Auth Event (kind 24242):**
```json
{
  "kind": 24242,
  "created_at": 1700000000,
  "tags": [
    ["t", "upload"],
    ["x", "<sha256_hash_of_file>"],
    ["expiration", "1700000300"]
  ],
  "content": "Upload review image"
}
```

**Upload Request:**
```http
PUT /upload HTTP/1.1
Host: blossom.primal.net
Content-Type: image/jpeg
Authorization: Nostr <base64_encoded_signed_event>
X-SHA-256: <file_hash>

<binary_image_data>
```

### Thumbnail Processing

When a review is indexed (via API or listener):

1. **Fetch** original from Blossom URL
2. **Validate** content-type is image
3. **Process** with Sharp:
   ```typescript
   sharp(imageBuffer)
       .resize(400, null, { fit: "inside", withoutEnlargement: true })
       .webp({ quality: 80 })
       .toBuffer()
   ```
4. **Upload** to Hetzner Object Storage
5. **Store** URLs in database:
   - `imageUrls[]` - Original Blossom URLs
   - `thumbnailUrls[]` - Optimized Hetzner URLs
   - `thumbnailKeys[]` - Storage keys for management

**Thumbnail Settings:**
- Max width: 400px
- Format: WebP
- Quality: 80%
- Cache: 1 year (`public, max-age=31536000`)

---

## Trust-Weighted Ratings

### Trust Score System

Reviews are weighted by the author's trust score in the MappingBitcoin web of trust.

**Trust Levels:**

| Score | Level | Description | Badge Color |
|-------|-------|-------------|-------------|
| ≥ 1.0 | Seeder | Community seeders | Green |
| ≥ 0.4 | Trusted | Followed by seeders | Emerald |
| ≥ 0.1 | Known | 2nd-degree connections | Yellow |
| < 0.1 | New | Not connected to trust network | Gray |

### Weighted Average Calculation

```typescript
function calculateWeightedAverage(reviews: ReviewWithTrust[]): number {
    const reviewsWithRating = reviews.filter(r => r.rating !== null);

    const totalWeight = reviewsWithRating.reduce(
        (sum, r) => sum + r.trustScore, 0
    );

    const weightedSum = reviewsWithRating.reduce(
        (sum, r) => sum + (r.rating * r.trustScore), 0
    );

    return weightedSum / totalWeight;
}
```

**Example:**

| Reviewer | Rating | Trust Score | Weighted Contribution |
|----------|--------|-------------|----------------------|
| Alice | 5 | 1.0 (Seeder) | 5.0 |
| Bob | 4 | 0.5 (Trusted) | 2.0 |
| Eve | 1 | 0.02 (New) | 0.02 |

- Simple Average: (5 + 4 + 1) / 3 = **3.33**
- Weighted Average: (5.0 + 2.0 + 0.02) / (1.0 + 0.5 + 0.02) = **4.62**

Eve's suspicious 1-star rating has minimal impact due to low trust score.

### Review Sorting

Reviews can be sorted by trust score, WoT distance, or date:

```typescript
// Default: Trust score (highest first)
reviews.sort((a, b) => {
    if (b.trustScore !== a.trustScore) {
        return b.trustScore - a.trustScore;
    }
    return b.eventCreatedAt.getTime() - a.eventCreatedAt.getTime();
});

// WoT Distance (closest first)
reviews.sort((a, b) => {
    const aWot = a.wotDistance ?? Infinity;
    const bWot = b.wotDistance ?? Infinity;
    if (aWot !== bWot) return aWot - bWot;
    return b.eventCreatedAt.getTime() - a.eventCreatedAt.getTime();
});
```

---

## Web of Trust Integration

Reviews are enhanced with Web of Trust (WoT) data from the Nostr social graph. This provides an additional signal for review authenticity beyond the internal trust score.

> **See [WOT_INTEGRATION.md](./WOT_INTEGRATION.md) for complete WoT documentation.**

### WoT Distance Levels

| Distance | Label | Badge Color | Description |
|----------|-------|-------------|-------------|
| 0 | You | Green | The reviewer is you |
| 1 | Direct | Emerald | You follow this person |
| 2 | 2nd | Yellow | Friend of a friend |
| 3 | 3rd | Orange | 3 hops away |
| 4+ | 4+ | Gray | Distant connection |
| null | Unknown | Gray (dashed) | Not connected to trust network |

### WoT Filtering

Users can filter reviews by WoT distance:

- **All Reviews** - Show all reviews regardless of WoT
- **Trusted (≤3 hops)** - Show reviews from within 3 hops
- **Close (≤2 hops)** - Show reviews from direct follows and friends-of-friends

### WoT Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         WoT Data Flow                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Review Indexed (via API or Listener)                                 │
│         │                                                                │
│         ▼                                                                │
│  2. Query WoT Oracle                                                     │
│     GET /distance?from={bot_pubkey}&to={author_pubkey}                   │
│         │                                                                │
│         ▼                                                                │
│  3. Store WoT Data                                                       │
│     - wotDistance (hops)                                                 │
│     - wotPathCount (number of paths)                                     │
│     - wotComputedAt (timestamp)                                          │
│         │                                                                │
│         ▼                                                                │
│  4. Display with WoTBadge                                                │
│     - Color-coded by distance                                            │
│     - Tooltip with description                                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Backfilling WoT Data

For existing reviews without WoT data:

```bash
# Compute WoT for reviews missing data
npm run recompute:wot

# Force recompute all reviews
npm run recompute:wot -- --all

# Recompute stale data (>24h old)
npm run recompute:wot -- --stale
```

---

## Review Listener

The review listener is a standalone Node.js script that indexes reviews from Nostr relays in real-time.

### Running the Listener

```bash
# Development
npm run listen:reviews

# Production (PM2)
pm2 start scripts/reviewListener.ts --name review-listener --interpreter tsx

# Production (systemd)
# See /etc/systemd/system/review-listener.service
```

### Listener Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Review Listener                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. Connect to Relays                                                    │
│     ├─ wss://relay.damus.io                                              │
│     ├─ wss://relay.nostr.band                                            │
│     ├─ wss://nos.lol                                                     │
│     └─ wss://relay.snort.social                                          │
│                                                                          │
│  2. Subscribe to Events                                                  │
│     {                                                                    │
│       "kinds": [38381, 38382],                                           │
│       "since": <24_hours_ago>                                            │
│     }                                                                    │
│                                                                          │
│  3. Process Incoming Events                                              │
│     ┌─────────────────────┐                                              │
│     │ Receive EVENT       │                                              │
│     └─────────────────────┘                                              │
│              │                                                           │
│              ▼                                                           │
│     ┌─────────────────────┐                                              │
│     │ Check processed     │──Yes──▶ Skip                                 │
│     │ cache               │                                              │
│     └─────────────────────┘                                              │
│              │ No                                                        │
│              ▼                                                           │
│     ┌─────────────────────┐                                              │
│     │ Parse event         │                                              │
│     │ - Kind 38381: review│                                              │
│     │ - Kind 38382: reply │                                              │
│     └─────────────────────┘                                              │
│              │                                                           │
│              ▼                                                           │
│     ┌─────────────────────┐                                              │
│     │ Process images      │                                              │
│     │ (if present)        │                                              │
│     │ - Fetch from Blossom│                                              │
│     │ - Create thumbnails │                                              │
│     │ - Upload to Hetzner │                                              │
│     └─────────────────────┘                                              │
│              │                                                           │
│              ▼                                                           │
│     ┌─────────────────────┐                                              │
│     │ Index to database   │                                              │
│     │ - Run spam check    │                                              │
│     │ - Store review/reply│                                              │
│     └─────────────────────┘                                              │
│                                                                          │
│  4. Handle Disconnections                                                │
│     - Auto-reconnect after 5 seconds                                     │
│     - Graceful shutdown on SIGINT/SIGTERM                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Deduplication

The listener maintains a cache of processed event IDs:

```typescript
const processedEvents = new Set<string>();
const MAX_PROCESSED_CACHE = 10000;

// Check before processing
if (processedEvents.has(event.id)) {
    return; // Skip duplicate
}

// Add to cache
processedEvents.add(event.id);

// Clean up if too large
if (processedEvents.size > MAX_PROCESSED_CACHE) {
    // Remove oldest half
}
```

---

## API Reference

### GET /api/places/[slug]/reviews

Retrieve all reviews for a venue with trust scores and WoT data.

**Parameters:**
- `slug` - URL-formatted OSM ID (e.g., `node-123456`)

**Response:**
```json
{
  "osmId": "node/123456",
  "reviews": [
    {
      "id": "clx...",
      "eventId": "abc123...",
      "authorPubkey": "def456...",
      "rating": 5,
      "content": "Great place!",
      "eventCreatedAt": "2024-01-15T10:30:00Z",
      "trustScore": 0.8,
      "wotDistance": 2,
      "wotPathCount": 3,
      "imageUrls": ["https://blossom.primal.net/..."],
      "thumbnailUrls": ["https://storage.hetzner.com/..."],
      "author": {
        "pubkey": "def456...",
        "name": "alice",
        "picture": "https://...",
        "nip05": "alice@example.com"
      },
      "replies": []
    }
  ],
  "weightedAverageRating": 4.5,
  "simpleAverageRating": 4.2,
  "totalReviews": 15
}
```

### GET /api/wot/distance

Get WoT distance from Mapping Bitcoin bot to a target pubkey.

**Parameters:**
- `pubkey` - 64-character hex pubkey

**Response:**
```json
{
  "pubkey": "def456...",
  "distance": 2,
  "pathCount": 3,
  "mutual": false,
  "fromPubkey": "abc123...",
  "source": "oracle"
}
```

### POST /api/reviews/index

Index a review or reply for immediate display.

**Request (Review):**
```json
{
  "type": "review",
  "eventId": "abc123...",
  "osmId": "node/123456",
  "authorPubkey": "def456...",
  "rating": 5,
  "content": "Great place!",
  "eventCreatedAt": 1700000000,
  "imageUrls": ["https://blossom.primal.net/..."],
  "authorProfile": {
    "name": "alice",
    "picture": "https://...",
    "nip05": "alice@example.com"
  }
}
```

**Request (Reply):**
```json
{
  "type": "reply",
  "eventId": "xyz789...",
  "osmId": "node/123456",
  "reviewEventId": "abc123...",
  "authorPubkey": "ghi012...",
  "content": "Thank you!",
  "eventCreatedAt": 1700001000,
  "isOwnerReply": true
}
```

**Response (Success):**
```json
{
  "success": true,
  "type": "review",
  "reviewId": "clx...",
  "spamStatus": "APPROVED",
  "spamReasons": [],
  "thumbnailUrls": ["https://storage.hetzner.com/..."]
}
```

**Response (Blocked):**
```json
{
  "success": false,
  "blocked": true,
  "spamReasons": ["Suspicious content pattern"]
}
```

### POST /api/reviews/process-image

Create thumbnail from Blossom image.

**Request:**
```json
{
  "imageUrl": "https://blossom.primal.net/abc123",
  "reviewEventId": "def456..."
}
```

**Response:**
```json
{
  "thumbnailUrl": "https://storage.hetzner.com/bucket/reviews/def456...-a1b2c3d4.webp",
  "thumbnailKey": "reviews/def456...-a1b2c3d4.webp"
}
```

---

## Component Reference

### ReviewForm

Interactive form for submitting reviews.

```tsx
<ReviewForm
  onSubmit={async (rating, content, imageUrls) => {
    // Handle submission
    return true; // success
  }}
  isSubmitting={false}
  error={null}
/>
```

**Features:**
- Star rating selector (required)
- Text input with character counter (max 2000)
- Multi-image upload (max 5 images)
- Login requirement check
- Write mode validation

### ReviewCard

Display a single review with all metadata.

```tsx
<ReviewCard
  review={reviewWithTrust}
  onReply={() => setShowReplyForm(true)}
  showReplyForm={showReplyForm}
  replyForm={<ReplyForm />}
  ownerPubkey="abc123..."
/>
```

**Features:**
- Author avatar and name
- Trust badge with score
- Star rating display
- Content with expand/collapse
- Image gallery with lightbox
- Reply button and nested replies
- Relative timestamps

### TrustBadge

Visual indicator of trust level.

```tsx
<TrustBadge score={0.8} showScore={true} size="md" />
```

**Sizes:** `sm`, `md`, `lg`

### WoTBadge

Visual indicator of Web of Trust distance.

```tsx
<WoTBadge
    distance={2}
    source="oracle"
    size="md"
    showSource={false}
/>
```

**Props:**
- `distance` - Number of hops (null for unknown)
- `source` - `"oracle"` or `"extension"` (where the WoT was computed)
- `size` - `"sm"`, `"md"`, `"lg"`
- `showSource` - Whether to show source indicator

**Display:**
- Green checkmark for distance 0-1
- User icon for distance 2+
- Question mark for unknown

### WeightedRating

Aggregated rating display for venues.

```tsx
<WeightedRating
  weightedRating={4.5}
  simpleRating={4.2}
  totalReviews={15}
/>
```

**Features:**
- Shows weighted average with star
- Shows review count
- Shows delta from simple average (if significant)

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Hetzner Storage (for thumbnails)
HETZNER_STORAGE_ENDPOINT=https://...
HETZNER_STORAGE_BUCKET=mappingbitcoin
HETZNER_STORAGE_ACCESS_KEY=...
HETZNER_STORAGE_SECRET_KEY=...

# Nostr Relays (configured in code)
# See lib/nostr/config.ts
```

---

## Spam Filtering

Reviews are automatically checked for spam during indexing:

1. **Automatic Actions:**
   - `block` - Review rejected, not stored (returns 403)
   - `flag` - Review stored with FLAGGED status for moderation
   - `pass` - Review approved automatically

2. **Spam Indicators:**
   - Suspicious content patterns
   - Rapid-fire posting
   - Known spam signatures

3. **Admin Moderation:**
   - View flagged reviews at `/admin/moderation`
   - Bulk approve/block actions
   - Manual status override

---

## File Reference

```
components/reviews/
├── index.ts              # Exports
├── ReviewForm.tsx        # Review submission form
├── ReviewCard.tsx        # Single review display
├── ReviewList.tsx        # List of reviews (with WoT filtering)
├── ReplyForm.tsx         # Reply submission form
├── ReviewsSection.tsx    # Main container
├── StarRating.tsx        # Star rating picker
├── TrustBadge.tsx        # Trust level badges
└── WoTBadge.tsx          # Web of Trust distance badge

hooks/
├── useReviews.ts         # Review CRUD operations
├── useNostrPublish.ts    # Nostr event publishing
└── useBlossomUpload.ts   # Image upload to Blossom

lib/
├── nostr/
│   ├── constants.ts      # Event kinds, tag helpers
│   ├── reviewEvents.ts   # Event parsers
│   └── config.ts         # Relay configuration
├── wot/
│   └── oracleClient.ts   # WoT Oracle API client
└── db/services/
    └── reviews.ts        # Database operations

app/api/
├── places/[slug]/reviews/route.ts  # GET reviews
├── wot/distance/route.ts           # GET WoT distance
└── reviews/
    ├── index/route.ts              # POST index review
    └── process-image/route.ts      # POST create thumbnail

scripts/
├── reviewListener.ts     # Background relay listener
└── recomputeWoT.ts       # WoT backfill script
```

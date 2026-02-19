# API Reference

Public API endpoints for MappingBitcoin.

## Reviews API

### GET /api/places/[slug]/reviews

Retrieve all reviews for a venue with trust scores and WoT data.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| slug | string | URL-formatted OSM ID (e.g., `node-123456`) |

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
        "picture": "https://..."
      },
      "replies": []
    }
  ],
  "ownerPubkey": "abc123...",
  "weightedAverageRating": 4.5,
  "simpleAverageRating": 4.2,
  "totalReviews": 15
}
```

### POST /api/reviews/index

Index a review for immediate display after publishing to Nostr.

**Request Body:**

```json
{
  "type": "review",
  "eventId": "abc123...",
  "osmId": "node/123456",
  "authorPubkey": "def456...",
  "rating": 5,
  "content": "Great place!",
  "eventCreatedAt": 1700000000,
  "imageUrls": ["https://blossom.primal.net/..."]
}
```

## Web of Trust API

### GET /api/wot/distance

Get WoT distance from Mapping Bitcoin bot to a target pubkey.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| pubkey | string | 64-character hex pubkey |

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

## Verification API

### POST /api/verify/initiate

Start email verification for a venue.

### POST /api/verify/confirm

Confirm email verification code.

### POST /api/verify/domain/initiate

Start domain DNS verification.

### POST /api/verify/domain/check

Check domain TXT record.

### GET /api/verify/status

Get verification status for a venue.

## Coming Soon

Additional endpoints being documented:

- **Public Endpoints** - Search and retrieve venue data
- **Venue Management** - Create and update venue endpoints
- **Webhooks** - Real-time notifications for venue changes

[Contact us](/contact) if you need early access for integration purposes.

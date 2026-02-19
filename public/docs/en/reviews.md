# Reviews & Ratings

MappingBitcoin features a decentralized review system built on Nostr. Your reviews are stored as Nostr events, making them portable and censorship-resistant.

## Submitting a Review

### Requirements

- **Nostr Login** - You must be logged in with a Nostr identity
- **Write Access** - Login via extension (NIP-07), private key (nsec), or bunker (NIP-46)
- **Star Rating** - Select 1-5 stars (required)
- **Content** - Optional text review (up to 2000 characters)
- **Images** - Optional photos (up to 5 images)

### How to Review

1. Navigate to a venue page
2. Scroll to the Reviews section
3. Click the star rating to begin
4. Optionally add text and images
5. Click Submit

Your review is signed with your Nostr key and published to relays.

## Review Features

### Star Ratings

| Stars | Meaning |
|-------|---------|
| 5 | Excellent |
| 4 | Good |
| 3 | Average |
| 2 | Below Average |
| 1 | Poor |

### Image Attachments

Images are uploaded to Blossom servers (decentralized storage). Thumbnails are generated for fast loading.

- Supported formats: JPEG, PNG, GIF, WebP
- Maximum size: 5MB per image
- Maximum images: 5 per review

### Owner Replies

Verified venue owners can reply to reviews. Look for the "Owner" badge on replies.

> Only verified owners can reply. Non-owner replies are filtered out.

## Trust-Weighted Ratings

Reviews are weighted by the author's trust score in the MappingBitcoin web of trust.

### How It Works

| Reviewer Type | Impact on Rating |
|---------------|------------------|
| Community Seeders | Highest weight |
| Trusted Members | High weight |
| Known Users | Medium weight |
| New Accounts | Minimal weight |

This means reviews from trusted community members have more influence on venue ratings than anonymous or new accounts.

### Example

| Reviewer | Rating | Trust | Contribution |
|----------|--------|-------|--------------|
| Alice (Seeder) | 5 stars | 1.0 | 5.0 |
| Bob (Trusted) | 4 stars | 0.5 | 2.0 |
| Eve (New) | 1 star | 0.02 | 0.02 |

- Simple Average: 3.33 stars
- Weighted Average: 4.62 stars

Eve's suspicious 1-star rating has minimal impact due to her low trust score.

## Web of Trust Badges

Reviews display WoT badges showing the reviewer's connection to the trust network:

| Badge | Meaning |
|-------|---------|
| Direct (green) | Directly followed by Mapping Bitcoin |
| 2nd (yellow) | Friend of a followed person |
| 3rd (orange) | 3 connections away |
| Unknown (gray) | No connection found |

See [Web of Trust](/docs/web-of-trust) for more details.

## Filtering & Sorting

### Filter Options

- **All Reviews** - Show all reviews
- **Trusted (3 hops)** - Reviews from within 3 hops
- **Close (2 hops)** - Direct and second-degree connections only

### Sort Options

- **Trust Score** - Highest trust first (default)
- **WoT Distance** - Closest connections first
- **Most Recent** - Newest reviews first

## Technical Details

### Nostr Event Structure

Reviews are published as kind 38381 events:

```json
{
  "kind": 38381,
  "tags": [
    ["d", "node/123456789"],
    ["rating", "4"],
    ["g", "u4pruydqqvj"],
    ["image", "https://blossom.primal.net/..."]
  ],
  "content": "Great coffee and they accept Bitcoin!"
}
```

### Indexing

Reviews are indexed in two ways:

1. **Immediate** - After you submit, the review is indexed instantly
2. **Background** - A listener monitors relays for reviews published elsewhere

### Spam Filtering

Reviews are checked for spam patterns. Suspicious reviews may be flagged for moderation.

## FAQ

### Can I edit my review?

Nostr events are immutable. To change your review, you would publish a new event (replacing the old one since reviews use the same `d` tag per venue).

### Why can't I see my review?

- Check that you're logged in
- Ensure the review was published successfully
- Reviews may be flagged for moderation if detected as spam

### Why does my review have low trust?

Trust is based on your Nostr social graph. To increase trust:

- Get followed by community seeders
- Build your Nostr presence
- Engage with the Bitcoin/Nostr community

### Can anyone reply to reviews?

No. Only verified venue owners can reply to reviews on their venues.

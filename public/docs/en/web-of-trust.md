# Web of Trust

Web of Trust (WoT) is a decentralized trust model used by MappingBitcoin to weight reviews and resist Sybil attacks.

## What is Web of Trust?

Instead of relying on a central authority to verify identities, trust is derived from your social graph. In Nostr, when you follow someone, you create a connection. Trust flows through these connections.

```
You ──follows──> Alice ──follows──> Bob ──follows──> Carol
     (1 hop)           (2 hops)          (3 hops)
```

The fewer hops between you and another person, the closer they are in your trust network.

## How MappingBitcoin Uses WoT

MappingBitcoin uses the **Mapping Bitcoin Bot** as the root of trust for the community. The bot follows trusted community members (seeders), and trust flows outward from there.

### Trust Network Structure

```
           Mapping Bitcoin Bot
                   │
                   │ follows
                   ▼
           Community Seeders
         (Distance: 1 hop)
                   │
                   │ follows
                   ▼
        Active Community Members
         (Distance: 2 hops)
                   │
                   │ follows
                   ▼
           Extended Network
         (Distance: 3+ hops)
```

## WoT Distance Levels

| Distance | Label | Meaning | Trust Level |
|----------|-------|---------|-------------|
| 0 | You | The reviewer is you | Highest |
| 1 | Direct | Bot follows this person directly | Very High |
| 2 | 2nd | Friend of a bot-followed person | High |
| 3 | 3rd | 3 connections away | Medium |
| 4+ | 4+ | Distant connection | Low |
| null | Unknown | No path found | Unknown |

## WoT Badges

When viewing reviews, you'll see WoT badges next to reviewers:

| Badge | Color | Meaning |
|-------|-------|---------|
| Direct | Green/Emerald | Directly followed by Mapping Bitcoin |
| 2nd | Yellow | Followed by someone the bot follows |
| 3rd | Orange | 3 hops from the bot |
| Unknown | Gray (dashed) | No connection to trust network |

## Impact on Reviews

### Trust-Weighted Ratings

Reviews from high-trust users have more impact on venue ratings:

| Reviewer | Trust Score | Rating Impact |
|----------|-------------|---------------|
| Seeder (1 hop) | 1.0 | Full weight |
| Trusted (2 hops) | ~0.5 | Medium weight |
| New Account | ~0.02 | Minimal weight |

This makes ratings resistant to spam and fake reviews.

### Filtering Reviews

You can filter reviews by WoT distance:

- **All Reviews** - Show everything
- **Trusted (≤3 hops)** - Within 3 connections
- **Close (≤2 hops)** - Direct follows and friends-of-friends

### Sorting by WoT

Sort reviews by:
- **Trust Score** - Highest trust first
- **WoT Distance** - Closest connections first

## Why Reviews Show "Unknown"

A review shows "Unknown" WoT when:

- The reviewer has no Nostr followers/following
- The reviewer is disconnected from the Bitcoin/Nostr community
- No path could be found to the trust network

This doesn't mean the review is fake - it just means we couldn't verify a trust path. New users will show as Unknown until they build connections.

## Building Your Trust

To increase your WoT standing:

1. **Get followed by seeders** - Community seeders are followed by the bot
2. **Build your Nostr presence** - Post, engage, build connections
3. **Be active in the community** - Attend meetups, contribute to projects
4. **Use your identity consistently** - Same pubkey across platforms

## Technical Details

### WoT Oracle

MappingBitcoin uses a WoT Oracle service to compute trust distances:

```
GET /distance?from={bot_pubkey}&to={reviewer_pubkey}

Response:
{
  "hops": 2,
  "pathCount": 3,
  "mutual": false
}
```

- **hops** - Number of follows to reach the target
- **pathCount** - How many paths were found
- **mutual** - Whether they follow each other

### Data Storage

WoT data is computed when reviews are indexed and cached:

| Field | Description |
|-------|-------------|
| wotDistance | Number of hops |
| wotPathCount | Paths found |
| wotComputedAt | When computed |

### Recomputation

WoT data can be refreshed to reflect changes in the social graph:

- New followers can decrease distance
- Unfollows can increase distance
- Seeders being added affects many users

## FAQ

### Why is my WoT distance high?

- You may be new to Nostr
- Your followers aren't connected to the seeders
- Build connections with active community members

### Does WoT affect my ability to review?

No. Anyone can submit reviews. WoT only affects how much weight your review has on the venue's aggregate rating.

### How are seeders chosen?

Seeders are trusted Bitcoin community members followed by the Mapping Bitcoin bot. This is currently managed by the project maintainers.

### Can I see my own WoT distance?

Yes. When viewing your own reviews, you'll see your WoT badge. You can also check via the API.

### Is WoT the only trust signal?

WoT is the primary signal. MappingBitcoin also has an internal trust score system that considers other factors.

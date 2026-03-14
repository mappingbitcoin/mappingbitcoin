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

MappingBitcoin uses the **Mapping Bitcoin Bot** as the root of trust for the community. Trust distances are computed by an external **WoT Oracle** service at `wot-oracle.mappingbitcoin.com`, which analyzes the Nostr social graph to determine how closely connected any user is to the bot.

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

Reviews from high-trust users have more impact on venue ratings. The closer a reviewer is to the trust network, the more weight their review carries. This makes ratings resistant to spam and fake reviews.

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

1. **Build your Nostr presence** - Post, engage, build connections
2. **Be active in the community** - Attend meetups, contribute to projects
3. **Use your identity consistently** - Same pubkey across platforms
4. **Connect with trusted members** - Follow and interact with active community members

## Technical Details

### WoT Oracle

MappingBitcoin uses an external WoT Oracle service at `wot-oracle.mappingbitcoin.com` to compute trust distances. The oracle maintains an up-to-date view of the Nostr social graph and responds to distance queries:

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

## FAQ

### Why is my WoT distance high?

- You may be new to Nostr
- Your followers aren't well-connected to active community members
- Build connections with active community members

### Does WoT affect my ability to review?

No. Anyone can submit reviews. WoT only affects how much weight your review has on the venue's aggregate rating.

### Can I see my own WoT distance?

Yes. When viewing your own reviews, you'll see your WoT badge. You can also check via the API.

### Is WoT the only trust signal?

WoT is the primary signal. MappingBitcoin also has an internal trust score system that considers other factors.

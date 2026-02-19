# Place Verification

The verification system allows venue owners to prove ownership through multiple methods.

## Why Verify?

| Benefit | Description |
|---------|-------------|
| Trust | Establish credibility with customers |
| Reply to Reviews | Only verified owners can respond to reviews |
| Security | Prevent impersonation |
| Visibility | Priority in search results |
| Badge | Verification badge on profile |

## Verification Methods

### Email Verification

Verify using the venue's listed email address.

**Process:**

1. Request verification for a venue
2. System retrieves email from OSM `contact:email` tag
3. 6-digit code sent to that email
4. Enter code within 15 minutes
5. Up to 5 attempts allowed

**Security:**

| Measure | Description |
|---------|-------------|
| Source | Email from OSM, not user input |
| Storage | Hash stored, not actual email |
| Revocation | Auto-revoked if OSM email changes |

### Domain Verification

Verify by adding a DNS TXT record.

**Process:**

1. Request domain verification
2. System extracts domain from website/email
3. Receive unique TXT record value
4. Add TXT record to your DNS
5. System checks for record
6. Verification complete when found

**Example TXT Record:**

```
mappingbitcoin-verify=abc123def456
```

**Rate Limiting:**

| Check | Cooldown |
|-------|----------|
| 1st | 30 seconds |
| 2nd | 60 seconds |
| 3rd | 120 seconds |
| ... | Up to 1 hour |

**Timeline:**

- 24-hour window to complete
- Record can be removed after verification

### Manual Verification

Administrators can verify venues for special cases:

| Method | Use Case |
|--------|----------|
| PHYSICAL | In-person verification |
| PHONE | Phone call verification |
| MANUAL | Admin discretion |

## Verification Status

Once verified:

- Verification badge appears on venue
- Owner's Nostr pubkey associated
- Ability to reply to reviews on your venue
- Claim recorded in database
- Announced on Nostr network

## Claim Lifecycle

```
PENDING → VERIFIED → [active]
    ↓         ↓
EXPIRED   REVOKED (if email changes)
```

## Expiration

| Type | Duration |
|------|----------|
| Email codes | 15 minutes |
| Domain claims | 24 hours |
| Verified status | Until revoked |

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/verify/initiate` | POST | Start email verification |
| `/api/verify/confirm` | POST | Confirm email code |
| `/api/verify/domain/initiate` | POST | Start domain verification |
| `/api/verify/domain/check` | POST | Check domain TXT record |
| `/api/verify/status` | GET | Get verification status |

## Related

- [Creating Venues](/docs/venue-creation) - Add your venue first
- [Image Uploads](/docs/blossom-images) - Add venue images
- [Reviews](/docs/reviews) - How reviews work (owners can reply)

# Image Uploads with Blossom

Venue images are stored on decentralized **Blossom servers** using Nostr authentication.

## What is Blossom?

Blossom is a decentralized media hosting protocol built on Nostr:

- **Content-addressed** - Files identified by SHA-256 hash
- **Decentralized** - Stored across multiple servers
- **Censorship-resistant** - No single point of control
- **Nostr-authenticated** - Uses NIP-07 signing

## Supported Servers

We use multiple Blossom servers for redundancy:

| Server | URL |
|--------|-----|
| Primal | `blossom.primal.net` |
| Oxtr | `blossom.oxtr.dev` |
| Satellite | `cdn.satellite.earth` |
| Nostr.hu | `blossom.nostr.hu` |

## File Requirements

| Requirement | Value |
|-------------|-------|
| Max size | 5 MB |
| Formats | JPEG, PNG, GIF, WebP |

## Upload Process

### 1. File Validation

- Check file type is allowed
- Verify size under 5MB

### 2. Hash Calculation

```
SHA-256(file contents) → hex string
```

The hash uniquely identifies the file and enables deduplication.

### 3. Authentication Event

Create a Nostr event (kind 24242):

| Field | Value |
|-------|-------|
| kind | 24242 (Blossom auth) |
| tags | `["t", "upload"]`, `["x", hash]`, `["expiration", timestamp]` |
| content | "Upload venue image" |

The event is signed using your NIP-07 browser extension.

### 4. Upload Request

```
PUT /upload
Headers:
  Content-Type: [file type]
  Authorization: Nostr [base64 event]
  X-SHA-256: [file hash]
Body: [file bytes]
```

### 5. URL Storage

The returned URL is stored in the OSM `image` tag for the venue.

## Requirements

### Nostr Extension

You need a NIP-07 browser extension:

| Extension | Browser |
|-----------|---------|
| Alby | Chrome, Firefox |
| nos2x | Chrome |
| Flamingo | Firefox |

### Login

You must be logged in via Nostr before uploading.

## How It Works

```
User selects image
       ↓
Calculate SHA-256 hash
       ↓
Sign Nostr auth event (NIP-07)
       ↓
Upload to Blossom server
       ↓
Get permanent URL
       ↓
Store in OSM image tag
```

## Fallback Handling

If PUT request fails (405), we retry with POST method for compatibility.

## Related

- [Creating Venues](/docs/venue-creation) - Full venue submission
- [Verification](/docs/verification) - Verify your business

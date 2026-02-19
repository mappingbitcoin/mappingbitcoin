# Security Audit Report

**Project:** MappingBitcoin
**Date:** February 2026
**Auditor:** Automated Security Review

---

## Executive Summary

This security audit covers authentication, API routes, file uploads, and XSS/injection vulnerabilities in the MappingBitcoin application. The codebase demonstrates good security practices in many areas but has several vulnerabilities that require immediate attention.

### Risk Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 4 | Requires immediate action |
| High | 8 | Should be fixed soon |
| Medium | 12 | Plan for remediation |
| Low | 8 | Address when convenient |

---

## Critical Vulnerabilities

### 1. Private Keys Stored in SessionStorage

**Location:** `contexts/NostrAuthContext.tsx:369`, `lib/nostr/auth.ts:69`

**Issue:** Private keys (`nostr_privkey`) are stored in `sessionStorage`, which is vulnerable to:
- XSS attacks can access all session storage
- Not encrypted at rest
- Accessible to any JavaScript running on the page

```typescript
// Vulnerable code
sessionStorage.setItem("nostr_privkey", decoded.hex);
```

**Impact:** Complete account compromise if XSS vulnerability is exploited.

**Recommendation:**
- Use memory-only storage for private keys (no persistence)
- Implement strict Content Security Policy (CSP)
- Consider hardware-backed key storage

---

### 2. No EXIF Metadata Stripping

**Location:** `hooks/useBlossomUpload.ts`, `app/api/reviews/process-image/route.ts`

**Issue:** User-uploaded images retain EXIF metadata, exposing:
- GPS location data
- Camera model and serial numbers
- Timestamps revealing activity patterns
- Device fingerprinting information

```typescript
// Current code - does NOT strip EXIF
const thumbnailBuffer = await sharp(imageBuffer)
    .resize(THUMBNAIL_WIDTH, null, { fit: "inside" })
    .webp({ quality: THUMBNAIL_QUALITY })
    .toBuffer();
```

**Impact:** Users reviewing Bitcoin venues unknowingly reveal their location patterns.

**Recommendation:**
```typescript
// Fixed code
const thumbnailBuffer = await sharp(imageBuffer)
    .resize(THUMBNAIL_WIDTH, null, { fit: "inside" })
    .withMetadata(false)  // Strip EXIF
    .webp({ quality: THUMBNAIL_QUALITY })
    .toBuffer();
```

---

### 3. No Rate Limiting on Authentication Endpoints

**Location:** `app/api/auth/nostr/challenge/route.ts`, `app/api/auth/nostr/verify/route.ts`

**Issue:** Authentication endpoints accept unlimited requests, enabling:
- Brute force attacks on challenge verification
- Denial of service via challenge flooding
- Resource exhaustion

**Recommendation:**
- Implement rate limiting (e.g., 10 attempts per minute per IP)
- Add exponential backoff after failed attempts
- Consider CAPTCHA for repeated failures

---

### 4. Unlimited File Size on External Image Fetch

**Location:** `app/api/reviews/process-image/route.ts`

**Issue:** The endpoint fetches arbitrary images from external URLs with no size limit:

```typescript
const response = await fetch(body.imageUrl, {
    headers: { "User-Agent": "MappingBitcoin/1.0" },
});
// No size limit, no timeout
const imageBuffer = Buffer.from(await response.arrayBuffer());
```

**Impact:** Memory exhaustion attack by providing URL to multi-gigabyte file.

**Recommendation:**
- Add 50MB size limit
- Add 30-second timeout
- Validate content-length header before downloading

---

## High Severity Vulnerabilities

### 5. JWT Validation Without Signature Verification (Client-side)

**Location:** `contexts/NostrAuthContext.tsx:281,495`

**Issue:** Client-side JWT parsing trusts payload without verifying signature:

```typescript
const payload = JSON.parse(atob(storedToken.split(".")[1]));
const isExpired = payload.exp * 1000 <= Date.now();
```

**Recommendation:** Only rely on server-side JWT validation.

---

### 6. Bunker Session Keys in SessionStorage

**Location:** `lib/nostr/connect.ts:133`

**Issue:** Client private keys for NIP-46 bunker connections stored in session storage, exposing the entire session to XSS attacks.

---

### 7. XSS Vector in FAQSection Component

**Location:** `components/common/FAQSection/index.tsx:33-37,79`

**Issue:** Uses `dangerouslySetInnerHTML` with template substitution:

```typescript
<div dangerouslySetInnerHTML={{ __html: renderWithPlaceholders(answer) }} />
```

**Recommendation:** Use DOMPurify for HTML sanitization or switch to plain text rendering.

---

### 8. Weak Email Validation

**Location:** `app/api/contact/route.ts:65`, `app/api/verify/initiate/route.ts:112`

**Issue:** Permissive regex allows invalid emails:

```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Accepts: a@b.c, test@localhost., multiple @symbols
```

**Recommendation:** Use RFC 5322 compliant validation or a library like `email-validator`.

---

### 9. Missing Content-Type Magic Byte Verification

**Location:** `app/api/storage/signed-url/route.ts`

**Issue:** File type validated only by MIME type header (client-controlled). No magic number verification.

**Recommendation:** Verify file signatures (magic bytes) match declared content type.

---

### 10. Open Redirect Risk in Auth Flow

**Location:** `app/api/auth/osm/route.ts:8`

**Issue:** `returnTo` parameter stored without strict validation:

```typescript
const returnTo = req.nextUrl.searchParams.get("returnTo") || "/";
```

**Recommendation:** Validate `returnTo` starts with `/` and doesn't contain protocol handlers.

---

### 11. Challenge Race Condition

**Location:** `lib/db/services/auth.ts:47-76`

**Issue:** Challenge validation doesn't prevent concurrent verification attempts:

```typescript
if (record.usedAt) {
    return null;  // No atomic lock
}
```

**Recommendation:** Use atomic database operations or transactions.

---

### 12. No Request Size Limits

**Location:** All POST endpoints

**Issue:** No content-length validation on request bodies:

```typescript
const body = await request.json(); // No size validation
```

**Recommendation:** Add middleware to limit request payload size (e.g., 1MB default).

---

## Medium Severity Vulnerabilities

### 13. Sensitive Information in Error Messages

**Location:** `app/api/places/route.ts:196`

```typescript
return NextResponse.json({
    error: "Failed to upload to OSM: " + err.message
}, { status: 500 });
```

**Recommendation:** Log full errors internally, return generic messages to clients.

---

### 14. Hardcoded Development Email

**Location:** `app/api/verify/initiate/route.ts:132-144`

```typescript
const targetEmail = isDevelopment ? "leon@dandelionlabs.io" : email;
```

**Risk:** Email verification bypassed if `NODE_ENV` is misconfigured.

---

### 15. Missing CORS Configuration

**Issue:** No explicit CORS headers found in API routes.

**Recommendation:** Add explicit CORS policy in middleware.

---

### 16. Missing Security Headers

**Issue:** No X-Content-Type-Options, X-Frame-Options, or CSP headers configured.

**Recommendation:** Add security headers middleware:

```typescript
// next.config.js
headers: [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-XSS-Protection', value: '1; mode=block' },
]
```

---

### 17. Weak Random ID Generation

**Location:** `lib/nostr/auth.ts:248`, `lib/nostr/connect.ts:188`

```typescript
const requestId = Math.random().toString(36).substring(2, 15);
```

**Recommendation:** Use `crypto.getRandomValues()` for all security-sensitive IDs.

---

### 18. Very Long Cache Headers for Thumbnails

**Location:** `app/api/reviews/process-image/route.ts`

```typescript
cacheControl: "public, max-age=31536000" // 1 year
```

**Recommendation:** Reduce to 30 days for user-uploaded content.

---

### 19. Public Bucket Fallback Assumption

**Location:** `app/api/reviews/process-image/route.ts`

```typescript
// Fallback: construct public URL (assuming public bucket)
return `${endpoint}/${bucket}/${key}`;
```

**Recommendation:** Verify bucket access model, never assume public access.

---

### 20. Unicode Path Traversal Risk

**Location:** `app/api/storage/signed-url/route.ts`

```typescript
.replace(/[/\\:*?"<>|]/g, "")  // Doesn't handle Unicode lookalikes
```

**Recommendation:** Add Unicode normalization before sanitization.

---

### 21. Insufficient Event Timestamp Validation

**Location:** `app/api/auth/nostr/verify/route.ts:66-71`

```typescript
if (Math.abs(now - event.created_at) > 300) {
```

**Issue:** Allows future timestamps.

**Recommendation:** Use `now - event.created_at > 300` (reject future timestamps).

---

### 22. No Image Dimension Validation

**Location:** All upload endpoints

**Issue:** No limits on image dimensions (could upload 1px x 100000px images).

**Recommendation:** Max dimensions 4000x4000 pixels.

---

### 23. Process-Image Endpoint Not Authenticated

**Location:** `app/api/reviews/process-image/route.ts`

**Issue:** Public endpoint that fetches and processes arbitrary URLs.

**Recommendation:** Add rate limiting at minimum, consider authentication.

---

### 24. Long-Lived Auth Tokens

**Location:** `lib/middleware/adminAuth.ts`

**Issue:** 7-day token expiry is quite long.

**Recommendation:** Implement token refresh pattern, reduce to 1-3 days.

---

## Low Severity Issues

| Issue | Location | Recommendation |
|-------|----------|----------------|
| OSM token in JWT payload | `app/api/auth/osm/callback/route.ts:49` | Store in HttpOnly cookies only |
| Inconsistent pagination limits | Various API routes | Standardize max page limits |
| No API versioning | All routes | Implement `/api/v1/` versioning |
| Verbose admin error logging | `app/api/admin/users/bulk-ban/route.ts` | Implement secure logging with masking |
| Filename truncation at 50 chars | `app/api/storage/signed-url/route.ts` | Could truncate important parts |
| No virus scanning | All upload endpoints | Consider ClamAV integration |
| Dead exiftool dependency | `package.json` | Remove unused dependency or implement |
| Default session secret in dev | `lib/Environment.ts:82` | Add startup warning |

---

## Positive Security Findings

The following security measures are properly implemented:

- **Nostr signature verification** using well-vetted `@noble/secp256k1` library
- **JWT signing** with `jose` library
- **Secure cookies** for OSM session (HttpOnly, Secure, SameSite)
- **5-minute challenge expiry** (appropriate window)
- **Admin middleware** consistently applied
- **React XSS protection** - User content (reviews, descriptions) rendered safely
- **External links** use `rel="noopener noreferrer"` preventing tabnabbing
- **reCAPTCHA** on contact form
- **Prisma ORM** prevents SQL injection
- **File type validation** on uploads (though needs magic byte verification)
- **Size limits** on most upload endpoints

---

## Recommended Immediate Actions

### Priority 1 (This Week)
1. Strip EXIF metadata from all uploaded images
2. Add rate limiting to authentication endpoints
3. Add size limit and timeout to process-image endpoint
4. Remove private key persistence from sessionStorage

### Priority 2 (This Month)
5. Fix FAQSection XSS vector with DOMPurify
6. Add magic byte verification for uploads
7. Implement security headers
8. Add request size limits middleware

### Priority 3 (Next Quarter)
9. Implement token refresh pattern
10. Add explicit CORS configuration
11. Validate returnTo redirects
12. Add comprehensive logging with masking

---

## Testing Recommendations

1. **Penetration Testing:** Conduct manual penetration testing on authentication flows
2. **XSS Testing:** Use automated tools (e.g., OWASP ZAP) to scan for XSS
3. **File Upload Testing:** Test with malformed files, compression bombs, oversized files
4. **Rate Limiting Testing:** Verify limits cannot be bypassed
5. **EXIF Testing:** Upload images with GPS data, verify stripped in output

---

## Conclusion

The MappingBitcoin codebase demonstrates solid security foundations with proper use of modern libraries and React's built-in protections. However, several critical vulnerabilities—particularly around private key storage and metadata exposure—require immediate attention. The recommended fixes are straightforward and should be prioritized based on the severity levels outlined above.

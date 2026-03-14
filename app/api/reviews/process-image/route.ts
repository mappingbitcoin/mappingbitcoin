import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import storage, { AssetType } from "@/lib/storage";
import { randomUUID } from "crypto";
import dns from "dns/promises";
import { checkRateLimit, getClientIP, rateLimiters } from "@/lib/rateLimit";

interface ProcessImageBody {
    imageUrl: string;
    reviewEventId: string;
}

interface ProcessImageResponse {
    thumbnailUrl: string;
    thumbnailKey: string;
}

// Thumbnail settings
const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_QUALITY = 80;
const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB
const FETCH_TIMEOUT_MS = 30000; // 30 seconds

// Known image hosting services (warn if hostname doesn't match any of these)
const KNOWN_IMAGE_HOSTS = [
    "blossom.",
    "nostr.build",
    "image.nostr.build",
    "void.cat",
    "cdn.satellite.earth",
    "files.sovbit.host",
    "nostrage.com",
    "nosto.re",
];

/**
 * Check if an IP address is private/internal (SSRF protection)
 */
function isPrivateIP(ip: string): boolean {
    // IPv6 loopback
    if (ip === "::1") return true;

    // IPv4 checks
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4) return false;

    // 127.0.0.0/8 (loopback)
    if (parts[0] === 127) return true;
    // 0.0.0.0
    if (parts[0] === 0 && parts[1] === 0 && parts[2] === 0 && parts[3] === 0) return true;
    // 10.0.0.0/8 (private)
    if (parts[0] === 10) return true;
    // 172.16.0.0/12 (private)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16 (private)
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 169.254.0.0/16 (link-local)
    if (parts[0] === 169 && parts[1] === 254) return true;

    return false;
}

/**
 * Validate a hostname is not a private/internal address (SSRF protection)
 */
async function validateHostname(hostname: string): Promise<{ safe: boolean; reason?: string }> {
    // Block known local hostnames
    const blockedHostnames = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];
    if (blockedHostnames.includes(hostname)) {
        return { safe: false, reason: "Blocked hostname" };
    }

    // Block internal TLDs
    const blockedSuffixes = [".local", ".internal", ".localhost"];
    for (const suffix of blockedSuffixes) {
        if (hostname.endsWith(suffix)) {
            return { safe: false, reason: `Blocked hostname suffix: ${suffix}` };
        }
    }

    // Resolve DNS and check if the IP is private
    try {
        const { address } = await dns.lookup(hostname);
        if (isPrivateIP(address)) {
            return { safe: false, reason: `Hostname resolves to private IP: ${address}` };
        }
    } catch {
        return { safe: false, reason: "DNS resolution failed" };
    }

    return { safe: true };
}

/**
 * POST /api/reviews/process-image
 * Fetch image from Blossom, create thumbnail, upload to Hetzner
 */
export async function POST(request: NextRequest) {
    // Rate limiting: use sensitive limiter (5/min) since this fetches external URLs
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(`image:process:${clientIP}`, rateLimiters.sensitive);

    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            {
                status: 429,
                headers: {
                    "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
                },
            }
        );
    }

    try {
        const body = await request.json() as ProcessImageBody;

        if (!body.imageUrl || !body.reviewEventId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Validate URL
        let url: URL;
        try {
            url = new URL(body.imageUrl);
        } catch {
            return NextResponse.json(
                { error: "Invalid image URL" },
                { status: 400 }
            );
        }

        // Only allow HTTPS URLs
        if (url.protocol !== "https:") {
            return NextResponse.json(
                { error: "Only HTTPS URLs are allowed" },
                { status: 400 }
            );
        }

        // SSRF protection: validate hostname is not private/internal
        const hostnameCheck = await validateHostname(url.hostname);
        if (!hostnameCheck.safe) {
            console.warn(`[ProcessImage] SSRF blocked: ${url.hostname} - ${hostnameCheck.reason}`);
            return NextResponse.json(
                { error: "Image URL hostname is not allowed" },
                { status: 400 }
            );
        }

        // Allowlist check: warn if hostname is not a known image host
        const isKnownHost = KNOWN_IMAGE_HOSTS.some(
            (pattern) => url.hostname === pattern || url.hostname.endsWith(`.${pattern}`) || url.hostname.startsWith(pattern)
        );
        if (!isKnownHost) {
            console.warn(`[ProcessImage] Unknown image host: ${url.hostname} - allowing but not on known hosts list`);
        }

        // TODO: Add rate limiting to this endpoint to prevent abuse.
        // Consider per-IP or per-session rate limits (e.g., 10 requests/minute).

        // Fetch image from Blossom with timeout
        console.log(`[ProcessImage] Fetching image from ${body.imageUrl}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        let response: Response;
        try {
            response = await fetch(body.imageUrl, {
                headers: {
                    "User-Agent": "MappingBitcoin/1.0",
                },
                signal: controller.signal,
            });
        } catch (err) {
            if (err instanceof Error && err.name === "AbortError") {
                return NextResponse.json(
                    { error: "Image fetch timed out" },
                    { status: 408 }
                );
            }
            throw err;
        } finally {
            clearTimeout(timeoutId);
        }

        if (!response.ok) {
            console.error(`[ProcessImage] Failed to fetch image: ${response.status}`);
            return NextResponse.json(
                { error: "Failed to fetch image" },
                { status: 400 }
            );
        }

        // Check content type
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.startsWith("image/")) {
            return NextResponse.json(
                { error: "URL does not point to an image" },
                { status: 400 }
            );
        }

        // Check content length before downloading
        const contentLength = response.headers.get("content-length");
        if (contentLength && parseInt(contentLength) > MAX_IMAGE_SIZE) {
            return NextResponse.json(
                { error: "Image too large (max 50MB)" },
                { status: 400 }
            );
        }

        // Get image buffer
        const imageBuffer = Buffer.from(await response.arrayBuffer());

        // Verify size after download (in case content-length was missing/wrong)
        if (imageBuffer.length > MAX_IMAGE_SIZE) {
            return NextResponse.json(
                { error: "Image too large (max 50MB)" },
                { status: 400 }
            );
        }

        // Create thumbnail using sharp - strip EXIF metadata for privacy
        console.log(`[ProcessImage] Creating thumbnail (${THUMBNAIL_WIDTH}px width)`);
        const thumbnailBuffer = await sharp(imageBuffer)
            .resize(THUMBNAIL_WIDTH, null, {
                fit: "inside",
                withoutEnlargement: true,
            })
            .rotate() // Auto-rotate based on EXIF orientation before stripping
            // sharp 0.34+ strips metadata by default — no withMetadata() needed
            .webp({ quality: THUMBNAIL_QUALITY })
            .toBuffer();

        // Generate unique filename
        const filename = `${body.reviewEventId.slice(0, 16)}-${randomUUID().slice(0, 8)}.webp`;

        // Upload to Hetzner
        console.log(`[ProcessImage] Uploading thumbnail to Hetzner: ${filename}`);
        const thumbnailKey = await storage.uploadData(
            AssetType.REVIEWS,
            filename,
            thumbnailBuffer,
            {
                contentType: "image/webp",
                cacheControl: "public, max-age=2592000", // 30 days cache
            }
        );

        if (!thumbnailKey) {
            return NextResponse.json(
                { error: "Failed to upload thumbnail to storage" },
                { status: 500 }
            );
        }

        // Get public URL for the thumbnail
        // For Hetzner, we construct the public URL directly
        const thumbnailUrl = await getPublicUrl(thumbnailKey);

        console.log(`[ProcessImage] Thumbnail created: ${thumbnailUrl}`);

        return NextResponse.json({
            thumbnailUrl,
            thumbnailKey,
        } as ProcessImageResponse);
    } catch (error) {
        console.error("[ProcessImage] Error:", error);
        return NextResponse.json(
            { error: "Failed to process image" },
            { status: 500 }
        );
    }
}

/**
 * Get public URL for a storage key
 * For Hetzner Object Storage, we can construct a public URL if the bucket is public
 * Otherwise, we'd need to use signed URLs
 */
async function getPublicUrl(key: string): Promise<string> {
    // Try to get a signed URL with long expiration
    try {
        const url = await storage.getSignedDownloadUrl(
            AssetType.REVIEWS,
            key.replace(`${AssetType.REVIEWS}/`, ""),
            { expiresIn: 2592000 } // 30 days
        );
        return url;
    } catch {
        // Fallback: construct public URL (assuming public bucket)
        const endpoint = process.env.HETZNER_STORAGE_ENDPOINT || "";
        const bucket = process.env.HETZNER_STORAGE_BUCKET || "";
        return `${endpoint}/${bucket}/${key}`;
    }
}

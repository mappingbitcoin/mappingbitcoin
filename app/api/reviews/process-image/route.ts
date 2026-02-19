import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import storage, { AssetType } from "@/lib/storage";
import { randomUUID } from "crypto";

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

/**
 * POST /api/reviews/process-image
 * Fetch image from Blossom, create thumbnail, upload to Hetzner
 */
export async function POST(request: NextRequest) {
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
            .rotate() // Auto-rotate based on EXIF, then strip
            .withMetadata(false) // Strip all EXIF/metadata for privacy
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

import { NextRequest, NextResponse } from "next/server";
import { validateAuthToken } from "@/lib/db/services/auth";
import storage, { AssetType } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

function getAuthToken(request: NextRequest): string | null {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.slice(7);
    }
    return null;
}

// Allowed asset types for user uploads
const ALLOWED_UPLOAD_TYPES = [
    AssetType.REVIEWS,
    AssetType.CLAIMS,
    AssetType.VENUE_IMAGES,
    AssetType.USER_AVATARS,
];

// File size limits per asset type (in bytes)
const SIZE_LIMITS: Record<AssetType, number> = {
    [AssetType.VENUES]: 0, // Not allowed for user upload
    [AssetType.SYNC]: 0, // Not allowed for user upload
    [AssetType.REVIEWS]: 5 * 1024 * 1024, // 5MB
    [AssetType.CLAIMS]: 10 * 1024 * 1024, // 10MB
    [AssetType.VENUE_IMAGES]: 10 * 1024 * 1024, // 10MB
    [AssetType.USER_AVATARS]: 2 * 1024 * 1024, // 2MB
    [AssetType.EXPORTS]: 0, // Not allowed for user upload
    [AssetType.REPORTS]: 0, // Not allowed for user upload
    [AssetType.TEMP]: 5 * 1024 * 1024, // 5MB
};

// Allowed content types per asset type
const ALLOWED_CONTENT_TYPES: Record<AssetType, string[]> = {
    [AssetType.VENUES]: [],
    [AssetType.SYNC]: [],
    [AssetType.REVIEWS]: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    [AssetType.CLAIMS]: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    [AssetType.VENUE_IMAGES]: ["image/jpeg", "image/png", "image/webp"],
    [AssetType.USER_AVATARS]: ["image/jpeg", "image/png", "image/webp"],
    [AssetType.EXPORTS]: [],
    [AssetType.REPORTS]: [],
    [AssetType.TEMP]: ["image/jpeg", "image/png", "image/webp", "application/pdf", "application/json"],
};

/**
 * POST /api/storage/signed-url
 * Generate a signed URL for uploading a file
 *
 * Body:
 * - assetType: The type of asset (reviews, claims, venue-images, avatars)
 * - contentType: The MIME type of the file
 * - filename: Optional original filename (used to generate unique key)
 * - expiresIn: Optional expiration time in seconds (default: 3600)
 */
export async function POST(request: NextRequest) {
    try {
        // Validate authentication
        const token = getAuthToken(request);
        if (!token) {
            return NextResponse.json(
                { error: "Authorization required" },
                { status: 401 }
            );
        }

        const auth = await validateAuthToken(token);
        if (!auth) {
            return NextResponse.json(
                { error: "Invalid or expired token" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { assetType, contentType, filename, expiresIn = 3600 } = body;

        // Validate asset type
        if (!assetType || !Object.values(AssetType).includes(assetType)) {
            return NextResponse.json(
                { error: "Invalid asset type" },
                { status: 400 }
            );
        }

        // Check if asset type is allowed for user uploads
        if (!ALLOWED_UPLOAD_TYPES.includes(assetType)) {
            return NextResponse.json(
                { error: "This asset type is not allowed for user uploads" },
                { status: 403 }
            );
        }

        // Validate content type
        if (!contentType) {
            return NextResponse.json(
                { error: "Content type is required" },
                { status: 400 }
            );
        }

        const allowedTypes = ALLOWED_CONTENT_TYPES[assetType as AssetType];
        if (!allowedTypes.includes(contentType)) {
            return NextResponse.json(
                { error: `Content type '${contentType}' is not allowed for ${assetType}` },
                { status: 400 }
            );
        }

        // Generate unique filename
        const ext = getExtensionFromContentType(contentType);
        const uniqueFilename = filename
            ? `${auth.pubkey.slice(0, 8)}-${uuidv4().slice(0, 8)}-${sanitizeFilename(filename)}`
            : `${auth.pubkey.slice(0, 8)}-${uuidv4()}${ext}`;

        // Check if storage is available
        if (!storage.isAvailable()) {
            return NextResponse.json(
                { error: "Storage service is not available" },
                { status: 503 }
            );
        }

        // Generate signed upload URL
        const signedUrl = await storage.getSignedUploadUrl(
            assetType as AssetType,
            uniqueFilename,
            {
                expiresIn,
                contentType,
            }
        );

        return NextResponse.json({
            uploadUrl: signedUrl,
            key: uniqueFilename,
            assetType,
            expiresIn,
            maxSize: SIZE_LIMITS[assetType as AssetType],
        });
    } catch (error) {
        console.error("Error generating signed URL:", error);
        return NextResponse.json(
            { error: "Failed to generate signed URL" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/storage/signed-url
 * Generate a signed URL for downloading a file
 *
 * Query params:
 * - assetType: The type of asset
 * - key: The file key/name
 * - expiresIn: Optional expiration time in seconds (default: 3600)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const assetType = searchParams.get("assetType");
        const key = searchParams.get("key");
        const expiresIn = parseInt(searchParams.get("expiresIn") || "3600", 10);

        // Validate parameters
        if (!assetType || !Object.values(AssetType).includes(assetType as AssetType)) {
            return NextResponse.json(
                { error: "Invalid asset type" },
                { status: 400 }
            );
        }

        if (!key) {
            return NextResponse.json(
                { error: "File key is required" },
                { status: 400 }
            );
        }

        // Check if storage is available
        if (!storage.isAvailable()) {
            return NextResponse.json(
                { error: "Storage service is not available" },
                { status: 503 }
            );
        }

        // Check if file exists
        const exists = await storage.exists(assetType as AssetType, key);
        if (!exists) {
            return NextResponse.json(
                { error: "File not found" },
                { status: 404 }
            );
        }

        // Generate signed download URL
        const signedUrl = await storage.getSignedDownloadUrl(
            assetType as AssetType,
            key,
            { expiresIn }
        );

        return NextResponse.json({
            downloadUrl: signedUrl,
            key,
            assetType,
            expiresIn,
        });
    } catch (error) {
        console.error("Error generating signed URL:", error);
        return NextResponse.json(
            { error: "Failed to generate signed URL" },
            { status: 500 }
        );
    }
}

function getExtensionFromContentType(contentType: string): string {
    const map: Record<string, string> = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
        "application/pdf": ".pdf",
        "application/json": ".json",
    };
    return map[contentType] || "";
}

function sanitizeFilename(filename: string): string {
    // Remove path separators and dangerous characters
    return filename
        .replace(/[/\\:*?"<>|]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase()
        .slice(0, 50);
}

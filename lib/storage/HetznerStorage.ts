import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import fs from "fs/promises";
import { serverEnv, isProduction } from "../Environment";

/**
 * Asset types for organizing storage
 * Each type has its own prefix/folder in the bucket
 */
export enum AssetType {
    // Core data files
    VENUES = "venues",           // BitcoinVenues.json, EnrichedVenues.json
    SYNC = "sync",               // SyncData.json, timestamps

    // User-generated content
    REVIEWS = "reviews",         // Review images and attachments
    CLAIMS = "claims",           // Claim verification documents

    // Media assets
    VENUE_IMAGES = "venue-images", // Venue photos uploaded by users
    USER_AVATARS = "avatars",      // User profile pictures

    // Exports and reports
    EXPORTS = "exports",         // CSV/JSON data exports
    REPORTS = "reports",         // Generated reports

    // Temporary files
    TEMP = "temp",               // Temporary uploads (auto-cleaned)

    // Marketing content
    MARKETING = "marketing",     // Marketing images, videos, and assets
}

/**
 * Configuration for Hetzner Object Storage
 */
interface HetznerStorageConfig {
    endpoint: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
}

/**
 * Options for signed URL generation
 */
interface SignedUrlOptions {
    expiresIn?: number;  // Seconds until URL expires (default: 3600 = 1 hour)
    contentType?: string; // Content-Type for uploads
}

/**
 * Upload options
 */
interface UploadOptions {
    contentType?: string;
    metadata?: Record<string, string>;
    cacheControl?: string;
}

/**
 * Result from listing objects
 */
interface ListResult {
    key: string;
    size: number;
    lastModified: Date;
}

class HetznerStorageClient {
    private client: S3Client | null = null;
    private bucket: string = "";
    private isConfigured: boolean = false;

    constructor() {
        this.initialize();
    }

    private initialize(): void {
        const config = this.getConfig();

        if (!config) {
            console.warn("⚠️ Hetzner Storage env variables not set; storage operations will be skipped.");
            return;
        }

        this.client = new S3Client({
            endpoint: config.endpoint,
            region: config.region,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
            forcePathStyle: true, // Required for S3-compatible services
        });

        this.bucket = config.bucket;
        this.isConfigured = true;
        console.log("✅ Hetzner Storage client initialized");
    }

    private getConfig(): HetznerStorageConfig | null {
        const { hetzner } = serverEnv;

        if (!hetzner.isConfigured) {
            return null;
        }

        return {
            endpoint: hetzner.endpoint!,
            region: hetzner.region!,
            bucket: hetzner.bucket!,
            accessKeyId: hetzner.accessKey!,
            secretAccessKey: hetzner.secretKey!,
        };
    }

    /**
     * Build the full key path with asset type prefix
     */
    private buildKey(assetType: AssetType, filename: string): string {
        return `${assetType}/${filename}`;
    }

    /**
     * Check if storage is configured
     */
    isAvailable(): boolean {
        return this.isConfigured && this.client !== null;
    }

    /**
     * Upload a file from local path
     */
    async uploadFile(
        assetType: AssetType,
        filename: string,
        localPath: string,
        options: UploadOptions = {}
    ): Promise<string> {
        if (!this.client) {
            console.warn("⚠️ Skipping upload; Hetzner Storage not configured.");
            return "";
        }

        const key = this.buildKey(assetType, filename);
        const fileData = await fs.readFile(localPath);

        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: fileData,
                ContentType: options.contentType || this.guessContentType(filename),
                Metadata: options.metadata,
                CacheControl: options.cacheControl,
            })
        );

        console.log(`✅ Uploaded ${key} to Hetzner Storage`);
        return key;
    }

    /**
     * Upload raw data (Buffer or string)
     */
    async uploadData(
        assetType: AssetType,
        filename: string,
        data: Buffer | string,
        options: UploadOptions = {}
    ): Promise<string> {
        if (!this.client) {
            console.warn("⚠️ Skipping upload; Hetzner Storage not configured.");
            return "";
        }

        const key = this.buildKey(assetType, filename);
        const body = typeof data === "string" ? Buffer.from(data, "utf-8") : data;

        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: body,
                ContentType: options.contentType || this.guessContentType(filename),
                Metadata: options.metadata,
                CacheControl: options.cacheControl,
            })
        );

        console.log(`✅ Uploaded ${key} to Hetzner Storage`);
        return key;
    }

    /**
     * Download a file to local path
     */
    async downloadFile(
        assetType: AssetType,
        filename: string,
        localPath: string
    ): Promise<void> {
        if (!this.client) {
            throw new Error("Hetzner Storage not configured");
        }

        const key = this.buildKey(assetType, filename);

        const result = await this.client.send(
            new GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            })
        );

        const buffer = await this.streamToBuffer(result.Body);
        await fs.writeFile(localPath, buffer);

        console.log(`✅ Downloaded ${key} to ${localPath}`);
    }

    /**
     * Download and return raw data
     */
    async downloadData(assetType: AssetType, filename: string): Promise<Buffer> {
        if (!this.client) {
            throw new Error("Hetzner Storage not configured");
        }

        const key = this.buildKey(assetType, filename);

        const result = await this.client.send(
            new GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            })
        );

        return this.streamToBuffer(result.Body);
    }

    /**
     * Generate a signed URL for downloading (GET)
     * Use this when you need to provide a temporary public URL to a private file
     */
    async getSignedDownloadUrl(
        assetType: AssetType,
        filename: string,
        options: SignedUrlOptions = {}
    ): Promise<string> {
        if (!this.client) {
            throw new Error("Hetzner Storage not configured");
        }

        const key = this.buildKey(assetType, filename);
        const expiresIn = options.expiresIn || 3600; // 1 hour default

        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });

        return getSignedUrl(this.client, command, { expiresIn });
    }

    /**
     * Generate a signed URL for uploading (PUT)
     * Use this for direct client uploads without going through your server
     */
    async getSignedUploadUrl(
        assetType: AssetType,
        filename: string,
        options: SignedUrlOptions = {}
    ): Promise<string> {
        if (!this.client) {
            throw new Error("Hetzner Storage not configured");
        }

        const key = this.buildKey(assetType, filename);
        const expiresIn = options.expiresIn || 3600; // 1 hour default

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: options.contentType,
        });

        return getSignedUrl(this.client, command, { expiresIn });
    }

    /**
     * Delete a file
     */
    async deleteFile(assetType: AssetType, filename: string): Promise<void> {
        if (!this.client) {
            console.warn("⚠️ Skipping delete; Hetzner Storage not configured.");
            return;
        }

        const key = this.buildKey(assetType, filename);

        await this.client.send(
            new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key,
            })
        );

        console.log(`🗑️ Deleted ${key} from Hetzner Storage`);
    }

    /**
     * Check if a file exists
     */
    async exists(assetType: AssetType, filename: string): Promise<boolean> {
        if (!this.client) {
            return false;
        }

        const key = this.buildKey(assetType, filename);

        try {
            await this.client.send(
                new HeadObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                })
            );
            return true;
        } catch {
            return false;
        }
    }

    /**
     * List files in an asset type folder
     */
    async listFiles(
        assetType: AssetType,
        prefix?: string,
        maxKeys: number = 1000
    ): Promise<ListResult[]> {
        if (!this.client) {
            return [];
        }

        const fullPrefix = prefix
            ? `${assetType}/${prefix}`
            : `${assetType}/`;

        const result = await this.client.send(
            new ListObjectsV2Command({
                Bucket: this.bucket,
                Prefix: fullPrefix,
                MaxKeys: maxKeys,
            })
        );

        return (result.Contents || []).map((item) => ({
            key: item.Key || "",
            size: item.Size || 0,
            lastModified: item.LastModified || new Date(),
        }));
    }

    /**
     * Guess content type from filename
     */
    private guessContentType(filename: string): string {
        const ext = filename.split(".").pop()?.toLowerCase();
        const types: Record<string, string> = {
            json: "application/json",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            gif: "image/gif",
            webp: "image/webp",
            svg: "image/svg+xml",
            pdf: "application/pdf",
            csv: "text/csv",
            txt: "text/plain",
            html: "text/html",
            xml: "application/xml",
            zip: "application/zip",
        };
        return types[ext || ""] || "application/octet-stream";
    }

    /**
     * Convert stream/body to Buffer
     */
    private async streamToBuffer(body: unknown): Promise<Buffer> {
        if (!body) {
            throw new Error("Received empty body from storage");
        }

        if (Buffer.isBuffer(body)) {
            return body;
        }

        if (body instanceof Readable) {
            return new Promise((resolve, reject) => {
                const chunks: Buffer[] = [];
                body.on("data", (chunk) =>
                    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
                );
                body.on("end", () => resolve(Buffer.concat(chunks)));
                body.on("error", reject);
            });
        }

        if (body instanceof Uint8Array) {
            return Buffer.from(body);
        }

        if (typeof body === "string") {
            return Buffer.from(body);
        }

        if (typeof (body as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer === "function") {
            const arrayBuffer = await (body as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer();
            return Buffer.from(arrayBuffer);
        }

        throw new Error("Unsupported body type received from storage");
    }
}

// Singleton instance with HMR support
const globalForStorage = globalThis as unknown as {
    hetznerStorage: HetznerStorageClient | undefined;
};

const storage = globalForStorage.hetznerStorage ?? new HetznerStorageClient();

if (!isProduction) {
    globalForStorage.hetznerStorage = storage;
}

export default storage;

// Convenience functions for backwards compatibility and common operations

/**
 * Upload a local file to storage
 */
export async function uploadToStorage(
    localFilePath: string,
    remoteFilename: string,
    assetType: AssetType = AssetType.VENUES
): Promise<void> {
    await storage.uploadFile(assetType, remoteFilename, localFilePath);
}

/**
 * Download a file from storage to local path
 */
export async function downloadFromStorage(
    remoteFilename: string,
    localFilePath: string,
    assetType: AssetType = AssetType.VENUES
): Promise<void> {
    await storage.downloadFile(assetType, remoteFilename, localFilePath);
}

/**
 * Get a signed URL for downloading a file
 */
export async function getDownloadUrl(
    remoteFilename: string,
    assetType: AssetType = AssetType.VENUES,
    expiresInSeconds: number = 3600
): Promise<string> {
    return storage.getSignedDownloadUrl(assetType, remoteFilename, {
        expiresIn: expiresInSeconds,
    });
}

/**
 * Get a signed URL for uploading a file
 */
export async function getUploadUrl(
    remoteFilename: string,
    assetType: AssetType = AssetType.VENUES,
    contentType?: string,
    expiresInSeconds: number = 3600
): Promise<string> {
    return storage.getSignedUploadUrl(assetType, remoteFilename, {
        expiresIn: expiresInSeconds,
        contentType,
    });
}

/**
 * Check if a file exists in storage
 */
export async function fileExists(
    remoteFilename: string,
    assetType: AssetType = AssetType.VENUES
): Promise<boolean> {
    return storage.exists(assetType, remoteFilename);
}

/**
 * Delete a file from storage
 */
export async function deleteFromStorage(
    remoteFilename: string,
    assetType: AssetType = AssetType.VENUES
): Promise<void> {
    await storage.deleteFile(assetType, remoteFilename);
}

// Export the storage instance for advanced usage
export { storage, HetznerStorageClient };

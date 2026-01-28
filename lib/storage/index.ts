/**
 * Storage module for Hetzner Object Storage (S3-compatible)
 *
 * Usage:
 *
 * ```typescript
 * import storage, { AssetType, uploadToStorage, downloadFromStorage, getDownloadUrl } from "@/lib/storage";
 *
 * // Upload a file
 * await uploadToStorage("/path/to/local/file.json", "MyFile.json", AssetType.VENUES);
 *
 * // Download a file
 * await downloadFromStorage("MyFile.json", "/path/to/save/file.json", AssetType.VENUES);
 *
 * // Get a signed URL for download (for client-side access)
 * const url = await getDownloadUrl("MyFile.json", AssetType.VENUES);
 *
 * // Get a signed URL for upload (for direct client uploads)
 * const uploadUrl = await getUploadUrl("new-image.jpg", AssetType.VENUE_IMAGES, "image/jpeg");
 *
 * // Advanced: use the storage instance directly
 * await storage.uploadData(AssetType.REVIEWS, "review-123.json", JSON.stringify(reviewData));
 * const data = await storage.downloadData(AssetType.REVIEWS, "review-123.json");
 * ```
 *
 * Asset Types:
 * - VENUES: Core venue data files (BitcoinVenues.json, EnrichedVenues.json)
 * - SYNC: Sync metadata and timestamps
 * - REVIEWS: Review images and attachments
 * - CLAIMS: Claim verification documents
 * - VENUE_IMAGES: User-uploaded venue photos
 * - USER_AVATARS: User profile pictures
 * - EXPORTS: CSV/JSON data exports
 * - REPORTS: Generated reports
 * - TEMP: Temporary files (auto-cleaned)
 */

import storageInstance from "./HetznerStorage";

export {
    AssetType,
    uploadToStorage,
    downloadFromStorage,
    getDownloadUrl,
    getUploadUrl,
    fileExists,
    deleteFromStorage,
    HetznerStorageClient,
    storage,
} from "./HetznerStorage";

export default storageInstance;

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { getMarketingAsset, updateMarketingAsset, deleteMarketingAsset } from "@/lib/db/services/marketing";
import storage, { AssetType } from "@/lib/storage";

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/marketing/assets/[id]
 * Get a specific marketing asset
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { id } = await params;
        const asset = await getMarketingAsset(id);

        if (!asset) {
            return NextResponse.json(
                { error: "Asset not found" },
                { status: 404 }
            );
        }

        // Generate a signed download URL for the asset
        let downloadUrl: string | null = null;
        if (storage.isAvailable()) {
            try {
                downloadUrl = await storage.getSignedDownloadUrl(
                    AssetType.MARKETING,
                    asset.storageKey,
                    { expiresIn: 3600 }
                );
            } catch {
                // Storage might not have the file yet
            }
        }

        return NextResponse.json({ asset, downloadUrl });
    } catch (error) {
        console.error("Error getting asset:", error);
        return NextResponse.json(
            { error: "Failed to get asset" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/marketing/assets/[id]
 * Update a marketing asset's metadata
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { id } = await params;
        const body = await request.json();
        const { socialNetworks, postTypes, topic, customTags, altText } = body;

        const existing = await getMarketingAsset(id);
        if (!existing) {
            return NextResponse.json(
                { error: "Asset not found" },
                { status: 404 }
            );
        }

        const asset = await updateMarketingAsset(id, {
            socialNetworks,
            postTypes,
            topic,
            customTags,
            altText,
        });

        return NextResponse.json({
            success: true,
            asset,
        });
    } catch (error) {
        console.error("Error updating asset:", error);
        return NextResponse.json(
            { error: "Failed to update asset" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/marketing/assets/[id]
 * Delete a marketing asset (both from DB and storage)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await requireAdmin(request);
        if (!authResult.success) {
            return authResult.response;
        }

        const { id } = await params;

        const existing = await getMarketingAsset(id);
        if (!existing) {
            return NextResponse.json(
                { error: "Asset not found" },
                { status: 404 }
            );
        }

        // Delete from storage first
        if (storage.isAvailable()) {
            try {
                await storage.deleteFile(AssetType.MARKETING, existing.storageKey);
            } catch (error) {
                console.warn("Failed to delete file from storage:", error);
                // Continue with DB deletion even if storage deletion fails
            }
        }

        // Delete from database
        await deleteMarketingAsset(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting asset:", error);
        return NextResponse.json(
            { error: "Failed to delete asset" },
            { status: 500 }
        );
    }
}

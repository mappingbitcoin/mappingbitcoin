import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { TAG_CATEGORY_MAP } from "@/constants/PlaceOsmDictionary";
import { PLACE_SUBTYPE_MAP, PlaceCategory, matchPlaceSubcategory } from "@/constants/PlaceCategories";
import { uploadToStorage, AssetType } from "@/lib/storage";
import { refreshVenueCache } from "@/app/api/cache/VenueCache";
import { refreshLocationCache } from "@/app/api/cache/LocationCache";
import { refreshTileCache } from "@/app/api/cache/TileCache";
import { EnrichedVenue } from "@/models/Overpass";

const ENRICHED_FILE = path.resolve("data", "EnrichedVenues.json");

/**
 * Fix venues that have a category tag but weren't properly enriched.
 *
 * NOTE (February 1, 2026): This tool was created to fix an issue where venues
 * created via MappingBitcoin.com were not being properly mapped back to their
 * category/subcategory when synced from OpenStreetMap. The enrichment process
 * only used TAG_CATEGORY_MAP, but venues created through our platform have a
 * custom 'category' tag that wasn't being utilized as a fallback.
 *
 * This is a one-time fix tool. The enrichment process has been updated to
 * use this fallback logic going forward.
 */
export async function POST(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (!authResult.success) return authResult.response;

    try {
        // Load current enriched venues
        const raw = await fs.readFile(ENRICHED_FILE, "utf8");
        const venues: EnrichedVenue[] = JSON.parse(raw);

        const osmTagKeys = ['amenity', 'shop', 'tourism', 'leisure', 'office', 'craft', 'healthcare', 'place'];
        let fixedCount = 0;

        for (const v of venues) {
            if (!v.tags) continue;

            const tagCategory = v.tags.category;
            if (!tagCategory) continue;

            // Validate it's a known category
            if (!(tagCategory in PLACE_SUBTYPE_MAP)) continue;

            // Check if TAG_CATEGORY_MAP would match
            let tagMapMatched = false;
            for (const [key, value] of Object.entries(v.tags)) {
                const tag = `${key}:${value}`;
                if (TAG_CATEGORY_MAP[tag]) {
                    tagMapMatched = true;
                    break;
                }
            }

            // If TAG_CATEGORY_MAP matches, skip
            if (tagMapMatched) continue;

            // Try to find subcategory from OSM tags
            let foundSubcategory: string | null = null;
            for (const tagKey of osmTagKeys) {
                const tagValue = v.tags[tagKey];
                if (tagValue) {
                    const subcatMatch = matchPlaceSubcategory(tagValue);
                    if (subcatMatch && subcatMatch.category === tagCategory) {
                        foundSubcategory = subcatMatch.subcategory;
                        break;
                    }
                    const validSubcats = PLACE_SUBTYPE_MAP[tagCategory as PlaceCategory];
                    if (validSubcats && (validSubcats as readonly string[]).includes(tagValue)) {
                        foundSubcategory = tagValue;
                        break;
                    }
                }
            }

            // Check if this venue needs fixing
            const needsCategoryFix = !v.category || v.category !== tagCategory;
            const needsSubcategoryFix = !v.subcategory && foundSubcategory;

            if (needsCategoryFix || needsSubcategoryFix) {
                if (needsCategoryFix) {
                    v.category = tagCategory as PlaceCategory;
                }
                if (needsSubcategoryFix && foundSubcategory) {
                    // Safe cast: foundSubcategory was validated against PLACE_SUBTYPE_MAP
                    v.subcategory = foundSubcategory as typeof v.subcategory;
                }
                v.enrichedCategoryAt = new Date().toISOString();
                fixedCount++;
            }
        }

        if (fixedCount === 0) {
            return NextResponse.json({
                success: true,
                message: "No venues needed fixing",
                fixedCount: 0,
            });
        }

        // Save and refresh caches
        await fs.writeFile(ENRICHED_FILE, JSON.stringify(venues, null, 2), "utf8");
        await uploadToStorage(ENRICHED_FILE, "EnrichedVenues.json", AssetType.VENUES);
        await refreshVenueCache();
        await refreshLocationCache();
        await refreshTileCache();

        return NextResponse.json({
            success: true,
            message: `Successfully fixed ${fixedCount} venue(s)`,
            fixedCount,
        });
    } catch (error) {
        console.error("[Admin] Error fixing categories:", error);
        return NextResponse.json(
            { error: "Failed to fix categories" },
            { status: 500 }
        );
    }
}

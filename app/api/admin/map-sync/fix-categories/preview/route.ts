import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/adminAuth";
import { getVenueCache } from "@/app/api/cache/VenueCache";
import { TAG_CATEGORY_MAP } from "@/constants/PlaceOsmDictionary";
import { PLACE_SUBTYPE_MAP, PlaceCategory, matchPlaceSubcategory } from "@/constants/PlaceCategories";

/**
 * Preview venues that can be fixed using the category tag fallback.
 *
 * NOTE (February 1, 2026): This tool was created to fix an issue where venues
 * created via MappingBitcoin.com were not being properly mapped back to their
 * category/subcategory when synced from OpenStreetMap. The enrichment process
 * only used TAG_CATEGORY_MAP, but venues created through our platform have a
 * custom 'category' tag that wasn't being utilized as a fallback.
 */
export async function GET(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (!authResult.success) return authResult.response;

    try {
        const venues = await getVenueCache();

        // Find venues that:
        // 1. Have a category tag but no category/subcategory set
        // 2. Have a category tag that doesn't match their current category
        // 3. Have category but no subcategory
        const fixableVenues: Array<{
            id: number;
            name: string;
            city: string;
            country: string;
            currentCategory: string | null;
            currentSubcategory: string | null;
            tagCategory: string;
            tagSubcategory: string | null;
            canFix: boolean;
            reason: string;
        }> = [];

        const osmTagKeys = ['amenity', 'shop', 'tourism', 'leisure', 'office', 'craft', 'healthcare', 'place'];

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

            // If TAG_CATEGORY_MAP matches, skip - it's already handled
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
                let reason = "";
                if (!v.category) {
                    reason = "Missing category, can be recovered from tags";
                } else if (v.category !== tagCategory) {
                    reason = `Category mismatch: ${v.category} vs ${tagCategory}`;
                } else if (!v.subcategory && foundSubcategory) {
                    reason = `Missing subcategory, can be recovered: ${foundSubcategory}`;
                }

                fixableVenues.push({
                    id: v.id,
                    name: v.tags.name || "Unnamed",
                    city: v.city || "Unknown",
                    country: v.country || "Unknown",
                    currentCategory: v.category || null,
                    currentSubcategory: v.subcategory || null,
                    tagCategory,
                    tagSubcategory: foundSubcategory,
                    canFix: true,
                    reason,
                });
            }
        }

        return NextResponse.json({
            totalVenues: venues.length,
            fixableCount: fixableVenues.length,
            fixableVenues: fixableVenues.slice(0, 100), // Limit preview to 100
            hasMore: fixableVenues.length > 100,
            actions: fixableVenues.length > 0 ? [
                "Re-enrich categories using the custom 'category' tag from MappingBitcoin submissions",
                "Update subcategories from OSM tags (amenity, shop, etc.)",
                "Save updated venues to EnrichedVenues.json",
                "Refresh venue and tile caches",
            ] : [],
        });
    } catch (error) {
        console.error("[Admin] Error previewing category fixes:", error);
        return NextResponse.json(
            { error: "Failed to preview category fixes" },
            { status: 500 }
        );
    }
}

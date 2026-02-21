"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Locale } from "@/i18n/types";
import { getLocalizedCountryCategorySlug, getLocalizedCityCategorySlug } from "@/utils/SlugUtils";
import { CategoryAndSubcategory } from "@/constants/PlaceOsmDictionary";
import { CategoryChip } from "@/components/ui";
import Button from "@/components/ui/Button";

export interface EnrichedSubcategory {
    slugKey: string;
    category: string;
    subcategory: string;
    rawSubcategory: string;
}

interface CategoriesSidebarProps {
    country: string;
    city?: string;
    categoryAndSubcategory?: CategoryAndSubcategory;
    enrichedSubcategories: EnrichedSubcategory[];
}

/**
 * Fisher-Yates shuffle with a seeded random for consistent randomization per session
 */
function shuffleArray<T>(array: T[], seed: number): T[] {
    const shuffled = [...array];
    let currentIndex = shuffled.length;

    // Simple seeded random
    const seededRandom = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };

    while (currentIndex > 0) {
        const randomIndex = Math.floor(seededRandom() * currentIndex);
        currentIndex--;
        [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
    }

    return shuffled;
}

export default function CategoriesSidebar({
    country,
    city,
    categoryAndSubcategory,
    enrichedSubcategories,
}: CategoriesSidebarProps) {
    const t = useTranslations();
    const locale = useLocale() as Locale;
    const [categoriesShown, setCategoriesShown] = useState(8);

    // Filter out current category if viewing a category page
    const filteredCategories = useMemo(() => {
        if (!categoryAndSubcategory) {
            return enrichedSubcategories;
        }
        return enrichedSubcategories.filter(
            (cat) => cat.rawSubcategory !== categoryAndSubcategory.subcategory
        );
    }, [enrichedSubcategories, categoryAndSubcategory]);

    // Randomize the order using a seed based on location for consistency
    const randomizedCategories = useMemo(() => {
        const seed = (country + (city || "")).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return shuffleArray(filteredCategories, seed);
    }, [filteredCategories, country, city]);

    if (randomizedCategories.length === 0) {
        return null;
    }

    const visibleCategories = randomizedCategories.slice(0, categoriesShown);
    const hasMore = randomizedCategories.length > categoriesShown;
    const location = city ? `${city}, ${country}` : country;

    // Determine the heading based on context
    const headingKey = categoryAndSubcategory
        ? "countries.suggestions.otherCategories"
        : "countries.suggestions.categoriesIn";

    return (
        <div className="bg-surface rounded-card p-5 border border-border-light">
            <h3 className="text-sm font-semibold text-white mb-3">
                {t.has(headingKey)
                    ? t(headingKey, { location })
                    : categoryAndSubcategory
                        ? `Other categories in ${location}`
                        : `Categories in ${location}`}
            </h3>

            {/* Category List */}
            <div className="flex flex-wrap gap-1.5">
                {visibleCategories.map((cat) => {
                    // Generate the correct slug based on whether we have a city
                    const slugKey = city
                        ? getLocalizedCityCategorySlug(country, city, cat.rawSubcategory, locale)
                        : getLocalizedCountryCategorySlug(country, cat.rawSubcategory, locale);

                    return slugKey && (
                        <CategoryChip
                            as="div"
                            category={cat.category ?? "other"}
                            key={cat.slugKey}
                            className="text-xs"
                        >
                            <Link
                                href={`/${slugKey}`}
                                className="text-white hover:text-accent no-underline transition-colors"
                            >
                                {cat.subcategory}
                            </Link>
                        </CategoryChip>
                    );
                })}
            </div>

            {hasMore && (
                <Button
                    onClick={() => setCategoriesShown((prev) => prev + 8)}
                    variant="ghost"
                    color="accent"
                    size="xs"
                    className="mt-3"
                >
                    {t("countries.filters.showMore")} (+{Math.min(8, randomizedCategories.length - categoriesShown)})
                </Button>
            )}
        </div>
    );
}

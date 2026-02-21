"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Locale } from "@/i18n/types";
import { PLACE_CATEGORIES, PLACE_SUBTYPE_MAP, PlaceCategory } from "@/constants/PlaceCategories";
import { SearchIcon } from "@/assets/icons/ui";

// Category icons mapping - using simple SVG icons
const CATEGORY_ICONS: Record<PlaceCategory, React.ReactNode> = {
    automotive: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
            <path d="M7 17a2 2 0 100-4 2 2 0 000 4zM17 17a2 2 0 100-4 2 2 0 000 4z" />
            <path d="M5 17H3v-6l2-5h10l4 5h2v6h-2m-4 0H9" />
        </svg>
    ),
    business: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
            <path d="M20 7h-4V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3H4a1 1 0 00-1 1v11a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1zM10 5h4v2h-4V5z" />
        </svg>
    ),
    culture: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
            <path d="M12 3L2 12h3v9h6v-6h2v6h6v-9h3L12 3z" />
        </svg>
    ),
    education: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
            <path d="M12 3L1 9l11 6 9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
        </svg>
    ),
    "entertainment-and-recreation": (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
            <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z" />
            <path d="M20 12v-2h-6V7h6V5l4 3.5-4 3.5zM4 12v-2h6V7H4V5l-4 3.5L4 12z" />
            <path d="M12 22c5.523 0 10-4.477 10-10h-2a8 8 0 01-16 0H2c0 5.523 4.477 10 10 10z" />
        </svg>
    ),
    facilities: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
            <path d="M19 10V7a2 2 0 00-2-2H7a2 2 0 00-2 2v3M3 10h18v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z" />
            <path d="M12 10v11" />
        </svg>
    ),
    finance: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            <path d="M12 6v12M8 10h8M8 14h8" />
        </svg>
    ),
    "food-and-drink": (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
            <path d="M18 8h1a4 4 0 010 8h-1" />
            <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
            <path d="M6 1v3M10 1v3M14 1v3" />
        </svg>
    ),
    "geographical-areas": (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
    ),
    government: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
            <path d="M12 2L2 7v2h20V7L12 2zM4 11v8h3v-8H4zM10 11v8h4v-8h-4zM17 11v8h3v-8h-3zM2 21h20" />
        </svg>
    ),
    "health-and-wellness": (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    ),
    housing: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <path d="M9 22V12h6v10" />
        </svg>
    ),
    lodging: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
            <path d="M3 21V7a2 2 0 012-2h14a2 2 0 012 2v14" />
            <path d="M3 11h18M7 11V5M17 11V5M3 15h18" />
        </svg>
    ),
    "natural-features": (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
            <path d="M12 2L2 22h20L12 2z" />
            <path d="M12 12v6" />
        </svg>
    ),
    "places-of-worship": (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
            <path d="M12 2v4M12 6l6 4v12H6V10l6-4z" />
            <path d="M9 22v-6h6v6" />
        </svg>
    ),
    services: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
            <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
        </svg>
    ),
    shopping: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <path d="M3 6h18M16 10a4 4 0 01-8 0" />
        </svg>
    ),
    sports: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a10 10 0 0110 10M2 12h20M12 2v20" />
        </svg>
    ),
    transportation: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
            <path d="M4 15l4-8h8l4 8" />
            <path d="M4 15h16v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4z" />
            <circle cx="7" cy="20" r="1" />
            <circle cx="17" cy="20" r="1" />
        </svg>
    ),
};

interface CategoryInfo {
    key: PlaceCategory;
    label: string;
    subcategories: { key: string; label: string }[];
}

interface CategoriesClientProps {
    availableSubcategories: string[];
}

export default function CategoriesClient({ availableSubcategories }: CategoriesClientProps) {
    const availableSet = useMemo(() => new Set(availableSubcategories), [availableSubcategories]);
    const t = useTranslations("categories");
    const locale = useLocale() as Locale;
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedCategory, setExpandedCategory] = useState<PlaceCategory | null>(null);

    // Build categories data, filtering to only show subcategories with actual venue data
    const categories = useMemo(() => {
        const categoriesData = PLACE_CATEGORIES[locale];
        return (Object.keys(PLACE_SUBTYPE_MAP) as PlaceCategory[])
            .filter((key) => key !== "geographical-areas") // Hide geographical areas
            .map((key): CategoryInfo => ({
                key,
                label: categoriesData[key]?.label || key.replace(/-/g, " "),
                subcategories: PLACE_SUBTYPE_MAP[key]
                    .filter((subKey) => availableSet.has(subKey)) // Only show subcategories with data
                    .map((subKey) => ({
                        key: subKey,
                        label: categoriesData[key]?.types?.[subKey as keyof typeof categoriesData[typeof key]["types"]] || subKey.replace(/_/g, " "),
                    })),
            }))
            .filter((cat) => cat.subcategories.length > 0); // Hide categories with no available subcategories
    }, [locale, availableSet]);

    // Filter by search
    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return categories;
        const query = searchQuery.toLowerCase();
        return categories.filter((cat) => {
            // Match category name
            if (cat.label.toLowerCase().includes(query)) return true;
            // Match any subcategory
            return cat.subcategories.some((sub) => sub.label.toLowerCase().includes(query));
        });
    }, [categories, searchQuery]);

    // Count matching subcategories for display
    const getMatchingSubcategories = (cat: CategoryInfo) => {
        if (!searchQuery.trim()) return cat.subcategories;
        const query = searchQuery.toLowerCase();
        if (cat.label.toLowerCase().includes(query)) return cat.subcategories;
        return cat.subcategories.filter((sub) => sub.label.toLowerCase().includes(query));
    };

    const getSubcategoryUrl = (subcategory: string) => {
        // Link to the subcategory page showing countries
        return `/categories/${subcategory}`;
    };

    return (
        <div className="w-full py-8 px-8 max-md:px-4">
            <div className="max-w-container mx-auto">
                {/* Search Bar */}
                <div className="mb-8">
                    <div className="relative max-w-md mx-auto">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
                        <input
                            type="text"
                            placeholder={t("search.placeholder")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-surface border border-border-light rounded-card text-white placeholder:text-text-light focus:outline-none focus:border-accent"
                        />
                    </div>
                </div>

                {/* Categories Grid */}
                {filteredCategories.length === 0 ? (
                    <div className="text-center py-16 px-8 bg-surface rounded-card border border-border-light">
                        <SearchIcon className="mx-auto text-text-light mb-4 w-16 h-16" />
                        <h3 className="text-lg font-semibold text-white mb-2">{t("search.noResults")}</h3>
                        <p className="text-text-light mb-4">{t("search.noResultsDescription", { query: searchQuery })}</p>
                        <button
                            onClick={() => setSearchQuery("")}
                            className="px-4 py-2 bg-accent text-white rounded-btn text-sm font-medium hover:bg-accent-dark transition-colors cursor-pointer"
                        >
                            {t("search.clearSearch")}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredCategories.map((cat) => {
                            const isExpanded = expandedCategory === cat.key;
                            const matchingSubs = getMatchingSubcategories(cat);
                            const displaySubs = isExpanded ? matchingSubs : matchingSubs.slice(0, 6);
                            const hasMore = matchingSubs.length > 6;

                            return (
                                <div
                                    key={cat.key}
                                    className="bg-surface rounded-card border border-border-light p-4 hover:border-accent/50 transition-colors"
                                >
                                    {/* Category Header */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="text-accent">
                                            {CATEGORY_ICONS[cat.key] || (
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
                                                    <circle cx="12" cy="12" r="10" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-white font-semibold capitalize">
                                            {cat.label}
                                        </span>
                                        <span className="ml-auto text-xs text-text-light bg-surface-light px-2 py-0.5 rounded">
                                            {cat.subcategories.length}
                                        </span>
                                    </div>

                                    {/* Subcategories */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {displaySubs.map((sub) => (
                                            <Link
                                                key={sub.key}
                                                href={getSubcategoryUrl(sub.key)}
                                                className="text-xs px-2 py-1 rounded-sm bg-surface-light/80 text-text-light border border-border-light/50 border-dashed hover:text-accent hover:border-accent/50 transition-colors capitalize"
                                            >
                                                {sub.label}
                                            </Link>
                                        ))}
                                    </div>

                                    {/* Show More / Less */}
                                    {hasMore && (
                                        <button
                                            onClick={() => setExpandedCategory(isExpanded ? null : cat.key)}
                                            className="mt-2 text-xs text-accent hover:text-accent-light transition-colors cursor-pointer"
                                        >
                                            {isExpanded
                                                ? t("showLess")
                                                : `+${matchingSubs.length - 6} ${t("showMore")}`}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

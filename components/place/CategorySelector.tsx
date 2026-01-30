"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Locale } from "@/i18n/types";
import {
    getCategoriesByLocale,
    getSubcategoryLabel,
    PLACE_CATEGORIES,
    PLACE_SUBTYPE_MAP,
    PlaceCategory
} from "@/constants/PlaceCategories";
import {
    ChevronRightIcon,
    ChevronDownIcon,
    CloseIcon,
    FolderIcon,
    CheckmarkIcon,
    PlusIcon,
} from "@/assets/icons";

interface CategorySelectorProps {
    category: PlaceCategory | '';
    subcategory: string;
    onCategoryChange: (category: PlaceCategory | '') => void;
    onSubcategoryChange: (subcategory: string) => void;
    onSuggestSubcategory?: (suggestion: string) => void;
    required?: boolean;
}

export default function CategorySelector({
    category,
    subcategory,
    onCategoryChange,
    onSubcategoryChange,
    onSuggestSubcategory,
    required = false,
}: CategorySelectorProps) {
    const locale = useLocale() as Locale;
    const t = useTranslations('venues.form');
    const allCategories = useMemo(() => getCategoriesByLocale(locale), [locale]);

    const [search, setSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [showSuggestInput, setShowSuggestInput] = useState(false);
    const [suggestValue, setSuggestValue] = useState('');

    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
                setShowSuggestInput(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Get available subcategories for selected category
    const availableSubcategories = useMemo(() => {
        if (!category) return [];
        return PLACE_SUBTYPE_MAP[category] || [];
    }, [category]);

    // Filter categories and subcategories based on search
    const filteredResults = useMemo(() => {
        const searchLower = search.toLowerCase();
        const results: { type: 'category' | 'subcategory'; category: PlaceCategory; subcategory?: string; label: string }[] = [];

        // If category is already selected, only show subcategories
        if (category) {
            const subs = PLACE_SUBTYPE_MAP[category] || [];
            for (const sub of subs) {
                const label = getSubcategoryLabel(locale, category, sub) || sub;
                if (!searchLower || label.toLowerCase().includes(searchLower)) {
                    results.push({
                        type: 'subcategory',
                        category,
                        subcategory: sub,
                        label
                    });
                }
            }
        } else {
            // Show categories that match, and subcategories within matching categories
            for (const cat of allCategories) {
                const catLabel = PLACE_CATEGORIES[locale][cat].label;
                const catMatches = !searchLower || catLabel.toLowerCase().includes(searchLower);

                if (catMatches) {
                    results.push({
                        type: 'category',
                        category: cat,
                        label: catLabel
                    });
                }

                // Also search subcategories
                if (searchLower) {
                    const subs = PLACE_SUBTYPE_MAP[cat] || [];
                    for (const sub of subs) {
                        const subLabel = getSubcategoryLabel(locale, cat, sub) || sub;
                        if (subLabel.toLowerCase().includes(searchLower)) {
                            results.push({
                                type: 'subcategory',
                                category: cat,
                                subcategory: sub,
                                label: `${subLabel} (${catLabel})`
                            });
                        }
                    }
                }
            }
        }

        return results;
    }, [allCategories, category, locale, search]);

    const handleSelect = (item: typeof filteredResults[0]) => {
        if (item.type === 'category') {
            onCategoryChange(item.category);
            onSubcategoryChange('');
            setSearch('');
        } else if (item.subcategory) {
            if (item.category !== category) {
                onCategoryChange(item.category);
            }
            onSubcategoryChange(item.subcategory);
            setSearch('');
            setShowDropdown(false);
        }
    };

    const handleClear = () => {
        onCategoryChange('');
        onSubcategoryChange('');
        setSearch('');
    };

    const handleSuggestSubmit = () => {
        if (suggestValue.trim() && onSuggestSubcategory) {
            onSuggestSubcategory(suggestValue.trim());
            setSuggestValue('');
            setShowSuggestInput(false);
        }
    };

    const getCategoryLabel = (cat: PlaceCategory) => {
        return PLACE_CATEGORIES[locale]?.[cat]?.label || cat;
    };

    const getDisplayValue = () => {
        if (subcategory && category) {
            const subLabel = getSubcategoryLabel(locale, category as PlaceCategory, subcategory) || subcategory;
            return `${getCategoryLabel(category as PlaceCategory)} / ${subLabel}`;
        }
        if (category) {
            return getCategoryLabel(category as PlaceCategory);
        }
        return '';
    };

    return (
        <div ref={containerRef} className="relative">
            <label className="text-sm font-medium text-white block mb-1.5">
                {t('selectCategory')}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>

            {/* Selected display */}
            {(category || subcategory) && !showDropdown && (
                <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 flex items-center gap-2 flex-wrap">
                        {category && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-sm font-medium">
                                {subcategory ? (
                                    <>
                                        {getCategoryLabel(category as PlaceCategory)}
                                        <ChevronRightIcon className="w-3 h-3" />
                                        {getSubcategoryLabel(locale, category as PlaceCategory, subcategory) || subcategory}
                                    </>
                                ) : (
                                    getCategoryLabel(category as PlaceCategory)
                                )}
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="ml-1 hover:text-accent-dark transition-colors"
                                >
                                    <CloseIcon className="w-4 h-4" />
                                </button>
                            </span>
                        )}
                    </div>
                    {category && !subcategory && (
                        <button
                            type="button"
                            onClick={() => setShowDropdown(true)}
                            className="text-xs text-accent hover:underline"
                        >
                            Select subcategory
                        </button>
                    )}
                </div>
            )}

            {/* Search Input */}
            <div
                className="relative cursor-pointer"
                onClick={() => setShowDropdown(true)}
            >
                <input
                    type="text"
                    value={showDropdown ? search : getDisplayValue()}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder={category ? "Search subcategories..." : "Search categories..."}
                    className="w-full py-2.5 px-3.5 pr-10 border border-border-light rounded-xl text-sm text-white bg-surface-light
                        placeholder:text-text-light/60
                        focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent
                        transition-all duration-200"
                />
                <ChevronDownIcon
                    className={`w-5 h-5 text-text-light absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                />
            </div>

            {/* Category breadcrumb */}
            {category && showDropdown && (
                <div className="flex items-center gap-1 mt-1.5 text-xs text-text-light">
                    <button
                        type="button"
                        onClick={() => {
                            onCategoryChange('');
                            onSubcategoryChange('');
                            setSearch('');
                        }}
                        className="hover:text-accent"
                    >
                        All categories
                    </button>
                    <ChevronRightIcon className="w-3 h-3" />
                    <span className="font-medium text-white">{getCategoryLabel(category as PlaceCategory)}</span>
                </div>
            )}

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-surface-light border border-border-light rounded-xl shadow-lg max-h-64 overflow-y-auto">
                    {filteredResults.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-text-light">
                            No results found
                            {search && onSuggestSubcategory && category && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSuggestValue(search);
                                        setShowSuggestInput(true);
                                    }}
                                    className="block mt-1 text-accent hover:underline"
                                >
                                    Suggest &quot;{search}&quot; as new subcategory?
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredResults.map((item, index) => (
                            <button
                                key={`${item.type}-${item.category}-${item.subcategory || index}`}
                                type="button"
                                onClick={() => handleSelect(item)}
                                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors
                                    ${item.type === 'subcategory' && item.subcategory === subcategory
                                        ? 'bg-accent/10 text-accent font-medium'
                                        : 'text-white hover:bg-surface'
                                    }
                                `}
                            >
                                {item.type === 'category' ? (
                                    <>
                                        <FolderIcon className="w-4 h-4 text-text-light" />
                                        <span>{item.label}</span>
                                        <ChevronRightIcon className="w-4 h-4 text-text-light ml-auto" />
                                    </>
                                ) : (
                                    <>
                                        <span className="w-4" />
                                        <span>{item.label}</span>
                                        {item.subcategory === subcategory && (
                                            <CheckmarkIcon className="w-4 h-4 text-accent ml-auto" />
                                        )}
                                    </>
                                )}
                            </button>
                        ))
                    )}

                    {/* Suggest new subcategory */}
                    {onSuggestSubcategory && category && (
                        <div className="border-t border-border-light">
                            {!showSuggestInput ? (
                                <button
                                    type="button"
                                    onClick={() => setShowSuggestInput(true)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-text-light hover:text-accent hover:bg-surface flex items-center gap-2 transition-colors"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Suggest a new subcategory
                                </button>
                            ) : (
                                <div className="p-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={suggestValue}
                                            onChange={(e) => setSuggestValue(e.target.value)}
                                            placeholder="Enter subcategory name..."
                                            className="flex-1 py-2 px-3 border border-border-light rounded-lg text-sm
                                                focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleSuggestSubmit();
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSuggestSubmit}
                                            className="px-3 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <p className="text-xs text-text-light mt-1.5">
                                        Suggestions are reviewed before being added
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

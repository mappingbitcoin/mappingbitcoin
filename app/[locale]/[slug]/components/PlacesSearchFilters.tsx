"use client";

import { useRef, useEffect, useState, useMemo, ComponentType } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Locale } from "@/i18n/types";
import { PAYMENT_METHODS } from "@/constants/PaymentMethods";
import { PlaceSubcategory, matchPlaceSubcategory, getSubcategoryLabel } from "@/constants/PlaceCategories";
import { getLocalizedCountryCategorySlug } from "@/utils/SlugUtils";
import { IconProps } from "@/assets/icons";
import {
    SearchIcon,
    CloseIcon,
    FilterIcon,
    PlusIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    ExternalLinkIcon,
} from "@/assets/icons/ui";
import {
    LightningIcon,
    LightningContactlessIcon,
    OnchainIcon,
    CardIcon,
    ContactlessIcon,
} from "@/assets/icons/payment";

const PAYMENT_ICON_MAP: Record<string, ComponentType<IconProps>> = {
    lightning: LightningIcon,
    lightning_contactless: LightningContactlessIcon,
    onchain: OnchainIcon,
    debit_cards: CardIcon,
    credit_cards: CardIcon,
    contactless: ContactlessIcon,
};

const PaymentIcon = ({ type, className }: { type: string; className?: string }) => {
    const IconComponent = PAYMENT_ICON_MAP[type];
    if (!IconComponent) return null;
    return <IconComponent className={className || "w-3.5 h-3.5"} />;
};

interface VenueSearchFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedCategories: Set<string>;
    selectedPayments: Set<string>;
    availableSubcategories?: PlaceSubcategory[];
    country: string;
    onToggleCategory: (subcategory: string) => void;
    onToggleAllCategories: (allSubcategories: string[]) => void;
    onTogglePayment: (paymentType: string) => void;
    onOpenFiltersModal: () => void;
    hasActiveFilters: boolean;
}

export default function VenueSearchFilters({
    searchQuery,
    onSearchChange,
    selectedCategories,
    selectedPayments,
    availableSubcategories,
    country,
    onToggleCategory,
    onToggleAllCategories,
    onTogglePayment,
    onOpenFiltersModal,
    hasActiveFilters,
}: VenueSearchFiltersProps) {
    const t = useTranslations();
    const locale = useLocale() as Locale;
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);
    const [expandedCategorySections, setExpandedCategorySections] = useState<Set<string>>(new Set());
    const categoryDropdownRef = useRef<HTMLDivElement>(null);
    const paymentDropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
                setCategoryDropdownOpen(false);
            }
            if (paymentDropdownRef.current && !paymentDropdownRef.current.contains(event.target as Node)) {
                setPaymentDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const enrichedSubcategories = useMemo(() => {
        if (!availableSubcategories) return [];
        const seen = new Map();
        availableSubcategories.forEach((cat) => {
            const slugKey = getLocalizedCountryCategorySlug(country, cat, locale);
            const match = matchPlaceSubcategory(cat);
            if (match) {
                const key = slugKey;
                if (!seen.has(key)) {
                    seen.set(key, {
                        ...match,
                        slugKey,
                        rawSubcategory: cat,
                        subcategory: getSubcategoryLabel(locale, match.category, match.subcategory),
                    });
                }
            }
        });
        return Array.from(seen.values());
    }, [availableSubcategories, country, locale]);

    const groupedCategories = useMemo(() => {
        const groups: Record<string, typeof enrichedSubcategories> = {};
        enrichedSubcategories.forEach((cat) => {
            const parentCategory = cat.category || "other";
            if (!groups[parentCategory]) {
                groups[parentCategory] = [];
            }
            groups[parentCategory].push(cat);
        });
        return groups;
    }, [enrichedSubcategories]);

    const getCategoryDisplayName = (category: string) => {
        return category.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    };

    const toggleCategorySection = (category: string) => {
        setExpandedCategorySections(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    const toggleSectionCategories = (sectionCategories: typeof enrichedSubcategories) => {
        const rawSubcategories = sectionCategories.map(c => c.rawSubcategory);
        const allSelected = rawSubcategories.every(sub => selectedCategories.has(sub));
        rawSubcategories.forEach(sub => {
            if (allSelected) {
                if (selectedCategories.has(sub)) onToggleCategory(sub);
            } else {
                if (!selectedCategories.has(sub)) onToggleCategory(sub);
            }
        });
    };

    return (
        <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px]">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={t("countries.search.placeholder")}
                    className="w-full py-2 pl-9 pr-4 bg-surface border border-border-light rounded-btn text-sm text-white placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light w-4 h-4" />
                {searchQuery && (
                    <button
                        onClick={() => onSearchChange("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-white transition-colors cursor-pointer"
                    >
                        <CloseIcon className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Mobile: Filters Icon Button */}
            <button
                onClick={onOpenFiltersModal}
                className="md:hidden relative flex items-center justify-center w-[38px] h-[38px] bg-surface border border-border-light rounded-btn text-white hover:border-accent/50 hover:bg-surface-light transition-all cursor-pointer"
                title={t("countries.filters.label")}
            >
                <FilterIcon className="w-4 h-4" />
                {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-surface" />
                )}
            </button>

            {/* Mobile: Add Venue Icon Button */}
            <Link
                href="/places/create"
                className="md:hidden flex items-center justify-center w-[38px] h-[38px] bg-accent text-white rounded-btn shadow-soft hover:bg-accent-dark transition-all"
                target="_blank"
                rel="noopener noreferrer"
                title={t("countries.actions.addPlace")}
            >
                <PlusIcon className="w-4 h-4" />
            </Link>

            {/* Desktop: Categories Dropdown */}
            {enrichedSubcategories.length > 0 && (
                <div className="relative hidden md:block" ref={categoryDropdownRef}>
                    <button
                        onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                        className="flex items-center gap-2 py-2 px-3 bg-surface border border-border-light rounded-btn text-sm text-white hover:border-accent/50 hover:bg-surface-light transition-all cursor-pointer"
                    >
                        <span>{t("countries.filters.categories")}</span>
                        {selectedCategories.size < (availableSubcategories?.length || 0) && (
                            <span className="bg-accent text-white text-xs px-1.5 py-0.5 rounded-full">
                                {selectedCategories.size}
                            </span>
                        )}
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${categoryDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {categoryDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-72 bg-surface border border-border-light rounded-card shadow-medium z-20 max-h-96 overflow-y-auto">
                            <div className="p-2 border-b border-border-light flex items-center justify-between">
                                <button
                                    onClick={() => onToggleAllCategories(availableSubcategories || [])}
                                    className="text-xs text-accent hover:text-accent-dark transition-colors cursor-pointer"
                                >
                                    {selectedCategories.size === (availableSubcategories?.length || 0)
                                        ? t("countries.filters.deselectAll")
                                        : t("countries.filters.selectAll")}
                                </button>
                            </div>
                            <div className="p-1">
                                {Object.entries(groupedCategories).map(([parentCategory, subcategories]) => {
                                    const isExpanded = expandedCategorySections.has(parentCategory);
                                    const selectedInSection = subcategories.filter(c => selectedCategories.has(c.rawSubcategory)).length;
                                    const allSelectedInSection = selectedInSection === subcategories.length;

                                    return (
                                        <div key={parentCategory} className="mb-1">
                                            <button
                                                onClick={() => toggleCategorySection(parentCategory)}
                                                className="w-full flex items-center justify-between gap-2 py-2 px-2 hover:bg-primary-light rounded cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <ChevronRightIcon className={`w-3 h-3 text-text-light transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                                    <span className="text-sm font-medium text-white">{getCategoryDisplayName(parentCategory)}</span>
                                                </div>
                                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${allSelectedInSection ? "bg-accent/10 text-accent" : "bg-primary-light text-text-light"}`}>
                                                    {allSelectedInSection ? "All" : `${selectedInSection}/${subcategories.length}`}
                                                </span>
                                            </button>
                                            {isExpanded && (
                                                <div className="ml-3 pl-2 border-l border-border-light">
                                                    <button
                                                        onClick={() => toggleSectionCategories(subcategories)}
                                                        className="text-xs text-accent hover:text-accent-dark py-1 px-2 cursor-pointer"
                                                    >
                                                        {allSelectedInSection ? "Deselect all" : "Select all"}
                                                    </button>
                                                    {subcategories.map(({ slugKey, subcategory, rawSubcategory }) => {
                                                        const isSelected = selectedCategories.has(rawSubcategory);
                                                        return (
                                                            <div key={slugKey} className="flex items-center justify-between gap-2 py-1 px-2 hover:bg-primary-light rounded">
                                                                <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        onChange={() => onToggleCategory(rawSubcategory)}
                                                                        className="w-3.5 h-3.5 rounded border-border-light text-accent focus:ring-accent/20 cursor-pointer"
                                                                    />
                                                                    <span className="text-xs text-text-light truncate">{subcategory}</span>
                                                                </label>
                                                                <Link
                                                                    href={`/${slugKey}`}
                                                                    className="text-text-light hover:text-accent transition-colors shrink-0"
                                                                    title={t("countries.filters.goToCategory")}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <ExternalLinkIcon className="w-3 h-3" />
                                                                </Link>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Desktop: Payment Dropdown */}
            <div className="relative hidden md:block" ref={paymentDropdownRef}>
                <button
                    onClick={() => setPaymentDropdownOpen(!paymentDropdownOpen)}
                    className="flex items-center gap-2 py-2 px-3 bg-surface border border-border-light rounded-btn text-sm text-white hover:border-accent/50 hover:bg-surface-light transition-all cursor-pointer"
                >
                    <span>{t("countries.filters.paymentLabel")}</span>
                    {selectedPayments.size < Object.keys(PAYMENT_METHODS).length && (
                        <span className="bg-accent text-white text-xs px-1.5 py-0.5 rounded-full">
                            {selectedPayments.size}
                        </span>
                    )}
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${paymentDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {paymentDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-surface border border-border-light rounded-card shadow-medium z-20">
                        <ul className="p-2">
                            {Object.entries(PAYMENT_METHODS).map(([type, info]) => {
                                const isSelected = selectedPayments.has(type);
                                return (
                                    <li key={type} className="py-1.5 px-2 hover:bg-primary-light rounded">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => onTogglePayment(type)}
                                                className="w-4 h-4 rounded border-border-light text-accent focus:ring-accent/20 cursor-pointer"
                                            />
                                            <span className="flex items-center gap-1.5 text-sm text-text-light">
                                                <span className="text-accent"><PaymentIcon type={type} /></span>
                                                {info.label}
                                            </span>
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

"use client";

import { useState, useMemo, ComponentType } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Locale } from "@/i18n/types";
import { PAYMENT_METHODS } from "@/constants/PaymentMethods";
import { PlaceSubcategory, matchPlaceSubcategory, getSubcategoryLabel } from "@/constants/PlaceCategories";
import { getLocalizedCountryCategorySlug } from "@/utils/SlugUtils";
import { IconProps } from "@/assets/icons";
import { CloseIcon, ChevronRightIcon } from "@/assets/icons/ui";
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

interface MobileFiltersSheetProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCategories: Set<string>;
    selectedPayments: Set<string>;
    availableSubcategories?: PlaceSubcategory[];
    country: string;
    onToggleCategory: (subcategory: string) => void;
    onToggleAllCategories: (allSubcategories: string[]) => void;
    onTogglePayment: (paymentType: string) => void;
}

export default function MobileFiltersSheet({
    isOpen,
    onClose,
    selectedCategories,
    selectedPayments,
    availableSubcategories,
    country,
    onToggleCategory,
    onToggleAllCategories,
    onTogglePayment,
}: MobileFiltersSheetProps) {
    const t = useTranslations();
    const locale = useLocale() as Locale;
    const [expandedCategorySections, setExpandedCategorySections] = useState<Set<string>>(new Set());
    const [categoriesFilterExpanded, setCategoriesFilterExpanded] = useState(false);
    const [paymentFilterExpanded, setPaymentFilterExpanded] = useState(false);

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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 md:hidden" onClick={onClose}>
            <div
                className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="sticky top-0 bg-surface border-b border-border-light px-4 py-3 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">{t("countries.filters.label")}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-text-light hover:text-white transition-colors cursor-pointer"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-3">
                    {/* Categories Filter */}
                    {enrichedSubcategories.length > 0 && (
                        <div className="border border-border-light rounded-xl overflow-hidden">
                            <button
                                onClick={() => setCategoriesFilterExpanded(!categoriesFilterExpanded)}
                                className="w-full flex items-center justify-between gap-2 py-4 px-4 bg-primary-light cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <ChevronRightIcon className={`w-5 h-5 text-text-light transition-transform ${categoriesFilterExpanded ? "rotate-90" : ""}`} />
                                    <span className="text-base font-semibold text-white">{t("countries.filters.categories")}</span>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${selectedCategories.size === (availableSubcategories?.length || 0) ? "bg-accent/10 text-accent" : "bg-surface text-text-light border border-border-light"}`}>
                                    {selectedCategories.size === (availableSubcategories?.length || 0) ? "All" : `${selectedCategories.size}/${availableSubcategories?.length || 0}`}
                                </span>
                            </button>

                            {categoriesFilterExpanded && (
                                <div className="px-4 pb-4 bg-surface">
                                    <div className="flex justify-end mb-3">
                                        <button
                                            onClick={() => onToggleAllCategories(availableSubcategories || [])}
                                            className="text-xs text-accent hover:text-accent-dark transition-colors cursor-pointer"
                                        >
                                            {selectedCategories.size === (availableSubcategories?.length || 0) ? t("countries.filters.deselectAll") : t("countries.filters.selectAll")}
                                        </button>
                                    </div>
                                    <div className="space-y-1">
                                        {Object.entries(groupedCategories).map(([parentCategory, subcategories]) => {
                                            const isExpanded = expandedCategorySections.has(parentCategory);
                                            const selectedInSection = subcategories.filter(c => selectedCategories.has(c.rawSubcategory)).length;
                                            const allSelectedInSection = selectedInSection === subcategories.length;

                                            return (
                                                <div key={parentCategory} className="border border-border-light rounded-lg overflow-hidden">
                                                    <button
                                                        onClick={() => toggleCategorySection(parentCategory)}
                                                        className="w-full flex items-center justify-between gap-2 py-2.5 px-3 bg-primary-light cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <ChevronRightIcon className={`w-3.5 h-3.5 text-text-light transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                                            <span className="text-sm font-medium text-white">{getCategoryDisplayName(parentCategory)}</span>
                                                        </div>
                                                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${allSelectedInSection ? "bg-accent/10 text-accent" : "bg-surface text-text-light"}`}>
                                                            {allSelectedInSection ? "All" : `${selectedInSection}/${subcategories.length}`}
                                                        </span>
                                                    </button>

                                                    {isExpanded && (
                                                        <div className="px-3 pb-3 pt-1 bg-surface">
                                                            <button
                                                                onClick={() => toggleSectionCategories(subcategories)}
                                                                className="text-xs text-accent hover:text-accent-dark mb-2 cursor-pointer"
                                                            >
                                                                {allSelectedInSection ? "Deselect all" : "Select all"}
                                                            </button>
                                                            <div className="space-y-1">
                                                                {subcategories.map(({ slugKey, subcategory, rawSubcategory }) => {
                                                                    const isSelected = selectedCategories.has(rawSubcategory);
                                                                    return (
                                                                        <label key={slugKey} className="flex items-center gap-3 py-1.5 cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={isSelected}
                                                                                onChange={() => onToggleCategory(rawSubcategory)}
                                                                                className="w-4 h-4 rounded border-border-light text-accent focus:ring-accent/20 cursor-pointer"
                                                                            />
                                                                            <span className="text-sm text-text-light">{subcategory}</span>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
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

                    {/* Payment Methods Filter */}
                    <div className="border border-border-light rounded-xl overflow-hidden">
                        <button
                            onClick={() => setPaymentFilterExpanded(!paymentFilterExpanded)}
                            className="w-full flex items-center justify-between gap-2 py-4 px-4 bg-primary-light cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <ChevronRightIcon className={`w-5 h-5 text-text-light transition-transform ${paymentFilterExpanded ? "rotate-90" : ""}`} />
                                <span className="text-base font-semibold text-white">{t("countries.filters.paymentLabel")}</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${selectedPayments.size === Object.keys(PAYMENT_METHODS).length ? "bg-accent/10 text-accent" : "bg-surface text-text-light border border-border-light"}`}>
                                {selectedPayments.size === Object.keys(PAYMENT_METHODS).length ? "All" : `${selectedPayments.size}/${Object.keys(PAYMENT_METHODS).length}`}
                            </span>
                        </button>

                        {paymentFilterExpanded && (
                            <div className="px-4 pb-4 bg-surface">
                                <div className="space-y-2">
                                    {Object.entries(PAYMENT_METHODS).map(([type, info]) => {
                                        const isSelected = selectedPayments.has(type);
                                        return (
                                            <label key={type} className="flex items-center gap-3 py-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => onTogglePayment(type)}
                                                    className="w-5 h-5 rounded border-border-light text-accent focus:ring-accent/20 cursor-pointer"
                                                />
                                                <span className="flex items-center gap-2 text-sm text-text-light">
                                                    <span className="text-accent"><PaymentIcon type={type} /></span>
                                                    {info.label}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Apply Button */}
                <div className="sticky bottom-0 bg-surface border-t border-border-light p-4">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-accent text-white rounded-btn font-medium hover:bg-accent-dark transition-colors cursor-pointer"
                    >
                        {t("countries.filters.applyFilters")}
                    </button>
                </div>
            </div>
        </div>
    );
}

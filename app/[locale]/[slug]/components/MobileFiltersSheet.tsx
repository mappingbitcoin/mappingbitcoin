"use client";

import { useState, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Locale } from "@/i18n/types";
import { PAYMENT_METHODS } from "@/constants/PaymentMethods";
import { PaymentIcon } from "@/constants/PaymentIcons";
import { PlaceSubcategory, matchPlaceSubcategory, getSubcategoryLabel } from "@/constants/PlaceCategories";
import { getLocalizedCountryCategorySlug } from "@/utils/SlugUtils";
import { CloseIcon, ChevronRightIcon } from "@/assets/icons/ui";
import Button, { IconButton } from "@/components/ui/Button";
import AccordionButton from "@/components/ui/AccordionButton";

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
                    <IconButton
                        onClick={onClose}
                        icon={<CloseIcon className="w-5 h-5" />}
                        aria-label="Close"
                        variant="ghost"
                        color="neutral"
                    />
                </div>

                <div className="p-4 space-y-3">
                    {/* Categories Filter */}
                    {enrichedSubcategories.length > 0 && (
                        <div className="border border-border-light rounded-xl overflow-hidden">
                            <AccordionButton
                                expanded={categoriesFilterExpanded}
                                expandIcon={<ChevronRightIcon className="w-5 h-5" />}
                                onClick={() => setCategoriesFilterExpanded(!categoriesFilterExpanded)}
                                className="py-4 px-4 bg-primary-light"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <span className="text-base font-semibold text-white">{t("countries.filters.categories")}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${selectedCategories.size === (availableSubcategories?.length || 0) ? "bg-accent/10 text-accent" : "bg-surface text-text-light border border-border-light"}`}>
                                        {selectedCategories.size === (availableSubcategories?.length || 0) ? "All" : `${selectedCategories.size}/${availableSubcategories?.length || 0}`}
                                    </span>
                                </div>
                            </AccordionButton>

                            {categoriesFilterExpanded && (
                                <div className="px-4 pb-4 bg-surface">
                                    <div className="flex justify-end mb-3">
                                        <Button
                                            onClick={() => onToggleAllCategories(availableSubcategories || [])}
                                            variant="ghost"
                                            color="accent"
                                            size="xs"
                                        >
                                            {selectedCategories.size === (availableSubcategories?.length || 0) ? t("countries.filters.deselectAll") : t("countries.filters.selectAll")}
                                        </Button>
                                    </div>
                                    <div className="space-y-1">
                                        {Object.entries(groupedCategories).map(([parentCategory, subcategories]) => {
                                            const isExpanded = expandedCategorySections.has(parentCategory);
                                            const selectedInSection = subcategories.filter(c => selectedCategories.has(c.rawSubcategory)).length;
                                            const allSelectedInSection = selectedInSection === subcategories.length;

                                            return (
                                                <div key={parentCategory} className="border border-border-light rounded-lg overflow-hidden">
                                                    <AccordionButton
                                                        expanded={isExpanded}
                                                        expandIcon={<ChevronRightIcon className="w-3.5 h-3.5" />}
                                                        onClick={() => toggleCategorySection(parentCategory)}
                                                        className="py-2.5 px-3 bg-primary-light"
                                                    >
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <span className="text-sm font-medium text-white">{getCategoryDisplayName(parentCategory)}</span>
                                                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${allSelectedInSection ? "bg-accent/10 text-accent" : "bg-surface text-text-light"}`}>
                                                                {allSelectedInSection ? "All" : `${selectedInSection}/${subcategories.length}`}
                                                            </span>
                                                        </div>
                                                    </AccordionButton>

                                                    {isExpanded && (
                                                        <div className="px-3 pb-3 pt-1 bg-surface">
                                                            <Button
                                                                onClick={() => toggleSectionCategories(subcategories)}
                                                                variant="ghost"
                                                                color="accent"
                                                                size="xs"
                                                                className="mb-2"
                                                            >
                                                                {allSelectedInSection ? "Deselect all" : "Select all"}
                                                            </Button>
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
                        <AccordionButton
                            expanded={paymentFilterExpanded}
                            expandIcon={<ChevronRightIcon className="w-5 h-5" />}
                            onClick={() => setPaymentFilterExpanded(!paymentFilterExpanded)}
                            className="py-4 px-4 bg-primary-light"
                        >
                            <div className="flex items-center gap-3 flex-1">
                                <span className="text-base font-semibold text-white">{t("countries.filters.paymentLabel")}</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${selectedPayments.size === Object.keys(PAYMENT_METHODS).length ? "bg-accent/10 text-accent" : "bg-surface text-text-light border border-border-light"}`}>
                                    {selectedPayments.size === Object.keys(PAYMENT_METHODS).length ? "All" : `${selectedPayments.size}/${Object.keys(PAYMENT_METHODS).length}`}
                                </span>
                            </div>
                        </AccordionButton>

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
                    <Button
                        onClick={onClose}
                        fullWidth
                    >
                        {t("countries.filters.applyFilters")}
                    </Button>
                </div>
            </div>
        </div>
    );
}

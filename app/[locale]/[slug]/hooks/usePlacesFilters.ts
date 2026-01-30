"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocale } from "next-intl";
import { Locale } from "@/i18n/types";
import { PAYMENT_METHODS } from "@/constants/PaymentMethods";
import { EnrichedVenue } from "@/models/Overpass";
import { PlaceSubcategory, getSubcategoryLabel } from "@/constants/PlaceCategories";
import { parseTags } from "@/utils/OsmHelpers";
import { getFormattedAddress } from "@/utils/AddressUtils";

interface UsePlacesFiltersProps {
    places: EnrichedVenue[];
    availableSubcategories?: PlaceSubcategory[];
}

export function usePlacesFilters({ places, availableSubcategories }: UsePlacesFiltersProps) {
    const locale = useLocale() as Locale;
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
    const [categoriesInitialized, setCategoriesInitialized] = useState(false);
    const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
    const [paymentsInitialized, setPaymentsInitialized] = useState(false);

    // Initialize categories - all selected by default
    useEffect(() => {
        if (availableSubcategories && availableSubcategories.length > 0 && !categoriesInitialized) {
            setSelectedCategories(new Set(availableSubcategories));
            setCategoriesInitialized(true);
        }
    }, [availableSubcategories, categoriesInitialized]);

    // Initialize payment filters - all selected by default
    useEffect(() => {
        if (!paymentsInitialized) {
            const paymentTypes = Object.keys(PAYMENT_METHODS);
            setSelectedPayments(new Set(paymentTypes));
            setPaymentsInitialized(true);
        }
    }, [paymentsInitialized]);

    // Toggle category selection
    const toggleCategory = useCallback((subcategory: string) => {
        setSelectedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(subcategory)) {
                newSet.delete(subcategory);
            } else {
                newSet.add(subcategory);
            }
            return newSet;
        });
    }, []);

    // Select/deselect all categories
    const toggleAllCategories = useCallback((allSubcategories: string[]) => {
        if (selectedCategories.size === allSubcategories.length) {
            setSelectedCategories(new Set());
        } else {
            setSelectedCategories(new Set(allSubcategories));
        }
    }, [selectedCategories.size]);

    // Toggle payment filter
    const togglePayment = useCallback((paymentType: string) => {
        setSelectedPayments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(paymentType)) {
                newSet.delete(paymentType);
            } else {
                newSet.add(paymentType);
            }
            return newSet;
        });
    }, []);

    // Filter places
    const filteredPlaces = useMemo(() => {
        return places.filter(place => {
            // Category filter
            if (selectedCategories.size > 0 && categoriesInitialized && selectedCategories.size < (availableSubcategories?.length || 0)) {
                const placeSubcategory = place.subcategory;
                if (placeSubcategory && !selectedCategories.has(placeSubcategory)) {
                    return false;
                }
            }

            // Payment filter
            if (selectedPayments.size > 0 && paymentsInitialized && selectedPayments.size < Object.keys(PAYMENT_METHODS).length) {
                const { paymentMethods } = parseTags(place.tags);
                if (paymentMethods) {
                    const placePayments = Object.entries(paymentMethods)
                        .filter(([, v]) => v === "yes")
                        .map(([type]) => type);
                    const hasSelectedPayment = placePayments.some(p => selectedPayments.has(p));
                    if (!hasSelectedPayment && placePayments.length > 0) {
                        return false;
                    }
                }
            }

            // Search filter
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase().trim();
            const { name } = parseTags(place.tags);
            const address = getFormattedAddress(locale, place);
            const subcategoryLabel = place.subcategory && place.category
                ? getSubcategoryLabel(locale, place.category, place.subcategory)
                : "";
            return (
                name?.toLowerCase().includes(query) ||
                address?.toLowerCase().includes(query) ||
                subcategoryLabel?.toLowerCase().includes(query) ||
                place.city?.toLowerCase().includes(query)
            );
        });
    }, [places, searchQuery, locale, selectedCategories, categoriesInitialized, selectedPayments, paymentsInitialized, availableSubcategories]);

    const hasActiveFilters = useMemo(() => {
        return (
            selectedCategories.size < (availableSubcategories?.length || 0) ||
            selectedPayments.size < Object.keys(PAYMENT_METHODS).length
        );
    }, [selectedCategories.size, selectedPayments.size, availableSubcategories?.length]);

    return {
        searchQuery,
        setSearchQuery,
        selectedCategories,
        selectedPayments,
        filteredPlaces,
        toggleCategory,
        toggleAllCategories,
        togglePayment,
        hasActiveFilters,
        categoriesInitialized,
        paymentsInitialized,
    };
}

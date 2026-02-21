"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Locale } from "@/i18n/types";
import moment from "moment";
import { useContainerSize } from "@/hooks/useContainerSize";
import { computeMapView } from "@/utils/MapUtils";
import { deslugify } from "@/utils/StringUtils";
import { getLocalizedCountryCategorySlug } from "@/utils/SlugUtils";
import { getLocalized } from "@/app/[locale]/[slug]/MerchantUtils";
import { EnrichedVenue } from "@/models/Overpass";
import { CategoryAndSubcategory } from "@/constants/PlaceOsmDictionary";
import { PlaceSubcategory, getSubcategoryLabel, matchPlaceSubcategory } from "@/constants/PlaceCategories";
import { SearchIcon } from "@/assets/icons/ui";
import MapFAQ from "@/app/[locale]/[slug]/MapFAQSection";
import type { CityWithCount } from "@/app/[locale]/[slug]/PlacesDirectoryWrapper";
import { usePlacesFilters } from "./hooks/usePlacesFilters";
import {
    PlacesDirectoryHero,
    PlacesSearchFilters,
    PlaceListItem,
    Pagination,
    CitiesSidebar,
    CategoriesSidebar,
    MobileFiltersSheet,
} from "./components";

const DEFAULT_PAGE_SIZE = 10;

type PlacesDirectoryProps = {
    places: EnrichedVenue[];
    exactMatch: boolean;
    city?: string;
    country: string;
    availableCities?: CityWithCount[];
    availableSubcategories?: PlaceSubcategory[];
    categoryAndSubcategory?: CategoryAndSubcategory;
};

export default function PlacesDirectory({
    places,
    city,
    country,
    categoryAndSubcategory,
    availableCities,
    availableSubcategories,
    exactMatch,
}: PlacesDirectoryProps) {
    const t = useTranslations();
    const locale = useLocale() as Locale;
    const [, size] = useContainerSize();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE);
    const [filtersModalOpen, setFiltersModalOpen] = useState(false);
    const [hoveredPlaceId, setHoveredPlaceId] = useState<number | null>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Use custom filter hook
    const {
        searchQuery,
        setSearchQuery,
        selectedCategories,
        selectedPayments,
        filteredPlaces,
        toggleCategory,
        toggleAllCategories,
        togglePayment,
        hasActiveFilters,
    } = usePlacesFilters({ places, availableSubcategories });

    // Scroll to list when page changes (but not on initial render)
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        if (listRef.current) {
            const yOffset = -100;
            const y = listRef.current.getBoundingClientRect().top + window.scrollY + yOffset;
            window.scrollTo({ top: y, behavior: "smooth" });
        }
    }, [currentPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, itemsPerPage, selectedCategories, selectedPayments]);

    // Calculate stats
    const totalPlaces = places.length;
    const filteredCount = filteredPlaces.length;
    const oneWeekAgo = useMemo(() => moment().subtract(7, "days"), []);
    const newThisWeek = useMemo(() => {
        return places.filter(place => place.timestamp && moment(place.timestamp).isAfter(oneWeekAgo)).length;
    }, [places, oneWeekAgo]);

    // Pagination
    const totalPages = Math.ceil(filteredCount / itemsPerPage);
    const paginatedPlaces = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredPlaces.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredPlaces, currentPage, itemsPerPage]);

    // Map view calculation
    const coordinates = places
        .filter(v => v.lat && v.lon && !isNaN(v.lat) && !isNaN(v.lon))
        .map(v => ({ lat: v.lat, lon: v.lon }));

    const initialViewState = useMemo(() => {
        const view = computeMapView(coordinates, size.width || 800, size.height || 400);
        return {
            longitude: isNaN(view.longitude) ? 0 : view.longitude,
            latitude: isNaN(view.latitude) ? 0 : view.latitude,
            zoom: isNaN(view.zoom) || !isFinite(view.zoom) ? 10 : Math.max(1, Math.min(view.zoom, 15)),
        };
    }, [coordinates, size.width, size.height]);

    // Localized content
    const heading = getLocalized({ t, locale, attribute: "headings", country, city: deslugify(city), categoryAndSubcategory });
    const description = getLocalized({ t, locale, attribute: "descriptions", country, city: deslugify(city), categoryAndSubcategory });

    // Enriched subcategories for SEO and FAQ
    const enrichedSubcategories = useMemo(() => {
        if (!availableSubcategories) return [];
        const seen = new Map();
        availableSubcategories.forEach((cat) => {
            const slugKey = getLocalizedCountryCategorySlug(country, cat, locale);
            const match = matchPlaceSubcategory(cat);
            if (match) {
                if (!seen.has(slugKey)) {
                    seen.set(slugKey, {
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

    const seoSubcategories = enrichedSubcategories.map(el => el.subcategory).join(", ");
    const seoParagraph = getLocalized({
        t,
        locale,
        attribute: "seoParagraph",
        country,
        city: deslugify(city),
        categoryAndSubcategory,
        extraParams: { subcategories: seoSubcategories ?? "" },
    });

    return (
        <section className="bg-primary min-h-screen">
            {/* Hero Section */}
            <PlacesDirectoryHero
                heading={heading}
                description={description}
                totalPlaces={totalPlaces}
                newThisWeek={newThisWeek}
                country={country}
                city={city}
                categoryAndSubcategory={categoryAndSubcategory}
                places={places}
                initialViewState={initialViewState}
            />

            {/* Main Content */}
            <div className="w-full py-6 px-8 max-md:px-4">
                <div className="max-w-container mx-auto">
                    {/* Fallback Warning */}
                    {!exactMatch && (
                        <div className="mb-6 p-3 bg-accent/10 border border-accent/20 rounded-card text-white text-sm">
                            {t.rich("countries.fallback.slug.warning", {
                                strong: (chunks) => <strong className="text-accent">{chunks}</strong>,
                                cityAndOrCountry: city ? `${deslugify(city)}, ${country}` : country,
                            })}
                        </div>
                    )}

                    {/* Hidden SEO content */}
                    <div className="sr-only">
                        <p>{seoParagraph}</p>
                        <p>Last updated: {moment().format("MMM, yyyy")}</p>
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
                        {/* Main Content - Places List */}
                        <div className="w-full" ref={listRef}>
                            {/* Search and Filters */}
                            <PlacesSearchFilters
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                                selectedCategories={selectedCategories}
                                selectedPayments={selectedPayments}
                                availableSubcategories={availableSubcategories}
                                country={country}
                                onToggleCategory={toggleCategory}
                                onToggleAllCategories={toggleAllCategories}
                                onTogglePayment={togglePayment}
                                onOpenFiltersModal={() => setFiltersModalOpen(true)}
                                hasActiveFilters={hasActiveFilters}
                            />

                            {filteredCount === 0 ? (
                                /* Empty State */
                                <div className="text-center py-16 px-8 bg-surface rounded-card border border-border-light">
                                    <SearchIcon className="mx-auto text-text-light mb-4 w-16 h-16" />
                                    <h3 className="text-lg font-semibold text-white mb-2">{t("countries.search.noResults")}</h3>
                                    <p className="text-text-light mb-4">{t("countries.search.noResultsDescription", { query: searchQuery })}</p>
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="px-4 py-2 bg-accent text-white rounded-btn text-sm font-medium hover:bg-accent-dark transition-colors cursor-pointer"
                                    >
                                        {t("countries.search.clearSearch")}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Places List */}
                                    <div className="flex flex-col gap-0.5">
                                        {paginatedPlaces.map((place: EnrichedVenue) => {
                                            const isNew = place.timestamp && moment(place.timestamp).isAfter(oneWeekAgo);
                                            return (
                                                <PlaceListItem
                                                    key={place.id}
                                                    place={place}
                                                    isNew={!!isNew}
                                                    isHovered={hoveredPlaceId === place.id}
                                                    onMouseEnter={() => setHoveredPlaceId(place.id)}
                                                    onMouseLeave={() => setHoveredPlaceId(null)}
                                                />
                                            );
                                        })}
                                    </div>

                                    {/* Pagination */}
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        totalItems={totalPlaces}
                                        filteredCount={filteredCount}
                                        itemsPerPage={itemsPerPage}
                                        onPageChange={setCurrentPage}
                                        onItemsPerPageChange={setItemsPerPage}
                                    />
                                </>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-4">
                            <CitiesSidebar country={country} availableCities={availableCities} />
                            <CategoriesSidebar
                                country={country}
                                city={city}
                                categoryAndSubcategory={categoryAndSubcategory}
                                enrichedSubcategories={enrichedSubcategories}
                            />
                        </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="mt-16">
                        <MapFAQ
                            country={country}
                            city={deslugify(city)}
                            subcategory={categoryAndSubcategory ? getSubcategoryLabel(locale, categoryAndSubcategory.category, categoryAndSubcategory.subcategory) : null}
                            lat={initialViewState.latitude}
                            lon={initialViewState.longitude}
                            zoom={initialViewState.zoom}
                            otherCities={availableCities?.map(c => c.name) ?? []}
                            otherCategories={enrichedSubcategories?.map(s => s.subcategory).filter(Boolean) ?? []}
                        />
                    </div>
                </div>
            </div>

            {/* Mobile Filters Modal */}
            <MobileFiltersSheet
                isOpen={filtersModalOpen}
                onClose={() => setFiltersModalOpen(false)}
                selectedCategories={selectedCategories}
                selectedPayments={selectedPayments}
                availableSubcategories={availableSubcategories}
                country={country}
                onToggleCategory={toggleCategory}
                onToggleAllCategories={toggleAllCategories}
                onTogglePayment={togglePayment}
            />
        </section>
    );
}

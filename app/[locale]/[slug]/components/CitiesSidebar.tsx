"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Locale } from "@/i18n/types";
import { getLocalizedCitySlug } from "@/utils/SlugUtils";
import { SearchIcon, PlusIcon } from "@/assets/icons/ui";
import type { CityWithCount } from "../PlacesDirectoryWrapper";

interface CitiesSidebarProps {
    country: string;
    availableCities?: CityWithCount[];
}

export default function CitiesSidebar({ country, availableCities }: CitiesSidebarProps) {
    const t = useTranslations();
    const locale = useLocale() as Locale;
    const [citySearch, setCitySearch] = useState("");
    const [citiesShown, setCitiesShown] = useState(10);

    if (!availableCities || availableCities.length === 0) {
        return (
            <aside className="lg:sticky lg:top-24 h-fit">
                <Link
                    href="/places/create"
                    className="flex items-center justify-center gap-2 w-full bg-accent text-white py-2.5 px-4 text-sm font-medium rounded-btn no-underline transition-all duration-200 hover:bg-accent-dark shadow-soft"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <PlusIcon className="w-4 h-4" />
                    {t("countries.actions.addPlace")}
                </Link>
            </aside>
        );
    }

    const filteredCities = citySearch
        ? availableCities.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase()))
        : availableCities;
    const visibleCities = filteredCities.slice(0, citiesShown);
    const hasMore = filteredCities.length > citiesShown;

    return (
        <aside className="lg:sticky lg:top-24 h-fit space-y-4">
            {/* Add Venue Button */}
            <Link
                href="/places/create"
                className="flex items-center justify-center gap-2 w-full bg-accent text-white py-2.5 px-4 text-sm font-medium rounded-btn no-underline transition-all duration-200 hover:bg-accent-dark shadow-soft"
                target="_blank"
                rel="noopener noreferrer"
            >
                <PlusIcon className="w-4 h-4" />
                {t("countries.actions.addPlace")}
            </Link>

            {/* Other Cities */}
            <div className="bg-surface rounded-card p-5 border border-border-light">
                <h3 className="text-sm font-semibold text-white mb-3">
                    {t("countries.suggestions.otherCities", { country })}
                </h3>

                {/* City Search */}
                {availableCities.length > 10 && (
                    <div className="relative mb-3">
                        <input
                            type="text"
                            value={citySearch}
                            onChange={(e) => {
                                setCitySearch(e.target.value);
                                setCitiesShown(10);
                            }}
                            placeholder={t("countries.filters.searchCities")}
                            className="w-full py-1.5 pl-8 pr-3 bg-primary-light border border-border-light rounded-btn text-xs text-white placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                        />
                        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-light w-3.5 h-3.5" />
                    </div>
                )}

                {/* City List */}
                <div className="flex flex-wrap gap-1.5">
                    {visibleCities.map((cityData) => {
                        const slugKey = getLocalizedCitySlug(country, cityData.name, locale);
                        return slugKey && (
                            <Link
                                key={cityData.name}
                                href={`/${slugKey}`}
                                className="flex items-center gap-1.5 bg-primary-light py-1.5 px-3 rounded-full text-xs text-white hover:text-accent no-underline transition-colors border border-border-light"
                            >
                                <span>{cityData.name}</span>
                                <span className="text-text-light">({cityData.count})</span>
                            </Link>
                        );
                    })}
                </div>

                {hasMore && (
                    <button
                        onClick={() => setCitiesShown(prev => prev + 10)}
                        className="mt-3 text-xs text-accent hover:text-accent-dark transition-colors cursor-pointer"
                    >
                        {t("countries.filters.showMore")} (+{Math.min(10, filteredCities.length - citiesShown)})
                    </button>
                )}

                {citySearch && filteredCities.length === 0 && (
                    <p className="text-xs text-text-light py-2">{t("countries.filters.noCitiesFound")}</p>
                )}
            </div>
        </aside>
    );
}

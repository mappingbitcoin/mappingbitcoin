"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import type { SubcategoryData } from "@/app/api/cache/CategoryCache";
import { SearchIcon, ChevronDownIcon, ChevronRightIcon } from "@/assets/icons/ui";

interface SubcategoryClientProps {
    subcategory: string;
    label: string;
    pluralLabel: string;
    data: SubcategoryData;
}

// Convert ISO country code to flag emoji
function countryCodeToFlag(code: string): string {
    const codePoints = code
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

// Highlight matching text
function HighlightText({ text, query }: { text: string; query: string }) {
    if (!query.trim()) return <>{text}</>;

    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <mark key={i} className="bg-accent/30 text-white rounded px-0.5">
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    );
}

export default function SubcategoryClient({ label, pluralLabel, data }: SubcategoryClientProps) {
    const t = useTranslations("categories");
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
    const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set()); // Track which countries have all cities shown

    // Filter countries by search
    const filteredCountries = useMemo(() => {
        if (!searchQuery.trim()) return data.countries;
        const query = searchQuery.toLowerCase();
        return data.countries.filter((country) => {
            // Match country name
            if (country.name.toLowerCase().includes(query)) return true;
            // Match any city name
            return country.cities.some((city) => city.name.toLowerCase().includes(query));
        });
    }, [data.countries, searchQuery]);

    // Auto-expand countries that have matching cities when searching
    const countriesWithMatchingCities = useMemo(() => {
        if (!searchQuery.trim()) return new Set<string>();
        const query = searchQuery.toLowerCase();
        const matching = new Set<string>();
        for (const country of data.countries) {
            if (country.cities.some((city) => city.name.toLowerCase().includes(query))) {
                matching.add(country.name);
            }
        }
        return matching;
    }, [data.countries, searchQuery]);

    // Determine if a country should be expanded (manually expanded OR has matching cities during search)
    const isCountryExpanded = (countryName: string) => {
        return expandedCountries.has(countryName) || countriesWithMatchingCities.has(countryName);
    };

    // Get filtered cities for a country (filter by search query if searching)
    const getFilteredCities = (country: typeof data.countries[0]) => {
        if (!searchQuery.trim()) return country.cities;
        const query = searchQuery.toLowerCase();
        // If country name matches, show all cities; otherwise filter cities
        if (country.name.toLowerCase().includes(query)) {
            return country.cities;
        }
        return country.cities.filter((city) => city.name.toLowerCase().includes(query));
    };

    const toggleCountry = (countryName: string) => {
        setExpandedCountries((prev) => {
            const next = new Set(prev);
            if (next.has(countryName)) {
                next.delete(countryName);
            } else {
                next.add(countryName);
            }
            return next;
        });
    };

    const toggleCitiesExpanded = (countryName: string) => {
        setExpandedCities((prev) => {
            const next = new Set(prev);
            if (next.has(countryName)) {
                next.delete(countryName);
            } else {
                next.add(countryName);
            }
            return next;
        });
    };

    return (
        <div className="w-full py-8 px-8 max-md:px-4">
            <div className="max-w-container mx-auto">
                {/* Breadcrumbs */}
                <nav className="mb-6" aria-label="Breadcrumb">
                    <ol className="flex items-center gap-2 text-sm">
                        <li>
                            <Link href="/" className="text-text-light hover:text-accent transition-colors">
                                {t("breadcrumb.home")}
                            </Link>
                        </li>
                        <li className="text-text-light">/</li>
                        <li>
                            <Link href="/categories" className="text-text-light hover:text-accent transition-colors">
                                {t("breadcrumb.categories")}
                            </Link>
                        </li>
                        <li className="text-text-light">/</li>
                        <li className="text-white font-medium">
                            {pluralLabel}
                        </li>
                    </ol>
                </nav>

                {/* Search Bar */}
                <div className="mb-8">
                    <div className="relative max-w-md">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
                        <input
                            type="text"
                            placeholder={t("search.placeholderSubcategory")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-surface border border-border-light rounded-card text-white placeholder:text-text-light focus:outline-none focus:border-accent"
                        />
                    </div>
                </div>

                {/* Countries Grid */}
                {filteredCountries.length === 0 ? (
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredCountries.map((country) => {
                            const isExpanded = isCountryExpanded(country.name);
                            const hasCities = country.cities.length > 0;

                            return (
                                <div
                                    key={country.code}
                                    className="bg-surface rounded-card border border-border-light overflow-hidden"
                                >
                                    {/* Country Header */}
                                    <div className="p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            {/* Flag */}
                                            <span className="text-2xl" role="img" aria-label={country.name}>
                                                {countryCodeToFlag(country.code)}
                                            </span>

                                            {/* Country Info */}
                                            <div className="flex-1 min-w-0">
                                                <span className="text-white font-medium truncate block">
                                                    <HighlightText text={country.name} query={searchQuery} />
                                                </span>
                                                <span className="text-xs text-text-light">
                                                    {t("subcategory.places", { count: country.count })}
                                                </span>
                                            </div>

                                            {/* Expand Button */}
                                            {hasCities && (
                                                <button
                                                    onClick={() => toggleCountry(country.name)}
                                                    className="p-1.5 text-text-light hover:text-white hover:bg-surface-light rounded transition-colors cursor-pointer"
                                                    aria-label={isExpanded ? t("subcategory.collapse") : t("subcategory.expand")}
                                                >
                                                    {isExpanded ? (
                                                        <ChevronDownIcon className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronRightIcon className="w-4 h-4" />
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {/* View Link */}
                                        <Link
                                            href={`/${country.slug}`}
                                            className="text-sm text-accent hover:text-accent-light transition-colors"
                                        >
                                            {t("subcategory.viewAll", { category: pluralLabel.toLowerCase() })} →
                                        </Link>
                                    </div>

                                    {/* Expanded Cities */}
                                    <AnimatePresence>
                                        {isExpanded && hasCities && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 pb-4 pt-0">
                                                    <div className="border-t border-border-light pt-3">
                                                        <p className="text-xs text-text-light mb-2">
                                                            {t("subcategory.cities")}:
                                                        </p>
                                                        {(() => {
                                                            const filteredCities = getFilteredCities(country);
                                                            const showAllCities = expandedCities.has(country.name) || searchQuery.trim();
                                                            const displayCities = showAllCities ? filteredCities : filteredCities.slice(0, 10);
                                                            const hasMoreCities = !showAllCities && filteredCities.length > 10;

                                                            return (
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {displayCities.map((city) => (
                                                                        <Link
                                                                            key={city.name}
                                                                            href={`/${city.slug}`}
                                                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-surface-light/80 text-text-light border border-border-light/50 rounded hover:text-accent hover:border-accent/50 transition-colors"
                                                                        >
                                                                            <span><HighlightText text={city.name} query={searchQuery} /></span>
                                                                            <span className="opacity-60">({city.count})</span>
                                                                        </Link>
                                                                    ))}
                                                                    {hasMoreCities && (
                                                                        <button
                                                                            onClick={() => toggleCitiesExpanded(country.name)}
                                                                            className="text-xs text-accent hover:text-accent-light px-2 py-1 cursor-pointer transition-colors"
                                                                        >
                                                                            {t("subcategory.moreItems", { count: filteredCities.length - 10 })}
                                                                        </button>
                                                                    )}
                                                                    {expandedCities.has(country.name) && filteredCities.length > 10 && !searchQuery.trim() && (
                                                                        <button
                                                                            onClick={() => toggleCitiesExpanded(country.name)}
                                                                            className="text-xs text-accent hover:text-accent-light px-2 py-1 cursor-pointer transition-colors"
                                                                        >
                                                                            {t("showLess")}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

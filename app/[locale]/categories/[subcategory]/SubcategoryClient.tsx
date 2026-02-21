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

export default function SubcategoryClient({ label, pluralLabel, data }: SubcategoryClientProps) {
    const t = useTranslations("categories");
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());

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

    return (
        <div className="w-full py-8 px-8 max-md:px-4">
            <div className="max-w-container mx-auto">
                {/* Back Link */}
                <div className="mb-6">
                    <Link
                        href="/categories"
                        className="text-accent hover:text-accent-light transition-colors text-sm"
                    >
                        ← Back to Categories
                    </Link>
                </div>

                {/* Search Bar */}
                <div className="mb-8">
                    <div className="relative max-w-md">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
                        <input
                            type="text"
                            placeholder="Search countries or cities..."
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
                            const isExpanded = expandedCountries.has(country.name);
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
                                                    {country.name}
                                                </span>
                                                <span className="text-xs text-text-light">
                                                    {country.count} places
                                                </span>
                                            </div>

                                            {/* Expand Button */}
                                            {hasCities && (
                                                <button
                                                    onClick={() => toggleCountry(country.name)}
                                                    className="p-1.5 text-text-light hover:text-white hover:bg-surface-light rounded transition-colors cursor-pointer"
                                                    aria-label={isExpanded ? "Collapse" : "Expand"}
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
                                            View all {pluralLabel.toLowerCase()} →
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
                                                            Cities:
                                                        </p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {country.cities.slice(0, 10).map((city) => (
                                                                <Link
                                                                    key={city.name}
                                                                    href={`/${city.slug}`}
                                                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-surface-light/80 text-text-light border border-border-light/50 rounded hover:text-accent hover:border-accent/50 transition-colors"
                                                                >
                                                                    <span>{city.name}</span>
                                                                    <span className="opacity-60">({city.count})</span>
                                                                </Link>
                                                            ))}
                                                            {country.cities.length > 10 && (
                                                                <span className="text-xs text-text-light px-2 py-1">
                                                                    +{country.cities.length - 10} more
                                                                </span>
                                                            )}
                                                        </div>
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

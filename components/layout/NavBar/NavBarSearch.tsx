"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AutocompleteResult } from "@/models/Search";
import {
    PinIcon,
    MapIcon,
    GlobeIcon,
    SpinnerIcon,
    SearchIcon,
    CloseIcon,
} from "@/assets/icons/ui";
import { BuildingIcon } from "@/assets/icons/location";
import { getLocalizedCountrySlug, getLocalizedCitySlug } from "@/utils/SlugUtils";

interface NavBarSearchProps {
    placeholder?: string;
    onClose?: () => void;
    autoFocus?: boolean;
    compact?: boolean; // Hides internal icon for inline use
    expandable?: boolean; // For navbar expanding search
}

export default function NavBarSearch({ placeholder = "Search venues...", onClose, autoFocus = false, compact = false, expandable = false }: NavBarSearchProps) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<AutocompleteResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Auto-focus input when autoFocus prop is true
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    // Fetch results from autocomplete API
    const fetchResults = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        // Cancel previous request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        setIsLoading(true);

        try {
            const response = await fetch(
                `/api/map/autocomplete?q=${encodeURIComponent(searchQuery)}`,
                { signal: abortControllerRef.current.signal }
            );

            if (response.ok) {
                const data: AutocompleteResult[] = await response.json();
                setResults(data);
                setIsOpen(data.length > 0);
                setSelectedIndex(-1);
            }
        } catch (error) {
            if ((error as Error).name !== "AbortError") {
                console.error("Search error:", error);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchResults(query);
        }, 200);

        return () => clearTimeout(timer);
    }, [query, fetchResults]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || results.length === 0) {
            if (e.key === "Escape") {
                setQuery("");
                inputRef.current?.blur();
                onClose?.();
            }
            return;
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case "Enter":
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < results.length) {
                    handleSelect(results[selectedIndex]);
                }
                break;
            case "Escape":
                setIsOpen(false);
                setQuery("");
                inputRef.current?.blur();
                onClose?.();
                break;
        }
    };

    // Handle result selection - navigate to place/location page
    const handleSelect = (result: AutocompleteResult) => {
        setIsOpen(false);
        setQuery("");
        onClose?.();

        // Navigate based on result type
        if (result.resultType === "venue" && result.venue?.slug) {
            // Navigate to venue detail page
            router.push(`/places/${result.venue.slug}`);
        } else if (result.resultType === "city" && result.city && result.country) {
            // Navigate to city listing page
            const citySlug = getLocalizedCitySlug(result.country, result.city);
            router.push(`/${citySlug}`);
        } else if (result.resultType === "country" && result.country) {
            // Navigate to country listing page
            const countrySlug = getLocalizedCountrySlug(result.country);
            router.push(`/${countrySlug}`);
        } else {
            // Fallback to map for states or missing data
            const zoom = result.resultType === "state" ? 8 : 12;
            router.push(`/map?lat=${result.latitude}&lon=${result.longitude}&zoom=${zoom}`);
        }
    };

    // Get icon for result type
    const getResultIcon = (type: AutocompleteResult["resultType"]) => {
        switch (type) {
            case "venue":
                return <PinIcon className="w-4 h-4 text-accent" />;
            case "city":
                return <BuildingIcon className="w-4 h-4 text-blue-400" />;
            case "state":
                return <MapIcon className="w-4 h-4 text-green-400" />;
            case "country":
                return <GlobeIcon className="w-4 h-4 text-purple-400" />;
        }
    };

    // Get subtitle for result
    const getResultSubtitle = (result: AutocompleteResult) => {
        if (result.resultType === "venue" && result.venue) {
            const parts = [];
            if (result.city) parts.push(result.city);
            if (result.country) parts.push(result.country);
            return parts.join(", ");
        }
        return result.resultType.charAt(0).toUpperCase() + result.resultType.slice(1);
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Search Input */}
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => results.length > 0 && setIsOpen(true)}
                    placeholder={placeholder}
                    className={`text-sm text-white placeholder-white/50 focus:outline-none transition-all ${
                        expandable
                            ? "w-full py-1.5 pl-8 pr-3 bg-transparent border border-transparent rounded-lg group-hover/search:bg-white/10 group-hover/search:border-white/20 group-focus-within/search:bg-white/10 group-focus-within/search:border-white/20 focus:border-accent/50"
                            : compact
                                ? "w-full px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg"
                                : "w-full md:w-64 lg:w-80 px-4 py-2 pl-10 bg-white/10 border border-white/20 rounded-lg focus:border-accent/50 focus:bg-white/15"
                    }`}
                />
                {(expandable || !compact) && (
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
                        {isLoading ? (
                            <SpinnerIcon className="w-4 h-4 text-white/50 animate-spin" />
                        ) : (
                            <SearchIcon className="w-4 h-4 text-white/50" />
                        )}
                    </div>
                )}
                {query && (
                    <button
                        onClick={() => {
                            setQuery("");
                            setResults([]);
                            setIsOpen(false);
                            inputRef.current?.focus();
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-white/50 hover:text-white/80 transition-colors"
                    >
                        <CloseIcon className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            <AnimatePresence>
                {isOpen && results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border-light rounded-xl shadow-lg overflow-hidden z-50 max-h-[70vh] md:max-h-96 md:min-w-[400px] overflow-y-auto"
                    >
                        {/* Venues */}
                        {results.filter((r) => r.resultType === "venue").length > 0 && (
                            <div>
                                <div className="px-3 py-2 text-xs font-semibold text-text-light uppercase tracking-wide bg-surface-light">
                                    Venues
                                </div>
                                {results
                                    .filter((r) => r.resultType === "venue")
                                    .map((result, idx) => {
                                        const globalIdx = results.indexOf(result);
                                        return (
                                            <button
                                                key={`venue-${idx}`}
                                                onClick={() => handleSelect(result)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                                                    selectedIndex === globalIdx
                                                        ? "bg-accent/20 text-white"
                                                        : "hover:bg-white/5 text-white/80"
                                                }`}
                                            >
                                                {getResultIcon(result.resultType)}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{result.label}</p>
                                                    <p className="text-xs text-text-light truncate">
                                                        {getResultSubtitle(result)}
                                                    </p>
                                                </div>
                                                {result.distance && (
                                                    <span className="text-xs text-text-light">
                                                        {result.distance.toFixed(1)} km
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                            </div>
                        )}

                        {/* Locations */}
                        {results.filter((r) => r.resultType !== "venue").length > 0 && (
                            <div>
                                <div className="px-3 py-2 text-xs font-semibold text-text-light uppercase tracking-wide bg-surface-light">
                                    Locations
                                </div>
                                {results
                                    .filter((r) => r.resultType !== "venue")
                                    .map((result, idx) => {
                                        const globalIdx = results.indexOf(result);
                                        return (
                                            <button
                                                key={`location-${idx}`}
                                                onClick={() => handleSelect(result)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                                                    selectedIndex === globalIdx
                                                        ? "bg-accent/20 text-white"
                                                        : "hover:bg-white/5 text-white/80"
                                                }`}
                                            >
                                                {getResultIcon(result.resultType)}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{result.label}</p>
                                                    <p className="text-xs text-text-light truncate">
                                                        {getResultSubtitle(result)}
                                                    </p>
                                                </div>
                                                {result.distance && (
                                                    <span className="text-xs text-text-light">
                                                        {result.distance.toFixed(1)} km
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

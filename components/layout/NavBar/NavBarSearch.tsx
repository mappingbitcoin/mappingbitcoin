"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AutocompleteResult } from "@/models/Search";

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

    // Handle result selection - navigate to map
    const handleSelect = (result: AutocompleteResult) => {
        setIsOpen(false);
        setQuery("");
        onClose?.();

        // Determine zoom level based on result type
        let zoom = 15;
        if (result.resultType === "country") {
            zoom = 6;
        } else if (result.resultType === "state") {
            zoom = 8;
        } else if (result.resultType === "city") {
            zoom = 12;
        }

        // Build URL with coordinates
        const mapUrl = `/map?lat=${result.latitude}&lon=${result.longitude}&zoom=${zoom}${
            result.venue ? `&venue=${result.venue.type}/${result.venue.id}` : ""
        }`;

        router.push(mapUrl);
    };

    // Get icon for result type
    const getResultIcon = (type: AutocompleteResult["resultType"]) => {
        switch (type) {
            case "venue":
                return (
                    <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                );
            case "city":
                return (
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                );
            case "state":
                return (
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                );
            case "country":
                return (
                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
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
                            <svg className="w-4 h-4 text-white/50 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
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
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
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
                        className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border-light rounded-xl shadow-lg overflow-hidden z-50 max-h-80 overflow-y-auto"
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

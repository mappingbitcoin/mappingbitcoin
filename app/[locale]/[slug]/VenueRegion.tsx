"use client"

import {Link} from '@/i18n/navigation';
import {useContainerSize} from "@/hooks/useContainerSize";
import {computeMapView} from "@/utils/MapUtils";
import {useLocale, useTranslations} from "next-intl";
import {Locale} from "@/i18n/types";
import {getLocalized} from "@/app/[locale]/[slug]/MerchantUtils";
import {deslugify} from "@/utils/StringUtils";
import {getLocalizedCitySlug, getLocalizedCountryCategorySlug, getLocalizedCountrySlug} from "@/utils/SlugUtils";
import {PAYMENT_METHODS} from "@/constants/PaymentMethods";
import {EnrichedVenue} from "@/models/Overpass";
import {CategoryAndSubcategory} from "@/constants/PlaceOsmDictionary";
import {parseTags, formatOpeningHours} from "@/utils/OsmHelpers";
import {
    getSubcategoryLabel,
    matchPlaceSubcategory,
    PlaceSubcategory
} from "@/constants/PlaceCategories";
import {getFormattedAddress} from "@/utils/AddressUtils";
import moment from 'moment'
import MapFAQ from "@/app/[locale]/[slug]/MapFAQSection";
import {useMemo, useState, useEffect, useRef} from "react";
import type { CityWithCount } from "@/app/[locale]/[slug]/VenueRegionWrapper";
import MapGL, { Marker } from "react-map-gl/maplibre";
import maplibregl from 'maplibre-gl';
import "maplibre-gl/dist/maplibre-gl.css";

type VenueRegionPageProps = {
    venues: EnrichedVenue[];
    exactMatch: boolean;
    city?: string;
    country: string;
    availableCities?: CityWithCount[]
    availableSubcategories?: PlaceSubcategory[]
    categoryAndSubcategory?: CategoryAndSubcategory
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_PAGE_SIZE = 10;

// SVG icons for payment methods
const PaymentIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'lightning':
            return (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
            );
        case 'lightning_contactless':
            // Lightning with NFC waves
            return (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11 2L4 12h6l-1 6 7-8h-5l1-8z" />
                    <path d="M17 8c1.5 1.5 2.5 3.5 2.5 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M19.5 5.5c2 2 3.5 5 3.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            );
        case 'onchain':
            return (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h1c.55 0 1 .45 1 1v3c0 .55-.45 1-1 1h-3v1h4v2h-2v2h-2v-2h-1c-.55 0-1-.45-1-1v-3c0-.55.45-1 1-1h3v-1h-4V9h2V7z" />
                </svg>
            );
        case 'debit_cards':
        case 'credit_cards':
            return (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
            );
        case 'contactless':
            return (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8.5 14.5A4.5 4.5 0 0 1 13 10" />
                    <path d="M5.5 17.5A8.5 8.5 0 0 1 14 9" />
                    <path d="M2.5 20.5A12.5 12.5 0 0 1 15 8" />
                </svg>
            );
        default:
            return null;
    }
};

export default function VenueRegionPage({ venues, city, country, categoryAndSubcategory, availableCities, availableSubcategories,exactMatch }: VenueRegionPageProps) {
    const t = useTranslations()
    const locale = useLocale() as Locale
    const [, size] = useContainerSize();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
    const [categoriesInitialized, setCategoriesInitialized] = useState(false);
    const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
    const [paymentsInitialized, setPaymentsInitialized] = useState(false);
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const [paymentDropdownOpen, setPaymentDropdownOpen] = useState(false);
    const [citySearch, setCitySearch] = useState('');
    const [citiesShown, setCitiesShown] = useState(10);
    const [filtersModalOpen, setFiltersModalOpen] = useState(false);
    const [expandedCategorySections, setExpandedCategorySections] = useState<Set<string>>(new Set());
    const [categoriesFilterExpanded, setCategoriesFilterExpanded] = useState(false);
    const [paymentFilterExpanded, setPaymentFilterExpanded] = useState(false);
    const [mapMounted, setMapMounted] = useState(false);
    const [hoveredVenueId, setHoveredVenueId] = useState<number | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const categoryDropdownRef = useRef<HTMLDivElement>(null);
    const paymentDropdownRef = useRef<HTMLDivElement>(null);

    // Mount map on client-side only
    useEffect(() => {
        setMapMounted(true);
    }, []);

    // Scroll to list when page changes (but not on initial render)
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        if (listRef.current) {
            const yOffset = -100; // Account for sticky header
            const y = listRef.current.getBoundingClientRect().top + window.scrollY + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    }, [currentPage]);

    // Reset to page 1 when search or items per page changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, itemsPerPage, selectedCategories, selectedPayments]);

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
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Toggle category selection
    const toggleCategory = (subcategory: string) => {
        setSelectedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(subcategory)) {
                newSet.delete(subcategory);
            } else {
                newSet.add(subcategory);
            }
            return newSet;
        });
    };

    // Select/deselect all categories
    const toggleAllCategories = (allSubcategories: string[]) => {
        if (selectedCategories.size === allSubcategories.length) {
            setSelectedCategories(new Set());
        } else {
            setSelectedCategories(new Set(allSubcategories));
        }
    };

    // Toggle payment filter
    const togglePayment = (paymentType: string) => {
        setSelectedPayments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(paymentType)) {
                newSet.delete(paymentType);
            } else {
                newSet.add(paymentType);
            }
            return newSet;
        });
    };

    // Filter venues by search query, categories, and payment methods
    const filteredVenues = useMemo(() => {
        return venues.filter(venue => {
            // Category filter
            if (selectedCategories.size > 0 && categoriesInitialized && selectedCategories.size < (availableSubcategories?.length || 0)) {
                const venueSubcategory = venue.subcategory;
                if (venueSubcategory && !selectedCategories.has(venueSubcategory)) {
                    return false;
                }
            }

            // Payment filter - only apply if not all are selected
            if (selectedPayments.size > 0 && paymentsInitialized && selectedPayments.size < Object.keys(PAYMENT_METHODS).length) {
                const { paymentMethods } = parseTags(venue.tags);
                if (paymentMethods) {
                    const venuePayments = Object.entries(paymentMethods)
                        .filter(([, v]) => v === "yes")
                        .map(([type]) => type);
                    // Show venue if it has at least one selected payment method
                    const hasSelectedPayment = venuePayments.some(p => selectedPayments.has(p));
                    if (!hasSelectedPayment && venuePayments.length > 0) {
                        return false;
                    }
                }
            }

            // Search filter
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase().trim();
            const { name } = parseTags(venue.tags);
            const address = getFormattedAddress(locale, venue);
            const subcategoryLabel = venue.subcategory && venue.category
                ? getSubcategoryLabel(locale, venue.category, venue.subcategory)
                : '';
            return (
                name?.toLowerCase().includes(query) ||
                address?.toLowerCase().includes(query) ||
                subcategoryLabel?.toLowerCase().includes(query) ||
                venue.city?.toLowerCase().includes(query)
            );
        });
    }, [venues, searchQuery, locale, selectedCategories, categoriesInitialized, selectedPayments, paymentsInitialized, availableSubcategories]);

    // Calculate stats
    const totalVenues = venues.length;
    const filteredCount = filteredVenues.length;
    const oneWeekAgo = useMemo(() => moment().subtract(7, 'days'), []);
    const newThisWeek = useMemo(() => {
        return venues.filter(venue => {
            if (!venue.timestamp) return false;
            return moment(venue.timestamp).isAfter(oneWeekAgo);
        }).length;
    }, [venues, oneWeekAgo]);

    // Pagination
    const totalPages = Math.ceil(filteredCount / itemsPerPage);
    const paginatedVenues = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredVenues.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredVenues, currentPage, itemsPerPage]);

    const coordinates = venues
        .filter(v => v.lat && v.lon && !isNaN(v.lat) && !isNaN(v.lon))
        .map(v => ({ lat: v.lat, lon: v.lon }));

    const initialViewState = useMemo(() => {
        const view = computeMapView(coordinates, size.width || 800, size.height || 400);
        // Ensure valid values for map URL
        return {
            longitude: isNaN(view.longitude) ? 0 : view.longitude,
            latitude: isNaN(view.latitude) ? 0 : view.latitude,
            zoom: isNaN(view.zoom) || !isFinite(view.zoom) ? 10 : Math.max(1, Math.min(view.zoom, 15))
        };
    }, [coordinates, size.width, size.height]);

    const heading = getLocalized({t, locale, attribute: 'headings', country, city: deslugify(city), categoryAndSubcategory})
    const description = getLocalized({t, locale, attribute: 'descriptions',country, city: deslugify(city), categoryAndSubcategory})

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
                        rawSubcategory: cat, // Keep original subcategory for filtering
                        subcategory: getSubcategoryLabel(locale, match.category, match.subcategory),
                    });
                }
            }
        });

        return Array.from(seen.values());
    }, [availableSubcategories, country, locale]);

    // Group categories by parent category
    const groupedCategories = useMemo(() => {
        const groups: Record<string, typeof enrichedSubcategories> = {};
        enrichedSubcategories.forEach((cat) => {
            const parentCategory = cat.category || 'other';
            if (!groups[parentCategory]) {
                groups[parentCategory] = [];
            }
            groups[parentCategory].push(cat);
        });
        return groups;
    }, [enrichedSubcategories]);

    // Helper to get parent category display name
    const getCategoryDisplayName = (category: string) => {
        return category
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Toggle category section expansion
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

    // Toggle all subcategories in a section
    const toggleSectionCategories = (sectionCategories: typeof enrichedSubcategories) => {
        const rawSubcategories = sectionCategories.map(c => c.rawSubcategory);
        const allSelected = rawSubcategories.every(sub => selectedCategories.has(sub));

        setSelectedCategories(prev => {
            const next = new Set(prev);
            if (allSelected) {
                rawSubcategories.forEach(sub => next.delete(sub));
            } else {
                rawSubcategories.forEach(sub => next.add(sub));
            }
            return next;
        });
    };

    const seoSubcategories = enrichedSubcategories.map((el) => el.subcategory).join(', ');

    const seoParagraph = getLocalized({
        t,
        locale,
        attribute: "seoParagraph",
        country,
        city: deslugify(city),
        categoryAndSubcategory,
        extraParams: { subcategories: seoSubcategories ?? ''}
    });

    return (
        <section className="bg-primary min-h-screen">
            {/* Hero Section */}
            <div className="w-full bg-gradient-primary pt-20 pb-12 px-8 max-md:px-4">
                <div className="max-w-container mx-auto">
                    <div className="flex items-center justify-between gap-8 max-md:flex-col">
                        {/* Left: Title & Description */}
                        <div className="flex-1">
                            {/* Breadcrumb */}
                            <nav aria-label="Breadcrumb" className="mb-6">
                                <ol className="flex flex-wrap list-none gap-2 text-sm [&_li]:after:content-['/'] [&_li]:after:ml-2 [&_li]:after:text-white/50 [&_li:last-child]:after:content-[''] [&_li:last-child]:after:m-0 [&_a]:text-white/80 [&_a]:no-underline [&_a]:transition-colors [&_a:hover]:text-white [&_span]:text-white">
                                    <li>
                                        <Link href="/countries">{t('countries.breadcrumb.home')}</Link>
                                    </li>
                                    <li>
                                        {city || categoryAndSubcategory ? (
                                            <Link href={`/${getLocalizedCountrySlug(country, locale)}`}>
                                                {deslugify(country)}
                                            </Link>
                                        ) : (
                                            <span>{deslugify(country)}</span>
                                        )}
                                    </li>
                                    {city && (
                                        <li>
                                            {categoryAndSubcategory ? (
                                                <Link href={`/${getLocalizedCitySlug(country, city, locale)}`}>
                                                    {deslugify(city)}
                                                </Link>
                                            ) : (
                                                <span>{deslugify(city)}</span>
                                            )}
                                        </li>
                                    )}
                                    {categoryAndSubcategory && (
                                        <li>
                                            <span>
                                                {getSubcategoryLabel(locale, categoryAndSubcategory.category, categoryAndSubcategory.subcategory)}
                                            </span>
                                        </li>
                                    )}
                                </ol>
                            </nav>

                            <div className="flex items-center gap-3 flex-wrap mb-3">
                                <h1 className="text-3xl md:text-4xl font-bold text-white">{heading}</h1>
                                <span className="inline-flex items-center gap-1.5 bg-white/10 py-1.5 px-3 rounded-full">
                                    <span className="text-lg font-bold text-white">{totalVenues.toLocaleString()}</span>
                                    <span className="text-sm text-white/70">{t('countries.stats.totalPlaces')}</span>
                                </span>
                                {newThisWeek > 0 && (
                                    <span className="inline-flex items-center gap-1.5 bg-green-500/20 text-green-300 py-1.5 px-3 rounded-full text-sm font-medium">
                                        +{newThisWeek} {t('countries.stats.newThisWeek')}
                                    </span>
                                )}
                            </div>
                            <p className="text-base text-white/70 max-w-xl">{description}</p>
                        </div>

                        {/* Right: Map Preview with Pins */}
                        <Link
                            href={`/map?lat=${initialViewState.latitude.toFixed(5)}&lon=${initialViewState.longitude.toFixed(5)}&zoom=${Math.min(Math.round(initialViewState.zoom), 15)}`}
                            className="relative block w-[320px] max-md:w-full shrink-0 group"
                        >
                            <div className="relative overflow-hidden rounded-card shadow-medium h-[160px]">
                                {mapMounted ? (
                                    <MapGL
                                        mapLib={maplibregl}
                                        initialViewState={{
                                            longitude: initialViewState.longitude,
                                            latitude: initialViewState.latitude,
                                            zoom: Math.min(initialViewState.zoom, 13),
                                        }}
                                        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
                                        style={{ width: "100%", height: "160px" }}
                                        scrollZoom={false}
                                        dragPan={false}
                                        touchZoomRotate={false}
                                        doubleClickZoom={false}
                                        interactive={false}
                                        attributionControl={false}
                                    >
                                        {venues.slice(0, 100).map((venue) => (
                                            <Marker
                                                key={venue.id}
                                                longitude={venue.lon}
                                                latitude={venue.lat}
                                                anchor="center"
                                            >
                                                <div className="w-2 h-2 bg-accent rounded-full border border-white shadow-sm" />
                                            </Marker>
                                        ))}
                                    </MapGL>
                                ) : (
                                    <div className="w-full h-full bg-background flex items-center justify-center">
                                        <span className="text-text-light text-sm">Loading map...</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                                    <span className="text-white text-sm font-medium flex items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        {t('countries.actions.goToMap')}
                                    </span>
                                    <span className="bg-white/20 backdrop-blur-sm text-white text-xs py-1 px-2 rounded-full">
                                        {totalVenues} pins
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full py-6 px-8 max-md:px-4">
                <div className="max-w-container mx-auto">
                    {/* Fallback Warning */}
                    {!exactMatch && (
                        <div className="mb-6 p-3 bg-accent/10 border border-accent/20 rounded-card text-white text-sm">
                            {t.rich('countries.fallback.slug.warning', {
                                strong: (chunks) => <strong className="text-accent">{chunks}</strong>,
                                cityAndOrCountry: city ? `${deslugify(city)}, ${country}` : country
                            })}
                        </div>
                    )}

                    {/* Hidden SEO content */}
                    <div className="sr-only">
                        <p>{seoParagraph}</p>
                        <p>Last updated: {moment().format('MMM, yyyy')}</p>
                    </div>

                    {/* Two Column Layout: Main Content + Sidebar */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
                        {/* Main Content - Venues List */}
                        <div className="w-full" ref={listRef}>
                            {/* Search Bar and Filters */}
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                {/* Search Input */}
                                <div className="relative flex-1 min-w-[180px]">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={t('countries.search.placeholder')}
                                        className="w-full py-2 pl-9 pr-4 bg-surface border border-border-light rounded-btn text-sm text-white placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                    />
                                    <svg
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-white transition-colors cursor-pointer"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {/* Mobile: Filters Icon Button */}
                                <button
                                    onClick={() => setFiltersModalOpen(true)}
                                    className="md:hidden relative flex items-center justify-center w-[38px] h-[38px] bg-surface border border-border-light rounded-btn text-white hover:border-accent/50 hover:bg-surface-light transition-all cursor-pointer"
                                    title={t('countries.filters.label')}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    {(selectedCategories.size < (availableSubcategories?.length || 0) || selectedPayments.size < Object.keys(PAYMENT_METHODS).length) && (
                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-surface" />
                                    )}
                                </button>

                                {/* Mobile: Add Venue Icon Button */}
                                <Link
                                    href="/places/create"
                                    className="md:hidden flex items-center justify-center w-[38px] h-[38px] bg-accent text-white rounded-btn shadow-soft hover:bg-accent-dark transition-all"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={t('countries.actions.addPlace')}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </Link>

                                {/* Desktop: Categories Dropdown */}
                                {enrichedSubcategories && enrichedSubcategories.length > 0 && (
                                    <div className="relative hidden md:block" ref={categoryDropdownRef}>
                                        <button
                                            onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                                            className="flex items-center gap-2 py-2 px-3 bg-surface border border-border-light rounded-btn text-sm text-white hover:border-accent/50 hover:bg-surface-light transition-all cursor-pointer"
                                        >
                                            <span>{t('countries.filters.categories')}</span>
                                            {selectedCategories.size < (availableSubcategories?.length || 0) && (
                                                <span className="bg-accent text-white text-xs px-1.5 py-0.5 rounded-full">
                                                    {selectedCategories.size}
                                                </span>
                                            )}
                                            <svg className={`w-4 h-4 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {categoryDropdownOpen && (
                                            <div className="absolute top-full left-0 mt-1 w-72 bg-surface border border-border-light rounded-card shadow-medium z-20 max-h-96 overflow-y-auto">
                                                <div className="p-2 border-b border-border-light flex items-center justify-between">
                                                    <button
                                                        onClick={() => toggleAllCategories(availableSubcategories || [])}
                                                        className="text-xs text-accent hover:text-accent-dark transition-colors cursor-pointer"
                                                    >
                                                        {selectedCategories.size === (availableSubcategories?.length || 0) ? t('countries.filters.deselectAll') : t('countries.filters.selectAll')}
                                                    </button>
                                                </div>
                                                <div className="p-1">
                                                    {Object.entries(groupedCategories).map(([parentCategory, subcategories]) => {
                                                        const isExpanded = expandedCategorySections.has(parentCategory);
                                                        const selectedInSection = subcategories.filter(c => selectedCategories.has(c.rawSubcategory)).length;
                                                        const allSelectedInSection = selectedInSection === subcategories.length;

                                                        return (
                                                            <div key={parentCategory} className="mb-1">
                                                                {/* Section Header */}
                                                                <button
                                                                    onClick={() => toggleCategorySection(parentCategory)}
                                                                    className="w-full flex items-center justify-between gap-2 py-2 px-2 hover:bg-primary-light rounded cursor-pointer"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <svg className={`w-3 h-3 text-text-light transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                        </svg>
                                                                        <span className="text-sm font-medium text-white">{getCategoryDisplayName(parentCategory)}</span>
                                                                    </div>
                                                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${allSelectedInSection ? 'bg-accent/10 text-accent' : 'bg-primary-light text-text-light'}`}>
                                                                        {allSelectedInSection ? 'All' : `${selectedInSection}/${subcategories.length}`}
                                                                    </span>
                                                                </button>

                                                                {/* Section Content */}
                                                                {isExpanded && (
                                                                    <div className="ml-3 pl-2 border-l border-border-light">
                                                                        <button
                                                                            onClick={() => toggleSectionCategories(subcategories)}
                                                                            className="text-xs text-accent hover:text-accent-dark py-1 px-2 cursor-pointer"
                                                                        >
                                                                            {allSelectedInSection ? 'Deselect all' : 'Select all'}
                                                                        </button>
                                                                        {subcategories.map(({slugKey, subcategory, rawSubcategory}) => {
                                                                            const isSelected = selectedCategories.has(rawSubcategory);
                                                                            return (
                                                                                <div key={slugKey} className="flex items-center justify-between gap-2 py-1 px-2 hover:bg-primary-light rounded">
                                                                                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={isSelected}
                                                                                            onChange={() => toggleCategory(rawSubcategory)}
                                                                                            className="w-3.5 h-3.5 rounded border-border-light text-accent focus:ring-accent/20 cursor-pointer"
                                                                                        />
                                                                                        <span className="text-xs text-text-light truncate">{subcategory}</span>
                                                                                    </label>
                                                                                    <Link
                                                                                        href={`/${slugKey}`}
                                                                                        className="text-text-light hover:text-accent transition-colors shrink-0"
                                                                                        title={t('countries.filters.goToCategory')}
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                    >
                                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                                        </svg>
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
                                        <span>{t('countries.filters.paymentLabel')}</span>
                                        {selectedPayments.size < Object.keys(PAYMENT_METHODS).length && (
                                            <span className="bg-accent text-white text-xs px-1.5 py-0.5 rounded-full">
                                                {selectedPayments.size}
                                            </span>
                                        )}
                                        <svg className={`w-4 h-4 transition-transform ${paymentDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
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
                                                                    onChange={() => togglePayment(type)}
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

                            {filteredCount === 0 ? (
                                /* Empty State */
                                <div className="text-center py-16 px-8 bg-surface rounded-card border border-border-light">
                                    <svg className="w-16 h-16 mx-auto text-text-light mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <h3 className="text-lg font-semibold text-white mb-2">{t('countries.search.noResults')}</h3>
                                    <p className="text-text-light mb-4">{t('countries.search.noResultsDescription', { query: searchQuery })}</p>
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="px-4 py-2 bg-accent text-white rounded-btn text-sm font-medium hover:bg-accent-dark transition-colors cursor-pointer"
                                    >
                                        {t('countries.search.clearSearch')}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Table Body */}
                                    <div className="flex flex-col gap-0.5">
                                        {paginatedVenues.map((venue: EnrichedVenue) => {
                                            const { name, paymentMethods, openingHours, contact, description } = parseTags(venue.tags)
                                            const formattedHours = formatOpeningHours(openingHours);
                                            const isNew = venue.timestamp && moment(venue.timestamp).isAfter(oneWeekAgo);
                                            const categoryLabel = venue.subcategory && venue.category
                                                ? getSubcategoryLabel(locale, venue.category, venue.subcategory)
                                                : null;

                                            // Get enabled payment methods for stacking
                                            const enabledPayments = paymentMethods
                                                ? Object.entries(paymentMethods).filter(([, v]) => v === "yes").map(([type]) => type)
                                                : [];

                                            return (
                                                <div
                                                    key={venue.id}
                                                    className="relative group"
                                                    onMouseEnter={() => setHoveredVenueId(venue.id)}
                                                    onMouseLeave={() => setHoveredVenueId(null)}
                                                >
                                                <Link
                                                    href={`/places/${venue.id}`}
                                                    className="relative grid grid-cols-[1fr_auto] gap-2 md:gap-3 items-center bg-surface rounded-btn border border-border-light transition-all duration-200 py-2 px-3 text-inherit no-underline hover:border-accent/50 hover:bg-surface-light"
                                                >
                                                    {/* Name, Category & Address Column */}
                                                    <div className="min-w-0 overflow-hidden">
                                                        <div className="flex items-center gap-2">
                                                            <h2 className="text-sm font-semibold text-white m-0 truncate max-w-[200px] md:max-w-none">
                                                                {name}
                                                            </h2>
                                                            {categoryLabel && (
                                                                <span className="hidden md:inline font-normal text-text-light text-sm truncate"> - {categoryLabel}</span>
                                                            )}
                                                            {isNew && (
                                                                <span className="hidden md:inline-flex items-center bg-green-500/20 text-green-400 text-[11px] font-medium px-1.5 py-0.5 rounded-full shrink-0">
                                                                    {t('countries.stats.new')}
                                                                </span>
                                                            )}
                                                            {venue.rating && (
                                                                <span className="hidden md:inline-flex items-center gap-0.5 text-[11px] text-amber-500 shrink-0">
                                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                    </svg>
                                                                    {venue.rating.toFixed(1)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {/* Mobile: Show category on second line */}
                                                        {categoryLabel && (
                                                            <span className="md:hidden text-xs text-text-light truncate block">{categoryLabel}</span>
                                                        )}
                                                        <span className="text-xs text-text-light block truncate">{getFormattedAddress(locale, venue)}</span>
                                                    </div>

                                                    {/* Payment Methods Column - Stacked */}
                                                    <div className="flex items-center justify-end shrink-0">
                                                        {enabledPayments.length > 0 ? (
                                                            <div className="flex items-center" style={{ marginRight: `${Math.max(0, (enabledPayments.length - 1) * 4)}px` }}>
                                                                {enabledPayments.map((type, idx) => {
                                                                    const info = PAYMENT_METHODS[type];
                                                                    if (!info) return null;
                                                                    return (
                                                                        <span
                                                                            key={type}
                                                                            className="flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full bg-accent/10 text-accent border border-surface"
                                                                            style={{ marginLeft: idx > 0 ? '-6px' : 0, zIndex: enabledPayments.length - idx }}
                                                                            title={info.label}
                                                                        >
                                                                            <PaymentIcon type={type} />
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <span className="text-text-light text-xs">—</span>
                                                        )}
                                                    </div>
                                                </Link>

                                                {/* Floating Tooltip */}
                                                {hoveredVenueId === venue.id && (formattedHours || contact?.phone || contact?.website || description) && (
                                                    <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%+8px)] z-30 pointer-events-none">
                                                        <div className="bg-surface border border-border-light rounded-lg shadow-lg p-3 text-xs w-64">
                                                            {/* Venue name in tooltip */}
                                                            <h4 className="text-white font-semibold mb-2 truncate">{name}</h4>
                                                            <div className="grid gap-1.5">
                                                                {formattedHours && (
                                                                    <div className="flex items-start gap-2">
                                                                        <span className="shrink-0">🕐</span>
                                                                        <span className="text-text-light">{formattedHours}</span>
                                                                    </div>
                                                                )}
                                                                {contact?.phone && (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="shrink-0">📞</span>
                                                                        <span className="text-text-light">{contact.phone}</span>
                                                                    </div>
                                                                )}
                                                                {contact?.website && (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="shrink-0">🌐</span>
                                                                        <span className="text-accent truncate">{contact.website.replace(/^https?:\/\//, '')}</span>
                                                                    </div>
                                                                )}
                                                                {description && (
                                                                    <div className="flex items-start gap-2 pt-1.5 mt-1.5 border-t border-border-light">
                                                                        <span className="shrink-0">📝</span>
                                                                        <span className="text-text-light line-clamp-2">{description}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {/* Arrow pointing left */}
                                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-surface border-l border-b border-border-light rotate-45" />
                                                        </div>
                                                    </div>
                                                )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Pagination Controls */}
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
                                        {/* Left: Per Page Selector (hidden on mobile) */}
                                        <div className="hidden md:flex items-center gap-2 min-w-[120px]">
                                            <label htmlFor="perPage" className="text-xs text-text-light whitespace-nowrap">
                                                {t('countries.perPage.label')}
                                            </label>
                                            <select
                                                id="perPage"
                                                value={itemsPerPage}
                                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                                className="py-1.5 px-2 bg-surface border border-border-light rounded-btn text-xs text-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all cursor-pointer"
                                            >
                                                {PAGE_SIZE_OPTIONS.map((size) => (
                                                    <option key={size} value={size}>
                                                        {size}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Center: Page Navigation */}
                                        {totalPages > 1 ? (
                                            <div className="flex items-center gap-1 md:gap-2">
                                                {/* Previous Button */}
                                                <button
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={currentPage === 1}
                                                    className="w-8 h-8 md:w-auto md:h-auto md:px-3 md:py-1.5 flex items-center justify-center rounded-btn text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-surface border border-border-light text-white hover:bg-surface-light cursor-pointer"
                                                >
                                                    <svg className="w-4 h-4 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                    </svg>
                                                    <span className="hidden md:inline">{t('countries.pagination.previous')}</span>
                                                </button>

                                                {/* Page Numbers */}
                                                <div className="flex items-center gap-1">
                                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                        .filter(page => {
                                                            if (page === 1 || page === totalPages) return true;
                                                            return Math.abs(page - currentPage) <= 1;
                                                        })
                                                        .map((page, idx, arr) => {
                                                            const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;
                                                            return (
                                                                <span key={page} className="flex items-center">
                                                                    {showEllipsisBefore && (
                                                                        <span className="px-1 md:px-2 text-text-light text-xs">...</span>
                                                                    )}
                                                                    <button
                                                                        onClick={() => setCurrentPage(page)}
                                                                        className={`w-8 h-8 rounded-btn text-xs md:text-sm font-medium transition-all duration-200 cursor-pointer ${
                                                                            currentPage === page
                                                                                ? 'bg-accent text-white'
                                                                                : 'bg-surface border border-border-light text-white hover:bg-surface-light'
                                                                        }`}
                                                                    >
                                                                        {page}
                                                                    </button>
                                                                </span>
                                                            );
                                                        })}
                                                </div>

                                                {/* Next Button */}
                                                <button
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={currentPage === totalPages}
                                                    className="w-8 h-8 md:w-auto md:h-auto md:px-3 md:py-1.5 flex items-center justify-center rounded-btn text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-surface border border-border-light text-white hover:bg-surface-light cursor-pointer"
                                                >
                                                    <svg className="w-4 h-4 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                    <span className="hidden md:inline">{t('countries.pagination.next')}</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <div />
                                        )}

                                        {/* Right: Showing Stats (hidden on mobile) */}
                                        <div className="hidden md:block text-xs text-text-light text-right min-w-[120px]">
                                            {filteredCount !== totalVenues ? (
                                                <span>{t('countries.stats.filtered', { count: filteredCount })}</span>
                                            ) : filteredCount > 0 ? (
                                                <span>
                                                    {t('countries.stats.showingPage', {
                                                        start: ((currentPage - 1) * itemsPerPage + 1).toLocaleString(),
                                                        end: Math.min(currentPage * itemsPerPage, filteredCount).toLocaleString(),
                                                        total: filteredCount.toLocaleString()
                                                    })}
                                                </span>
                                            ) : null}
                                        </div>

                                        {/* Mobile: Compact Stats */}
                                        <div className="md:hidden text-xs text-text-light text-center">
                                            {filteredCount > 0 && (
                                                <span>{currentPage} / {totalPages}</span>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Sidebar */}
                        <aside className="lg:sticky lg:top-24 h-fit space-y-4">
                            {/* Add Venue Button */}
                            <Link
                                href="/places/create"
                                className="flex items-center justify-center gap-2 w-full bg-accent text-white py-2.5 px-4 text-sm font-medium rounded-btn no-underline transition-all duration-200 hover:bg-accent-dark shadow-soft"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                {t('countries.actions.addPlace')}
                            </Link>

                            {/* Other Cities */}
                            {availableCities && availableCities.length > 0 && (
                                <div className="bg-surface rounded-card p-5 border border-border-light">
                                    <h3 className="text-sm font-semibold text-white mb-3">
                                        {t('countries.suggestions.otherCities', { country })}
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
                                                placeholder={t('countries.filters.searchCities')}
                                                className="w-full py-1.5 pl-8 pr-3 bg-primary-light border border-border-light rounded-btn text-xs text-white placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                            />
                                            <svg
                                                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-light"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                    )}

                                    {/* City List */}
                                    {(() => {
                                        const filteredCities = citySearch
                                            ? availableCities.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase()))
                                            : availableCities;
                                        const visibleCities = filteredCities.slice(0, citiesShown);
                                        const hasMore = filteredCities.length > citiesShown;

                                        return (
                                            <>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {visibleCities.map((cityData) => {
                                                        const slugKey = getLocalizedCitySlug(country, cityData.name, locale)
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
                                                        {t('countries.filters.showMore')} (+{Math.min(10, filteredCities.length - citiesShown)})
                                                    </button>
                                                )}
                                                {citySearch && filteredCities.length === 0 && (
                                                    <p className="text-xs text-text-light py-2">{t('countries.filters.noCitiesFound')}</p>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            )}
                        </aside>
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
                            otherCategories={enrichedSubcategories?.map(s => s.subcategory).filter((el) => el !== null) ?? []}
                        />
                    </div>
                </div>
            </div>

            {/* Mobile Filters Modal */}
            {filtersModalOpen && (
                <div className="fixed inset-0 bg-black/70 z-50 md:hidden" onClick={() => setFiltersModalOpen(false)}>
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-2xl max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-surface border-b border-border-light px-4 py-3 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">{t('countries.filters.label')}</h3>
                            <button
                                onClick={() => setFiltersModalOpen(false)}
                                className="p-2 text-text-light hover:text-white transition-colors cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-4 space-y-3">
                            {/* Categories Filter - Top Level Collapsible */}
                            {enrichedSubcategories && enrichedSubcategories.length > 0 && (
                                <div className="border border-border-light rounded-xl overflow-hidden">
                                    {/* Categories Header */}
                                    <button
                                        onClick={() => setCategoriesFilterExpanded(!categoriesFilterExpanded)}
                                        className="w-full flex items-center justify-between gap-2 py-4 px-4 bg-primary-light cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <svg className={`w-5 h-5 text-text-light transition-transform ${categoriesFilterExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                            <span className="text-base font-semibold text-white">{t('countries.filters.categories')}</span>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${selectedCategories.size === (availableSubcategories?.length || 0) ? 'bg-accent/10 text-accent' : 'bg-surface text-text-light border border-border-light'}`}>
                                            {selectedCategories.size === (availableSubcategories?.length || 0) ? 'All' : `${selectedCategories.size}/${availableSubcategories?.length || 0}`}
                                        </span>
                                    </button>

                                    {/* Categories Content */}
                                    {categoriesFilterExpanded && (
                                        <div className="px-4 pb-4 bg-surface">
                                            <div className="flex justify-end mb-3">
                                                <button
                                                    onClick={() => toggleAllCategories(availableSubcategories || [])}
                                                    className="text-xs text-accent hover:text-accent-dark transition-colors cursor-pointer"
                                                >
                                                    {selectedCategories.size === (availableSubcategories?.length || 0) ? t('countries.filters.deselectAll') : t('countries.filters.selectAll')}
                                                </button>
                                            </div>
                                            <div className="space-y-1">
                                                {Object.entries(groupedCategories).map(([parentCategory, subcategories]) => {
                                                    const isExpanded = expandedCategorySections.has(parentCategory);
                                                    const selectedInSection = subcategories.filter(c => selectedCategories.has(c.rawSubcategory)).length;
                                                    const allSelectedInSection = selectedInSection === subcategories.length;

                                                    return (
                                                        <div key={parentCategory} className="border border-border-light rounded-lg overflow-hidden">
                                                            {/* Section Header */}
                                                            <button
                                                                onClick={() => toggleCategorySection(parentCategory)}
                                                                className="w-full flex items-center justify-between gap-2 py-2.5 px-3 bg-primary-light cursor-pointer"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <svg className={`w-3.5 h-3.5 text-text-light transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                    </svg>
                                                                    <span className="text-sm font-medium text-white">{getCategoryDisplayName(parentCategory)}</span>
                                                                </div>
                                                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${allSelectedInSection ? 'bg-accent/10 text-accent' : 'bg-surface text-text-light'}`}>
                                                                    {allSelectedInSection ? 'All' : `${selectedInSection}/${subcategories.length}`}
                                                                </span>
                                                            </button>

                                                            {/* Section Content */}
                                                            {isExpanded && (
                                                                <div className="px-3 pb-3 pt-1 bg-surface">
                                                                    <button
                                                                        onClick={() => toggleSectionCategories(subcategories)}
                                                                        className="text-xs text-accent hover:text-accent-dark mb-2 cursor-pointer"
                                                                    >
                                                                        {allSelectedInSection ? 'Deselect all' : 'Select all'}
                                                                    </button>
                                                                    <div className="space-y-1">
                                                                        {subcategories.map(({slugKey, subcategory, rawSubcategory}) => {
                                                                            const isSelected = selectedCategories.has(rawSubcategory);
                                                                            return (
                                                                                <label key={slugKey} className="flex items-center gap-3 py-1.5 cursor-pointer">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={isSelected}
                                                                                        onChange={() => toggleCategory(rawSubcategory)}
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

                            {/* Payment Methods Filter - Top Level Collapsible */}
                            <div className="border border-border-light rounded-xl overflow-hidden">
                                {/* Payment Header */}
                                <button
                                    onClick={() => setPaymentFilterExpanded(!paymentFilterExpanded)}
                                    className="w-full flex items-center justify-between gap-2 py-4 px-4 bg-primary-light cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <svg className={`w-5 h-5 text-text-light transition-transform ${paymentFilterExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        <span className="text-base font-semibold text-white">{t('countries.filters.paymentLabel')}</span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${selectedPayments.size === Object.keys(PAYMENT_METHODS).length ? 'bg-accent/10 text-accent' : 'bg-surface text-text-light border border-border-light'}`}>
                                        {selectedPayments.size === Object.keys(PAYMENT_METHODS).length ? 'All' : `${selectedPayments.size}/${Object.keys(PAYMENT_METHODS).length}`}
                                    </span>
                                </button>

                                {/* Payment Content */}
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
                                                            onChange={() => togglePayment(type)}
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
                                onClick={() => setFiltersModalOpen(false)}
                                className="w-full py-3 bg-accent text-white rounded-btn font-medium hover:bg-accent-dark transition-colors cursor-pointer"
                            >
                                {t('countries.filters.applyFilters')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

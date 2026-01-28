"use client"

import {useMemo, useState, useEffect} from "react";
import MapGL, { Marker } from "react-map-gl/maplibre";
import maplibregl from 'maplibre-gl';
import "maplibre-gl/dist/maplibre-gl.css";

import Image from "next/image";
import {EnrichedVenue, GoogleReview} from "@/models/Overpass";
import {parseTags, formatOpeningHours} from "@/utils/OsmHelpers";
import {Link} from '@/i18n/navigation';
import { NewsletterCTA } from "@/components/common";
import {getLocalizedCitySlug, getLocalizedCountryCategorySlug, getLocalizedCountrySlug} from "@/utils/SlugUtils";
import {deslugify} from "@/utils/StringUtils";
import {getSubcategoryLabel, PLACE_CATEGORIES} from "@/constants/PlaceCategories";
import {useLocale, useTranslations} from "next-intl";
import {Locale} from "@/i18n/types";
import {getLocalizedCountryName} from "@/utils/CountryUtils";
import {PAYMENT_METHODS} from "@/constants/PaymentMethods";
import {SOCIAL_CONTACTS} from "@/constants/SocialIcons";
import {getFormattedAddress} from "@/utils/AddressUtils";
import {useGooglePlaceMatch} from "@/hooks/useGooglePlaceMatch";
import moment from 'moment';
import { VerifyOwnershipButton } from "@/components/verification";

// SVG icons for payment methods
const PaymentIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'lightning':
            return (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
            );
        case 'lightning_contactless':
            return (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11 2L4 12h6l-1 6 7-8h-5l1-8z" />
                    <path d="M17 8c1.5 1.5 2.5 3.5 2.5 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M19.5 5.5c2 2 3.5 5 3.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            );
        case 'onchain':
            return (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h1c.55 0 1 .45 1 1v3c0 .55-.45 1-1 1h-3v1h4v2h-2v2h-2v-2h-1c-.55 0-1-.45-1-1v-3c0-.55.45-1 1-1h3v-1h-4V9h2V7z" />
                </svg>
            );
        default:
            return null;
    }
};

export default function VenuePage({ venue, isPreview }: { venue: EnrichedVenue, isPreview: boolean }) {
    const t = useTranslations('venues')
    const tMap = useTranslations('map.venue-information')
    const locale = useLocale() as Locale
    const [isMounted, setIsMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "about">("overview");

    const {place} = useGooglePlaceMatch(venue);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const {name, paymentMethods, contact, openingHours, description, descriptionsByLocale, note, notesByLocale, specialTags, amenitiesTags, source} = useMemo(() => {
        if (venue) return parseTags(venue.tags);
        else return {name: '', paymentMethods: {}, contact: {}, openingHours: '', description: '', descriptionsByLocale: {}, note: '', notesByLocale: {}, specialTags: {}, amenitiesTags: {}, source: ''};
    }, [venue]);

    const formattedHours = formatOpeningHours(openingHours);

    const countryLabel = useMemo(() => {
        return getLocalizedCountryName(locale, venue.country)
    }, [locale, venue.country])

    const address = useMemo(() => place?.address ?? getFormattedAddress(locale, venue), [locale, venue, place]);

    const score = useMemo(() => place?.rating ?? venue.rating ?? 0, [place, venue.rating]);
    const totalRatings = useMemo(() => place?.userRatingsTotal ?? 0, [place]);

    const reviewsList = useMemo(() => place?.reviews && place.reviews.length > 0 ? (
        place.reviews.map((r: GoogleReview, i: number) => (
            <div key={i} className="bg-primary-light p-4 rounded-card border border-border-light">
                <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{r.author_name || "Anonymous"}</span>
                    <span className="text-xs text-text-light">{r.relative_time_description}</span>
                </div>
                <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-4 h-4 ${i < r.rating ? 'text-amber-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    ))}
                </div>
                {r.text && <p className="text-sm text-text-light leading-relaxed">{r.text}</p>}
            </div>
        ))
    ) : null, [place]);

    const {featuredPhoto} = useMemo(() => {
        if (place?.photos && place.photos.length > 0) {
            const photoUrls = place.photos.map((photo: { photo_reference: string; }) => {
                const photoUrl = new URL('https://maps.googleapis.com/maps/api/place/photo');
                photoUrl.searchParams.set('maxheight', '400');
                photoUrl.searchParams.set('photo_reference', photo.photo_reference);
                photoUrl.searchParams.set('key', String(process.env.NEXT_PUBLIC_MAP_API_KEY_PHOTO));
                return photoUrl.toString()
            })
            return {featuredPhoto: photoUrls[0]}
        } else return {featuredPhoto: null}
    }, [place]);

    const googleMapLink = useMemo(() => {
        if (place?.placeId) {
            return `https://www.google.com/maps/place/?q=place_id:${place.placeId}`;
        }
        const { lat, lon } = venue;
        const query = address && address.length > 0 ? encodeURIComponent(address) : `${lat},${lon}`;
        return `https://www.google.com/maps/search/?api=1&query=${query}`;
    }, [venue, place, address]);

    const categoryLabel = venue.subcategory && venue.category
        ? getSubcategoryLabel(locale, venue.category, venue.subcategory)
        : venue.category ? PLACE_CATEGORIES[locale][venue.category]?.label : null;

    const enabledPayments = paymentMethods
        ? Object.entries(paymentMethods).filter(([, v]) => v === "yes").map(([type]) => type)
        : [];

    if (!venue) return <p className="p-8 text-center text-text-light">Loading venue...</p>;

    return (
        <section className="bg-primary min-h-screen">
            {/* Hero Header */}
            <div className="w-full bg-gradient-primary pt-20 pb-8 px-8 max-md:px-4">
                <div className="max-w-container mx-auto">
                    {/* Preview Warning */}
                    {isPreview && (
                        <div className="mb-4 p-3 bg-amber-500/20 border border-amber-400/30 rounded-card text-white text-sm">
                            <strong className="text-amber-300">Preview Mode:</strong> This venue has not been published yet and is only visible to you.
                        </div>
                    )}

                    {/* Breadcrumb */}
                    <nav aria-label="Breadcrumb" className="mb-6">
                        <ol className="flex flex-wrap list-none gap-2 text-sm [&_li]:after:content-['/'] [&_li]:after:ml-2 [&_li]:after:text-white/50 [&_li:last-child]:after:content-[''] [&_li:last-child]:after:m-0 [&_a]:text-white/80 [&_a]:no-underline [&_a]:transition-colors [&_a:hover]:text-white [&_span]:text-white">
                            <li>
                                <Link href="/countries">{t('breadcrumb.home')}</Link>
                            </li>
                            <li>
                                {(venue.city || venue.subcategory) && countryLabel ? (
                                    <Link href={`/${getLocalizedCountrySlug(countryLabel, locale)}`}>
                                        {countryLabel}
                                    </Link>
                                ) : (
                                    <span>{countryLabel}</span>
                                )}
                            </li>
                            {venue.city && countryLabel && (
                                <li>
                                    {venue.subcategory ? (
                                        <Link href={`/${getLocalizedCitySlug(countryLabel, venue.city, locale)}`}>
                                            {deslugify(venue.city)}
                                        </Link>
                                    ) : (
                                        <span>{deslugify(venue.city)}</span>
                                    )}
                                </li>
                            )}
                            {venue.subcategory && venue.category && countryLabel && (
                                <li>
                                    <Link href={`/${getLocalizedCountryCategorySlug(countryLabel, venue.subcategory, locale)}`}>
                                        {getSubcategoryLabel(locale, venue.category, venue.subcategory)}
                                    </Link>
                                </li>
                            )}
                        </ol>
                    </nav>

                    {/* Venue Title & Quick Info */}
                    <div className="flex items-end justify-between gap-8 max-md:flex-col max-md:items-start">
                        <div className="flex-1">
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{name || 'Unnamed Venue'}</h1>

                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                {categoryLabel && (
                                    <span className="inline-flex items-center bg-white/10 text-white py-1.5 px-3 rounded-full text-sm">
                                        {categoryLabel}
                                    </span>
                                )}
                                {score > 0 && (
                                    <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 py-1.5 px-3 rounded-full text-sm">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        {score.toFixed(1)} {totalRatings > 0 && `(${totalRatings})`}
                                    </span>
                                )}
                            </div>

                            {/* Payment Methods */}
                            {enabledPayments.length > 0 && (
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-white/60 text-sm">Accepts:</span>
                                    <div className="flex items-center gap-1.5">
                                        {enabledPayments.map((type) => {
                                            const info = PAYMENT_METHODS[type];
                                            if (!info) return null;
                                            return (
                                                <span
                                                    key={type}
                                                    className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-accent-light"
                                                    title={info.label}
                                                >
                                                    <PaymentIcon type={type} />
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Map Preview with Action Buttons */}
                        <div className="relative w-[320px] max-md:w-full shrink-0 space-y-3">
                            {/* Map - Clickable to open full map */}
                            <Link
                                href={`/map?lat=${venue.lat}&lon=${venue.lon}&zoom=16&venue=${venue.id}`}
                                className="relative block group"
                            >
                                <div className="relative overflow-hidden rounded-card shadow-medium h-[160px]">
                                    {isMounted ? (
                                        <MapGL
                                            mapLib={maplibregl}
                                            initialViewState={{
                                                longitude: venue.lon,
                                                latitude: venue.lat,
                                                zoom: 15,
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
                                            <Marker longitude={venue.lon} latitude={venue.lat} anchor="center">
                                                <div className="w-3 h-3 bg-accent rounded-full border-2 border-white shadow-md" />
                                            </Marker>
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
                                            View on map
                                        </span>
                                        <span className="bg-white/20 backdrop-blur-sm text-white text-xs py-1 px-2 rounded-full flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                                            </svg>
                                            1 pin
                                        </span>
                                    </div>
                                </div>
                            </Link>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                <a
                                    href={googleMapLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white py-2.5 px-4 rounded-btn font-medium text-sm transition-colors no-underline"
                                    title={tMap('getDirections')}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="max-md:hidden">{tMap('getDirections')}</span>
                                </a>
                                {contact?.website && (
                                    <a
                                        href={contact.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-2.5 px-4 rounded-btn font-medium text-sm transition-colors no-underline"
                                        title="Website"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                        </svg>
                                        <span className="max-md:hidden">Website</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full pb-8 px-8 max-md:px-4">
                <div className="max-w-container mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
                        {/* Left Column - Information */}
                        <div className="space-y-6">
                            {/* Featured Photo */}
                            {featuredPhoto && (
                                <div className="relative h-[300px] rounded-card overflow-hidden shadow-medium">
                                    <Image
                                        src={featuredPhoto}
                                        alt={name || 'Venue photo'}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                </div>
                            )}

                            {/* Tabs */}
                            <div className="bg-surface rounded-card border border-border-light overflow-hidden">
                                <nav className="flex border-b border-border-light">
                                    {(['overview', 'reviews', 'about'] as const).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors cursor-pointer ${
                                                activeTab === tab
                                                    ? 'text-accent border-b-2 border-accent bg-accent/5'
                                                    : 'text-text-light hover:text-white hover:bg-primary-light'
                                            }`}
                                        >
                                            {tMap(`tabs.${tab}`)}
                                        </button>
                                    ))}
                                </nav>

                                <div className="p-6">
                                    {/* Overview Tab */}
                                    {activeTab === 'overview' && (
                                        <div className="space-y-6">
                                            {/* Quick Info Grid */}
                                            <div className="grid gap-4">
                                                {address && (
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                                            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-text-light uppercase tracking-wide mb-1">Address</p>
                                                            <p className="text-white">{address}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {formattedHours && (
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                                            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-text-light uppercase tracking-wide mb-1">Hours</p>
                                                            <p className="text-white">{formattedHours}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {contact?.email && (
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                                            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-text-light uppercase tracking-wide mb-1">Email</p>
                                                            <a href={`mailto:${contact.email}`} className="text-accent hover:text-accent-dark no-underline">
                                                                {contact.email}
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}

                                                {contact?.phone && (
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                                            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-text-light uppercase tracking-wide mb-1">Phone</p>
                                                            <a href={`tel:${contact.phone}`} className="text-accent hover:text-accent-dark no-underline">
                                                                {contact.phone}
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Description */}
                                            {(description || descriptionsByLocale[locale]) && (
                                                <div className="pt-4 border-t border-border-light">
                                                    <h3 className="text-sm font-semibold text-white mb-2">Description</h3>
                                                    <p className="text-text-light leading-relaxed">{descriptionsByLocale[locale] || description}</p>
                                                </div>
                                            )}

                                            {/* Special Tags */}
                                            {specialTags && Object.keys(specialTags).length > 0 && (
                                                <div className="pt-4 border-t border-border-light">
                                                    <h3 className="text-sm font-semibold text-white mb-3">Features</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.entries(specialTags).map(([key, value]) => (
                                                            value.split(/[;,]/).map(v => (
                                                                <span key={`${key}-${v}`} className="inline-flex items-center bg-primary-light py-1.5 px-3 rounded-full text-xs text-text-light border border-border-light">
                                                                    {deslugify(v.trim().replace(/_/g, '-'))}
                                                                </span>
                                                            ))
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Amenities */}
                                            {amenitiesTags && Object.keys(amenitiesTags).length > 0 && (
                                                <div className="pt-4 border-t border-border-light">
                                                    <h3 className="text-sm font-semibold text-white mb-3">{tMap('amenities')}</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.entries(amenitiesTags).map(([key, value]) => (
                                                            <span key={key} className="inline-flex items-center bg-green-500/20 text-green-400 py-1.5 px-3 rounded-full text-xs">
                                                                {deslugify(key.replace(/_/g, '-'))}: {deslugify(value.replace(/_/g, '-'))}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Payment Methods */}
                                            {enabledPayments.length > 0 && (
                                                <div className="pt-4 border-t border-border-light">
                                                    <h3 className="text-sm font-semibold text-white mb-3">{tMap('paymentMethods')}</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {enabledPayments.map((type) => {
                                                            const info = PAYMENT_METHODS[type];
                                                            if (!info) return null;
                                                            return (
                                                                <span key={type} className="inline-flex items-center gap-2 bg-accent/10 text-accent py-2 px-3 rounded-lg text-sm">
                                                                    <PaymentIcon type={type} />
                                                                    {info.label}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Social & Contact */}
                                            {contact && Object.keys(contact).length > 0 && (
                                                <div className="pt-4 border-t border-border-light">
                                                    <h3 className="text-sm font-semibold text-white mb-3">{tMap('contactAndSocials')}</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.entries(contact).map(([type, value]) => {
                                                            const info = SOCIAL_CONTACTS[type];
                                                            if (!value || !info) return null;
                                                            const href = type === "phone" ? `tel:${value}` : value;
                                                            return (
                                                                <a
                                                                    key={type}
                                                                    href={href}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="w-10 h-10 rounded-full bg-primary-light hover:bg-surface-light flex items-center justify-center text-lg text-text-light hover:text-accent transition-colors no-underline border border-border-light"
                                                                    title={info.label}
                                                                >
                                                                    {info.icon}
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Reviews Tab */}
                                    {activeTab === 'reviews' && (
                                        <div className="space-y-4">
                                            {score > 0 && (
                                                <div className="flex items-center gap-4 pb-4 border-b border-border-light">
                                                    <div className="text-4xl font-bold text-white">{score.toFixed(1)}</div>
                                                    <div>
                                                        <div className="flex items-center gap-0.5 mb-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <svg key={i} className={`w-5 h-5 ${i < Math.round(score) ? 'text-amber-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                </svg>
                                                            ))}
                                                        </div>
                                                        <p className="text-sm text-text-light">{totalRatings} {tMap('tabs.reviews')}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {reviewsList ? (
                                                <div className="space-y-3">
                                                    {reviewsList}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <svg className="w-12 h-12 mx-auto text-text-light mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                    <p className="text-text-light">{tMap('noReviews')}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* About Tab */}
                                    {activeTab === 'about' && (
                                        <div className="space-y-6">
                                            {(description || descriptionsByLocale[locale]) && (
                                                <div>
                                                    <h3 className="text-sm font-semibold text-white mb-2">Description</h3>
                                                    <p className="text-text-light leading-relaxed">{descriptionsByLocale[locale] || description}</p>
                                                </div>
                                            )}

                                            {(note || notesByLocale[locale]) && (
                                                <div>
                                                    <h3 className="text-sm font-semibold text-white mb-2">Notes</h3>
                                                    <p className="text-text-light leading-relaxed">{notesByLocale[locale] || note}</p>
                                                </div>
                                            )}

                                            <div className="pt-4 border-t border-border-light">
                                                <h3 className="text-sm font-semibold text-white mb-3">Data Source</h3>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-text-light">Source:</span>
                                                        <a href="https://openstreetmap.org" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-dark no-underline">
                                                            OpenStreetMap
                                                        </a>
                                                    </div>
                                                    {source && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-text-light">Submitted via:</span>
                                                            <span className="text-white">{source}</span>
                                                        </div>
                                                    )}
                                                    {venue.user && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-text-light">Contributor:</span>
                                                            <span className="text-white">{venue.user}</span>
                                                        </div>
                                                    )}
                                                    {venue.timestamp && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-text-light">Last updated:</span>
                                                            <span className="text-white">{moment(venue.timestamp).format('MMM DD, YYYY')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Sidebar */}
                        <div className="lg:sticky lg:top-24 h-fit space-y-4">

                            {/* Verify Ownership - only show if venue has an email */}
                            {contact?.email && (
                                <div className="bg-surface rounded-card border border-border-light p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        <h4 className="text-sm font-medium text-white">Are you the owner?</h4>
                                    </div>
                                    <p className="text-xs text-text-light mb-3">
                                        Verify your ownership to get a verified badge and manage this listing.
                                    </p>
                                    <VerifyOwnershipButton
                                        venue={venue}
                                        venueName={name || 'This venue'}
                                        osmEmail={contact.email}
                                    />
                                </div>
                            )}

                            {/* Suggest Edit */}
                            <div className="bg-surface rounded-card border border-border-light p-4 text-center">
                                <p className="text-xs text-text-light mb-2">See something wrong?</p>
                                <Link
                                    href={`/places/${venue.id}/edit`}
                                    className="text-sm text-accent hover:text-accent-dark no-underline"
                                >
                                    Suggest an edit →
                                </Link>
                            </div>

                        </div>
                    </div>
                    {/* Newsletter */}
                    <NewsletterCTA />
                </div>
            </div>
        </section>
    );
}

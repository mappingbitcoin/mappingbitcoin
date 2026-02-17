"use client"

import {useMemo, useState, useEffect} from "react";
import MapGL, { Marker } from "react-map-gl/maplibre";
import maplibregl from 'maplibre-gl';
import "maplibre-gl/dist/maplibre-gl.css";

import Image from "next/image";
import {EnrichedVenue} from "@/models/Overpass";
import {parseTags, formatOpeningHours} from "@/utils/OsmHelpers";
import {Link} from '@/i18n/navigation';
import { NewsletterCTA } from "@/components/common";
import { Button, TabButton, TextLink } from "@/components/ui";
import {getLocalizedCitySlug, getLocalizedCountryCategorySlug, getLocalizedCountrySlug} from "@/utils/SlugUtils";
import {deslugify} from "@/utils/StringUtils";
import {getSubcategoryLabel, PLACE_CATEGORIES} from "@/constants/PlaceCategories";
import {useLocale, useTranslations} from "next-intl";
import {Locale} from "@/i18n/types";
import {getLocalizedCountryName} from "@/utils/CountryUtils";
import {PAYMENT_METHODS} from "@/constants/PaymentMethods";
import {SOCIAL_ICONS} from "@/constants/SocialIcons";
import {getFormattedAddress} from "@/utils/AddressUtils";
import moment from 'moment';
import { VerifyOwnershipButton } from "@/components/verification";
import { canVerifyVenue } from "@/lib/verification/domainUtils";
import { ReviewsSection } from "@/components/reviews";
import {
    StarIcon,
    ChevronRightIcon,
    PinIcon,
    DirectionsIcon,
    ClockIcon,
    ShieldCheckIcon,
    ChatIcon,
    EmailIcon,
    WebsiteIcon,
    PhoneIcon,
} from "@/assets/icons";
import { PaymentIcon } from "@/constants/PaymentIcons";

export default function VenuePage({ venue, isPreview }: { venue: EnrichedVenue, isPreview: boolean }) {
    const t = useTranslations('venues')
    const tMap = useTranslations('map.venue-information')
    const locale = useLocale() as Locale
    const [isMounted, setIsMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "about">("overview");
    const [imageError, setImageError] = useState(false);

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

    const address = useMemo(() => getFormattedAddress(locale, venue), [locale, venue]);

    const score = useMemo(() => venue.rating ?? 0, [venue.rating]);

    // Featured photo from OSM image tag
    const featuredPhoto = useMemo(() => {
        if (venue.tags?.image) {
            return venue.tags.image;
        }
        return null;
    }, [venue.tags?.image]);

    const googleMapLink = useMemo(() => {
        const { lat, lon } = venue;
        const query = address && address.length > 0 ? encodeURIComponent(address) : `${lat},${lon}`;
        return `https://www.google.com/maps/search/?api=1&query=${query}`;
    }, [venue, address]);

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
                            {/* Featured Photo - small, above name */}
                            {featuredPhoto && !imageError && (
                                <div className="relative h-[120px] w-[200px] rounded-lg overflow-hidden shadow-medium mb-4">
                                    <Image
                                        src={featuredPhoto}
                                        alt={name || 'Venue photo'}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                        onError={() => setImageError(true)}
                                    />
                                </div>
                            )}
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{name || 'Unnamed Venue'}</h1>

                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                {categoryLabel && (
                                    <span className="inline-flex items-center bg-white/10 text-white py-1.5 px-3 rounded-full text-sm">
                                        {categoryLabel}
                                    </span>
                                )}
                                {score > 0 && (
                                    <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 py-1.5 px-3 rounded-full text-sm">
                                        <StarIcon className="w-4 h-4" />
                                        {score.toFixed(1)}
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
                                href={`/map?lat=${venue.lat}&lon=${venue.lon}&zoom=16&venue=${venue.slug || venue.id}`}
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
                                            <ChevronRightIcon className="w-4 h-4" />
                                            View on map
                                        </span>
                                        <span className="bg-white/20 backdrop-blur-sm text-white text-xs py-1 px-2 rounded-full flex items-center gap-1">
                                            <PinIcon className="w-3 h-3" />
                                            1 pin
                                        </span>
                                    </div>
                                </div>
                            </Link>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                <Button
                                    href={googleMapLink}
                                    external
                                    variant="solid"
                                    color="accent"
                                    size="sm"
                                    leftIcon={<DirectionsIcon className="w-4 h-4" />}
                                    className="flex-1"
                                    title={tMap('getDirections')}
                                >
                                    <span className="max-md:hidden">{tMap('getDirections')}</span>
                                </Button>
                                {contact?.website && (
                                    <Button
                                        href={contact.website}
                                        external
                                        variant="ghost"
                                        color="neutral"
                                        size="sm"
                                        leftIcon={<WebsiteIcon className="w-4 h-4" />}
                                        title="Website"
                                    >
                                        <span className="max-md:hidden">Website</span>
                                    </Button>
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
                            {/* Tabs */}
                            <div className="bg-surface rounded-card border border-border-light overflow-hidden">
                                <nav className="flex border-b border-border-light">
                                    {(['overview', 'reviews', 'about'] as const).map((tab) => (
                                        <TabButton
                                            key={tab}
                                            active={activeTab === tab}
                                            onClick={() => setActiveTab(tab)}
                                            className="flex-1"
                                        >
                                            {tMap(`tabs.${tab}`)}
                                        </TabButton>
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
                                                            <DirectionsIcon className="w-5 h-5 text-accent" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-text-light uppercase tracking-wide mb-1">Address</p>
                                                            <p className="text-white">{address}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {contact?.website && (
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                                            <WebsiteIcon className="w-5 h-5 text-accent" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-text-light uppercase tracking-wide mb-1">Website</p>
                                                            <TextLink href={contact.website} external variant="accent" className="break-all">
                                                                {contact.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                                            </TextLink>
                                                        </div>
                                                    </div>
                                                )}

                                                {formattedHours && (
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                                            <ClockIcon className="w-5 h-5 text-accent" />
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
                                                            <EmailIcon className="w-5 h-5 text-accent" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-text-light uppercase tracking-wide mb-1">Email</p>
                                                            <TextLink href={`mailto:${contact.email}`} external variant="accent">
                                                                {contact.email}
                                                            </TextLink>
                                                        </div>
                                                    </div>
                                                )}

                                                {contact?.phone && (
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                                                            <PhoneIcon className="w-5 h-5 text-accent" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-text-light uppercase tracking-wide mb-1">Phone</p>
                                                            <TextLink href={`tel:${contact.phone}`} external variant="accent">
                                                                {contact.phone}
                                                            </TextLink>
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

                                            {/* Socials */}
                                            {contact && Object.entries(contact).some(([type]) => SOCIAL_ICONS[type]) && (
                                                <div className="pt-4 border-t border-border-light">
                                                    <h3 className="text-sm font-semibold text-white mb-3">{tMap('socials')}</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.entries(contact).map(([type, value]) => {
                                                            const info = SOCIAL_ICONS[type];
                                                            if (!value || !info) return null;
                                                            return (
                                                                <a
                                                                    key={type}
                                                                    href={value}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="w-10 h-10 rounded-full bg-primary-light hover:bg-surface-light flex items-center justify-center text-text-light hover:text-accent transition-colors no-underline border border-border-light"
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
                                        <ReviewsSection
                                            osmId={`${venue.type}/${venue.id}`}
                                            venueSlug={`${venue.type}-${venue.id}`}
                                        />
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
                                                        <TextLink href="https://openstreetmap.org" external variant="accent">
                                                            OpenStreetMap
                                                        </TextLink>
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

                            {/* Verify Ownership - only show if venue has a verifiable domain */}
                            {canVerifyVenue(venue.tags) && (
                                <div className="bg-surface rounded-card border border-border-light p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ShieldCheckIcon className="w-4 h-4 text-accent" />
                                        <h4 className="text-sm font-medium text-white">Are you the owner?</h4>
                                    </div>
                                    <p className="text-xs text-text-light mb-3">
                                        Verify your ownership to get a verified badge and manage this listing.
                                    </p>
                                    <VerifyOwnershipButton
                                        venue={venue}
                                        venueName={name || 'This venue'}
                                        osmEmail={contact?.email}
                                    />
                                </div>
                            )}

                            {/* Suggest Edit */}
                            <div className="bg-surface rounded-card border border-border-light p-4 text-center">
                                <p className="text-xs text-text-light mb-2">See something wrong?</p>
                                <TextLink
                                    href={`/places/${venue.slug || venue.id}/edit`}
                                    variant="accent"
                                    className="text-sm"
                                >
                                    Suggest an edit →
                                </TextLink>
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

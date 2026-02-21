"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Locale } from "@/i18n/types";
import { deslugify } from "@/utils/StringUtils";
import { getLocalizedCitySlug, getLocalizedCountrySlug } from "@/utils/SlugUtils";
import { getSubcategoryLabel } from "@/constants/PlaceCategories";
import { CategoryAndSubcategory } from "@/constants/PlaceOsmDictionary";
import { EnrichedVenue } from "@/models/Overpass";
import { ChevronRightIcon } from "@/assets/icons/ui";
import MapGL, { Marker } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface PlacesDirectoryHeroProps {
    heading: string;
    description: string;
    totalPlaces: number;
    newThisWeek: number;
    country: string;
    city?: string;
    categoryAndSubcategory?: CategoryAndSubcategory;
    places: EnrichedVenue[];
    initialViewState: {
        longitude: number;
        latitude: number;
        zoom: number;
    };
}

export default function PlacesDirectoryHero({
    heading,
    description,
    totalPlaces,
    newThisWeek,
    country,
    city,
    categoryAndSubcategory,
    places,
    initialViewState,
}: PlacesDirectoryHeroProps) {
    const t = useTranslations();
    const locale = useLocale() as Locale;
    const [mapMounted, setMapMounted] = useState(false);

    useEffect(() => {
        setMapMounted(true);
    }, []);

    return (
        <div className="w-full bg-gradient-primary pt-20 pb-12 px-8 max-md:px-4">
            <div className="max-w-container mx-auto">
                <div className="flex items-center justify-between gap-8 max-md:flex-col">
                    {/* Left: Title & Description */}
                    <div className="flex-1">
                        {/* Breadcrumb */}
                        <nav aria-label="Breadcrumb" className="mb-6">
                            <ol className="flex flex-wrap list-none gap-2 text-sm [&_li]:after:content-['/'] [&_li]:after:ml-2 [&_li]:after:text-white/50 [&_li:last-child]:after:content-[''] [&_li:last-child]:after:m-0 [&_a]:text-white/80 [&_a]:no-underline [&_a]:transition-colors [&_a:hover]:text-white [&_span]:text-white">
                                <li>
                                    <Link href="/countries">{t("countries.breadcrumb.home")}</Link>
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
                                <span className="text-lg font-bold text-white">{totalPlaces.toLocaleString()}</span>
                                <span className="text-sm text-white/70">{t("countries.stats.totalPlaces")}</span>
                            </span>
                            {newThisWeek > 0 && (
                                <span className="inline-flex items-center gap-1.5 bg-green-500/20 text-green-300 py-1.5 px-3 rounded-full text-sm font-medium">
                                    +{newThisWeek} {t("countries.stats.newThisWeek")}
                                </span>
                            )}
                        </div>
                        <p className="text-base text-white/70 max-w-xl">{description}</p>
                    </div>

                    {/* Right: Map Preview */}
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
                                    {places.slice(0, 100).map((place) => (
                                        <Marker
                                            key={place.id}
                                            longitude={place.lon}
                                            latitude={place.lat}
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
                                    <ChevronRightIcon className="w-4 h-4" />
                                    {t("countries.actions.goToMap")}
                                </span>
                                <span className="bg-white/20 backdrop-blur-sm text-white text-xs py-1 px-2 rounded-full">
                                    {totalPlaces} pins
                                </span>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}

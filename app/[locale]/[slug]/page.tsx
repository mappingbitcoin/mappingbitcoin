import { notFound } from "next/navigation";
import { generateCanonical } from "@/i18n/seo";
import { env } from "@/lib/Environment";
import type { Metadata } from "next";
import {getPageSeo} from "@/utils/SEOUtils";
import {Locale, Localized} from "@/i18n/types";
import {deslugify} from "@/utils/StringUtils";
import {getMessages} from "next-intl/server";
import {getLocalizedFromMessages} from "@/app/[locale]/[slug]/MerchantUtils";
import {Link} from '@/i18n/navigation';
import {getLocalizedCitySlug, getLocalizedCountryCategorySlug, getLocalizedCountrySlug} from "@/utils/SlugUtils";
import {EnrichedVenue} from "@/models/Overpass";
import {getSubcategoryLabel, matchPlaceSubcategory, PlaceSubcategory} from "@/constants/PlaceCategories";
import { CategoryChip } from "@/components/ui";
import {getLocalizedCountryName} from "@/utils/CountryUtils";
import {RegionQuery, VenueSlugEntrySEO} from "@/models/VenueSlug";
import {getSlugsCache} from "@/app/api/cache/SlugsCache";
import {parseTags} from "@/utils/OsmHelpers";
import Script from "next/script";
import React from "react";
import { distance } from 'fastest-levenshtein';
import { PageSection } from "@/components/layout";
import PlacesDirectoryWrapper from "@/app/[locale]/[slug]/PlacesDirectoryWrapper";

function parseVenueSlug(slug: string): { venueInformation: VenueSlugEntrySEO, exactMatch: boolean } | null {
    const lowerSlug = slug.toLowerCase();
    const cache = getSlugsCache() ?? {};

    // 1. Exact match
    let data = cache[lowerSlug];
    if (data) return {venueInformation: data, exactMatch: true};

    // 2. Ho Chi Minh workaround
    const fallbackSlug = lowerSlug.replaceAll('-city', '');
    data = cache[fallbackSlug];
    if (data) return {venueInformation: data, exactMatch: true};

    // 3. Try closest match by pattern
    const parsed = parseSlugPattern(lowerSlug);
    if (!parsed) return null;

    const candidates = Object.entries(cache)
        .filter(([cachedSlug]) => {
            const parsedCandidate = parseSlugPattern(cachedSlug);
            if (!parsedCandidate) return false;

            return (
                parsedCandidate.category === parsed.category &&
                parsedCandidate.country === parsed.country &&
                parsedCandidate.lang === parsed.lang
            );
        });

    if (candidates.length === 0) return null;

    // Optional: sort candidates by similarity of city string
    const closest = candidates.sort((a, b) => {
        const cityA = parseSlugPattern(a[0])?.city ?? '';
        const cityB = parseSlugPattern(b[0])?.city ?? '';
        const scoreA = distance(cityA, parsed.city ?? '');
        const scoreB = distance(cityB, parsed.city ?? '');
        return scoreA - scoreB;
    })[0];

    return {venueInformation: closest[1], exactMatch: false};
}

function parseSlugPattern(slug: string): {
    category: string;
    city?: string;
    country: string;
    lang: 'en' | 'es';
} | null {
    const enMatch = slug.match(/^bitcoin-(.+)-in-(.+)-([a-z]{2,})$/);
    if (enMatch) {
        const [, category, city, country] = enMatch;
        return { category, city, country, lang: 'en' };
    }

    const esMatch = slug.match(/^(.+)-bitcoin-en-(.+)-([a-z]{2,})$/);
    if (esMatch) {
        const [, category, city, country] = esMatch;
        return { category, city, country, lang: 'es' };
    }

    return null;
}

type CityWithCount = { name: string; count: number };

async function fetchVenuesByRegion({ country, location, categoryAndSubcategory }: RegionQuery): Promise<{ venues: EnrichedVenue[], availableCities?: CityWithCount[], availableCategories?: PlaceSubcategory[] }> {
    const params = new URLSearchParams();
    params.append("country", country);
    if (location) params.append("city", location ?? '');
    if (categoryAndSubcategory) params.append("subcategory", categoryAndSubcategory.subcategory);

    try {
        const res = await fetch(`${env.siteUrl || "http://localhost:3000"}/api/places/region?${params.toString()}`);
        if (!res.ok) return {venues: []};
        return (await res.json()) as { venues: EnrichedVenue[], cities: string[], categories:[] };
    } catch (error) {
        console.error("Failed to fetch venues by region:", error);
        return {venues: []};
    }
}

type PageProps = {
    params: Promise<{
        slug: string;
    }>;
} & Localized

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale, slug } = await params;
    const data = parseVenueSlug(slug);

    if (!data) return notFound();

    const { country, location, categoryAndSubcategory, alternates} = data.venueInformation;

    const result = await getPageSeo("merchant-pages")({ params });
    const baseMetadata = result?.metadata;

    if (!baseMetadata || !locale) {
        console.warn(`[SEO] Missing base metadata or locale for slug: ${slug}`);
        return notFound(); // or return fallback metadata here
    }

    const all = await getMessages({ locale });
    const t = { merchants: all.merchants, map: all.map } as Record<string, any>;
    const countryLabel = getLocalizedCountryName(locale, country);

    if (!countryLabel) return notFound();

    const translatedTitle = getLocalizedFromMessages({ t, locale, attribute: 'headings', country: countryLabel, city: deslugify(location), categoryAndSubcategory });
    const translatedDescription = getLocalizedFromMessages({ t, locale, attribute: 'descriptions', country: countryLabel, city: deslugify(location), categoryAndSubcategory });
    const translatedKeywords = getLocalizedFromMessages({ t, locale, attribute: 'keywords', country: countryLabel, city: deslugify(location), categoryAndSubcategory });

    const languages: Record<string, string> = {}
    let canonical = generateCanonical(slug, locale);

    if (alternates) {
        const keys = Object.keys(alternates)
        for (let i = 0; i < keys.length; ++i) {
            const key = keys[i]
            const value = alternates[key as Locale];
            languages[key] = `${env.siteUrl}/${value}`;
        }
        languages["x-default"] = `${env.siteUrl}/${alternates["en"]}`;
        canonical = `${env.siteUrl}/${alternates[locale]}`;
    }

    const siteSuffix = " | Mapping Bitcoin";

    return {
        title: `${translatedTitle}${siteSuffix}`,
        description: translatedDescription,
        keywords: translatedKeywords,
        alternates: {
            languages,
            canonical,
        },
        openGraph: {
            type: "website",
            images: baseMetadata.openGraph?.images,
            title: `${translatedTitle}${siteSuffix}`,
            description: translatedDescription,
            url: canonical,
        },
        twitter: {
            card: "summary_large_image",
            images: baseMetadata.twitter?.images,
            title: `${translatedTitle}${siteSuffix}`,
            description: translatedDescription,
            site: canonical
        }
    };
}


export default async function PlacesDirectoryPage({ params }: PageProps) {
    const { slug, locale } = await params;
    const all2 = await getMessages({ locale: 'en' });
    const t = { merchants: all2.merchants, map: all2.map } as Record<string, any>;

    const data = parseVenueSlug(slug)

    if (!data) return (
        <PageSection padding="default" background="white" className="pt-12">
            <h1 className="text-[2rem] font-bold mb-6">
                No results for the given parameters.
            </h1>
            <p>We couldn&#39;t find any venues that match your search.</p>
        </PageSection>
    )

    const {country, location, categoryAndSubcategory, alternates} = data.venueInformation

    const countryLabel = getLocalizedCountryName(locale, country);

    if (!countryLabel) return notFound();
    const {venues, availableCities, availableCategories} = await fetchVenuesByRegion({ country, location: location ? deslugify(location): undefined, categoryAndSubcategory });

    if (!venues.length) {

        const seen = new Map();

        availableCategories?.forEach((cat) => {
            const slugKey = getLocalizedCountryCategorySlug(countryLabel, cat, locale);
            const match = matchPlaceSubcategory(cat);
            if (match) {
                const key = slugKey; // or use `${match.category}-${match.subcategory}` if you prefer
                if (!seen.has(key)) {
                    seen.set(key, {
                        ...match,
                        slugKey,
                        subcategory: getSubcategoryLabel(locale, match.category, match.subcategory),
                    });
                }
            }
        });

        const enrichedSubcategories = Array.from(seen.values());

        return (
            <PageSection padding="default" background="white" className="pt-12">
                <h1 className="text-[2rem] font-bold mb-6">
                    No results for {categoryAndSubcategory ? `${getSubcategoryLabel(locale, categoryAndSubcategory.category, categoryAndSubcategory.subcategory)} in ` : ""}{location ? `${deslugify(location)}, ` : ""}{countryLabel}
                </h1>
                <p>We couldn&#39;t find any venues that match your search.</p>

                {availableCities && availableCities.length > 0 && (
                    <div className="my-8 [&_h3]:text-xl [&_h3]:mb-6">
                        <h3>{t.merchants.suggestions.otherCities.replace("{country}", countryLabel)}</h3>
                        <ul className="flex flex-wrap gap-2">
                            {availableCities.map((cityData) => {
                                const slugKey = getLocalizedCitySlug(countryLabel, cityData.name, locale)
                                return (
                                    slugKey && (
                                        <li key={cityData.name} className="list-none mb-3 [&_a]:bg-gray-100 [&_a]:py-1.5 [&_a]:px-2.5 [&_a]:rounded [&_a]:no-underline [&_a]:text-[0.95rem] [&_a]:text-gray-800 [&_a:hover]:bg-gray-200">
                                            <Link href={`/${slugKey}`}>{cityData.name} ({cityData.count})</Link>
                                        </li>
                                    )
                                );
                            })}
                        </ul>
                    </div>
                )}

                {enrichedSubcategories && enrichedSubcategories.length > 0 && (
                    <div className="flex min-w-[150px] w-full max-w-[350px] flex-col justify-start items-start gap-2 max-md:min-w-full max-md:max-w-full">
                        <h3>{t.merchants.suggestions.otherCategories.replace("{country}", country)}</h3>
                        <ul className="flex flex-wrap gap-2">
                            {enrichedSubcategories.map(({slugKey,category, subcategory}) =>
                                (
                                    <CategoryChip as={"li"} category={category ?? 'other'} key={slugKey}>
                                        <Link href={`/${slugKey}`}>{subcategory ?? t.map["venue-tooltip"]?.defaultCategory}</Link>
                                    </CategoryChip>
                                )
                            )}
                        </ul>
                    </div>
                )}
            </PageSection>
        );
    }

    const translatedTitle = getLocalizedFromMessages({t, locale, attribute: 'headings', country: countryLabel, city: location, categoryAndSubcategory})
    const translatedDescription = getLocalizedFromMessages({ t, locale, attribute: 'descriptions', country: countryLabel, city: deslugify(location), categoryAndSubcategory });
    const subcategorySchemaTypeMap: Record<string, string> = {
        "pizza": "Restaurant",
        "cafe": "CafeOrCoffeeShop",
        "fast_food": "FastFoodRestaurant",
        "hotel": "LodgingBusiness",
        "hostel": "Hostel",
        "bar": "BarOrPub",
        "bakery": "Bakery",
        "coworking_space": "CoworkingSpace", // not official, fallback will be Place
        "atm": "AutomatedTeller",
        "supermarket": "GroceryStore",
    };

    let canonical = generateCanonical(slug, locale);

    if (alternates) {
        canonical = `${env.siteUrl}/${alternates[locale]}`;
    }

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": translatedTitle,
        "url": canonical,
        "description": translatedDescription,
        "hasPart": venues.map((v: EnrichedVenue) => {
            const { name, address } = parseTags(v.tags);
            const subcategory = v.tags?.subcategory;
            const category = v.tags?.category;

            const mappedType = subcategorySchemaTypeMap[subcategory] || "Place";

            return {
                "@type": mappedType,
                "name": name,
                "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": v.lat,
                    "longitude": v.lon
                },
                ...(address?.street && {
                    "address": {
                        "@type": "PostalAddress",
                        "streetAddress": `${address.housenumber || ""} ${address.street}`.trim(),
                        "addressLocality": address.city,
                        "addressRegion": address.state,
                        "addressCountry": address.country
                    }
                }),
                ...(v.tags?.["payment:bitcoin"] === "yes" && {
                    "paymentAccepted": ["Bitcoin"]
                }),
                ...(v.tags?.["internet_access"] && {
                    "amenityFeature": [{
                        "@type": "LocationFeatureSpecification",
                        "name": "WiFi",
                        "value": v.tags["internet_access"]
                    }]
                }),
                ...(v.tags?.["wheelchair"] === "yes" && {
                    "amenityFeature": [
                        ...(v.tags?.["internet_access"] ? [{
                            "@type": "LocationFeatureSpecification",
                            "name": "WiFi",
                            "value": v.tags["internet_access"]
                        }] : []),
                        {
                            "@type": "LocationFeatureSpecification",
                            "name": "Wheelchair accessible",
                            "value": true
                        }
                    ]
                }),
                ...(subcategory && {
                    "additionalType": `https://mappingbitcoin.com/categories/${category}/${subcategory}`
                })
            };
        })
    };

    const breadcrumbItems = [
        {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://mappingbitcoin.com"
        },
        {
            "@type": "ListItem",
            "position": 2,
            "name": country,
            "item": `${generateCanonical(getLocalizedCountrySlug(country, locale), locale)}`
        },
    ];

    if (location) {
        breadcrumbItems.push({
            "@type": "ListItem",
            "position": 3,
            "name": deslugify(location) ?? '',
            "item": `${generateCanonical(getLocalizedCitySlug(country, location, locale), locale)}`
        });
    }

    if (categoryAndSubcategory) {
        breadcrumbItems.push({
            "@type": "ListItem",
            "position": breadcrumbItems.length + 1,
            "name": getSubcategoryLabel(locale, categoryAndSubcategory.category, categoryAndSubcategory.subcategory) ?? '',
            "item": `${generateCanonical(getLocalizedCountryCategorySlug(country, categoryAndSubcategory.subcategory, locale), locale)}`
        });
    }

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbItems
    };

    // Generate SEO content for crawlers
    const subcategoryLabel = categoryAndSubcategory
        ? getSubcategoryLabel(locale, categoryAndSubcategory.category, categoryAndSubcategory.subcategory)
        : null;
    const locationName = location ? deslugify(location) : countryLabel;
    const venueCount = venues.length;

    return (
        <>
            <Script
              id="json-ld"
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Script
              id="breadcrumbs-json-ld"
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            {/* Server-rendered SEO content for crawlers */}
            <div className="sr-only">
                <h1>{translatedTitle}</h1>
                <p>{translatedDescription}</p>
                <h2>About Bitcoin in {locationName}</h2>
                <p>
                    {subcategoryLabel
                        ? `Find ${venueCount} ${subcategoryLabel.toLowerCase()} businesses accepting Bitcoin in ${locationName}. `
                        : `Discover ${venueCount} Bitcoin-accepting businesses in ${locationName}. `}
                    Browse verified merchants, view locations on the map, and support businesses that accept cryptocurrency payments.
                </p>
                <h2>Bitcoin Payment Locations</h2>
                <p>
                    Each listing shows business details, address, and Bitcoin payment information.
                    Our data comes from OpenStreetMap and community contributions, ensuring accurate and up-to-date merchant information.
                </p>
                {subcategoryLabel && (
                    <>
                        <h2>{subcategoryLabel} Accepting Bitcoin</h2>
                        <p>
                            Looking for {subcategoryLabel.toLowerCase()} that accept Bitcoin in {locationName}?
                            Our directory includes verified businesses where you can spend Bitcoin.
                            Filter by location, view on map, and find the perfect place to use your cryptocurrency.
                        </p>
                    </>
                )}
                <h2>Support Bitcoin Adoption</h2>
                <p>
                    By visiting Bitcoin-accepting businesses in {locationName}, you help drive cryptocurrency adoption.
                    Every Bitcoin transaction supports merchants who believe in financial freedom and decentralized payments.
                </p>
            </div>
            <PlacesDirectoryWrapper country={countryLabel} places={venues} city={location} categoryAndSubcategory={categoryAndSubcategory} availableCities={availableCities} availableSubcategories={availableCategories} exactMatch={data.exactMatch} />
        </>
    );
}

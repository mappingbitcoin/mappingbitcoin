import { notFound } from "next/navigation";
import { generateCanonical } from "@/i18n/seo";
import { env } from "@/lib/Environment";
import type { Metadata } from "next";
import {getPageSeo} from "@/utils/SEOUtils";
import {Locale, Localized} from "@/i18n/types";
import {deslugify} from "@/utils/StringUtils";
import {getMessages} from "next-intl/server";
import {getLocalizedFromMessages, generateSeoDescription, generateSeoTitle} from "@/app/[locale]/[slug]/MerchantUtils";
import {Link} from '@/i18n/navigation';
import {getLocalizedCitySlug, getLocalizedCountryCategorySlug, getLocalizedCountrySlug, getSubcategoryFromSlug} from "@/utils/SlugUtils";
import {EnrichedVenue} from "@/models/Overpass";
import {getSubcategoryLabel, matchPlaceSubcategory, PlaceSubcategory} from "@/constants/PlaceCategories";
import { CategoryChip } from "@/components/ui";
import {getLocalizedCountryName, getCountryCodeFromSlug} from "@/utils/CountryUtils";
import {RegionQuery, VenueSlugEntrySEO} from "@/models/VenueSlug";
import {getSlugsCache} from "@/app/api/cache/SlugsCache";
import {parseTags} from "@/utils/OsmHelpers";
import Script from "next/script";
import React from "react";
import { distance } from 'fastest-levenshtein';
import { PageSection } from "@/components/layout";
import PlacesDirectoryWrapper from "@/app/[locale]/[slug]/PlacesDirectoryWrapper";

function parseVenueSlug(slug: string): { venueInformation: VenueSlugEntrySEO, exactMatch: boolean, noVenues?: boolean } | null {
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

    if (candidates.length === 0) {
        // 4. No exact match - validate country and category independently

        // First try to find the country code from cache
        let countryCode: string | null = null;
        const countryEntry = Object.entries(cache).find(([cachedSlug, entry]) => {
            const parsedCandidate = parseSlugPattern(cachedSlug);
            return parsedCandidate?.country === parsed.country && entry.country;
        });

        if (countryEntry) {
            countryCode = countryEntry[1].country;
        } else {
            // Country not in cache - validate using i18n-iso-countries
            countryCode = getCountryCodeFromSlug(parsed.country);
        }

        // Validate the category (convert plural slug to subcategory)
        const subcategory = getSubcategoryFromSlug(parsed.category, parsed.lang);

        // If both country and category are valid, show empty state
        if (countryCode && subcategory) {
            return {
                venueInformation: {
                    type: 'category',
                    locale: parsed.lang,
                    canonical: lowerSlug,
                    country: countryCode,
                    location: parsed.city,
                    categoryAndSubcategory: {
                        category: 'other',
                        subcategory: subcategory
                    }
                },
                exactMatch: false,
                noVenues: true
            };
        }

        // If only country is valid (for "shops" URLs which are country-only)
        if (countryCode && parsed.category === 'shops') {
            return {
                venueInformation: {
                    type: 'country',
                    locale: parsed.lang,
                    canonical: lowerSlug,
                    country: countryCode,
                    location: parsed.city
                },
                exactMatch: false,
                noVenues: true
            };
        }

        return null;
    }

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
    // English: bitcoin-CATEGORY-in-CITY-COUNTRY (with city)
    const enCityMatch = slug.match(/^bitcoin-(.+)-in-(.+)-([a-z]{2,})$/);
    if (enCityMatch) {
        const [, category, city, country] = enCityMatch;
        return { category, city, country, lang: 'en' };
    }

    // English: bitcoin-CATEGORY-in-COUNTRY (country only, no city)
    const enCountryMatch = slug.match(/^bitcoin-(.+)-in-([a-z-]+)$/);
    if (enCountryMatch) {
        const [, category, country] = enCountryMatch;
        return { category, city: undefined, country, lang: 'en' };
    }

    // Spanish: CATEGORY-bitcoin-en-CITY-COUNTRY (with city)
    const esCityMatch = slug.match(/^(.+)-bitcoin-en-(.+)-([a-z]{2,})$/);
    if (esCityMatch) {
        const [, category, city, country] = esCityMatch;
        return { category, city, country, lang: 'es' };
    }

    // Spanish: CATEGORY-bitcoin-en-COUNTRY (country only)
    const esCountryMatch = slug.match(/^(.+)-bitcoin-en-([a-z-]+)$/);
    if (esCountryMatch) {
        const [, category, country] = esCountryMatch;
        return { category, city: undefined, country, lang: 'es' };
    }

    return null;
}

type CityWithCount = { name: string; count: number };

async function fetchVenuesByRegion({ country, location, categoryAndSubcategory }: RegionQuery): Promise<{ venues: EnrichedVenue[], availableCities?: CityWithCount[], availableCategories?: PlaceSubcategory[] }> {
    // Import the data layer directly instead of making HTTP request to avoid self-referential calls
    const { getVenueCache } = await import("@/app/api/cache/VenueCache");
    const slugify = (await import("slugify")).default;

    const countryLower = country.toLowerCase();
    const cityLower = location?.toLowerCase();
    const subcategoryLower = categoryAndSubcategory?.subcategory?.toLowerCase();

    try {
        const venues = await getVenueCache();

        const filtered = venues.filter(v => {
            const venueCountry = v?.country?.toLowerCase();
            if (!venueCountry || venueCountry !== countryLower) return false;

            if (cityLower) {
                const cityMatch = v?.city ? slugify(v?.city).toLowerCase().includes(slugify(cityLower).toLowerCase()) : false;
                const stateMatch = v?.state ? slugify(v?.state).toLowerCase().includes(slugify(cityLower).toLowerCase()) : false;
                if (!cityMatch && !stateMatch) return false;
            }

            return !(subcategoryLower && v.subcategory?.toLowerCase() !== subcategoryLower);
        });

        // All venues in this country
        const countryVenues = venues.filter(v =>
            v.country?.toLowerCase() === countryLower
        );

        // Count venues per city/state
        const cityCounts = new Map<string, number>();
        countryVenues.forEach(v => {
            const venueCity = v.city?.trim();
            const venueState = v.state?.trim();

            if (venueCity && venueCity.toLowerCase() !== cityLower) {
                cityCounts.set(venueCity, (cityCounts.get(venueCity) || 0) + 1);
            }

            if (
                venueState &&
                venueState.toLowerCase() !== venueCity?.toLowerCase() &&
                venueState.toLowerCase() !== cityLower
            ) {
                cityCounts.set(venueState, (cityCounts.get(venueState) || 0) + 1);
            }
        });

        // Convert to array with counts and sort by count descending
        const availableCities = Array.from(cityCounts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        const availableCategories = Array.from(
            new Set(
                countryVenues
                    .map(v => v.subcategory?.trim())
                    .filter(c => c && c.toLowerCase() !== subcategoryLower)
            )
        ).sort((a, b) => a!.localeCompare(b!)) as PlaceSubcategory[];

        return {
            venues: filtered,
            availableCities,
            availableCategories,
        };
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

    const seoTitle = generateSeoTitle({ country: countryLabel, city: deslugify(location), categoryAndSubcategory, locale });
    const translatedDescription = generateSeoDescription({ country: countryLabel, city: deslugify(location), categoryAndSubcategory, locale });
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

    return {
        title: seoTitle,
        description: translatedDescription,
        keywords: translatedKeywords,
        alternates: {
            languages,
            canonical,
        },
        openGraph: {
            type: "website",
            siteName: "Mapping Bitcoin",
            images: baseMetadata.openGraph?.images,
            title: seoTitle,
            description: translatedDescription,
            url: canonical,
        },
        twitter: {
            card: "summary_large_image",
            images: baseMetadata.twitter?.images,
            title: seoTitle,
            description: translatedDescription,
        }
    };
}


export default async function PlacesDirectoryPage({ params }: PageProps) {
    const { slug, locale } = await params;
    const all2 = await getMessages({ locale });
    const t = { merchants: all2.merchants, map: all2.map, countries: all2.countries } as Record<string, any>;

    const data = parseVenueSlug(slug)

    if (!data) return (
        <PageSection padding="default" background="default" className="pt-12">
            <div className="max-w-3xl mx-auto text-center">
                <h1 className="text-[2rem] font-bold mb-4 text-white">
                    {t.countries.emptyState.invalidSlug}
                </h1>
                <p className="text-text-light text-lg mb-8">
                    {t.countries.emptyState.invalidSlugDescription}
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <Link
                        href="/map"
                        className="inline-flex items-center gap-2 bg-surface-light hover:bg-surface-light/80 border border-border-light text-white font-medium px-6 py-3 rounded-lg transition-colors no-underline"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {t.countries.actions.goToMap}
                    </Link>
                    <Link
                        href="/places/create"
                        className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-medium px-6 py-3 rounded-lg transition-colors no-underline shadow-sm hover:shadow"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        {t.countries.actions.addPlace}
                    </Link>
                </div>
            </div>
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
        const locationDisplay = location ? `${deslugify(location)}, ${countryLabel}` : countryLabel;
        const categoryLabel = categoryAndSubcategory
            ? getSubcategoryLabel(locale, categoryAndSubcategory.category, categoryAndSubcategory.subcategory)
            : null;
        const hasSuggestions = (availableCities && availableCities.length > 0) || (enrichedSubcategories && enrichedSubcategories.length > 0);

        return (
            <PageSection padding="default" background="default" className="pt-12">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-[2rem] font-bold mb-4 text-white">
                        {categoryLabel
                            ? t.countries.emptyState.titleWithCategory.replace("{category}", categoryLabel.toLowerCase()).replace("{location}", locationDisplay)
                            : t.countries.emptyState.title.replace("{location}", locationDisplay)
                        }
                    </h1>
                    <p className="text-text-light text-lg mb-8">
                        {categoryLabel
                            ? t.countries.emptyState.descriptionWithCategory.replace("{category}", categoryLabel.toLowerCase())
                            : t.countries.emptyState.description
                        }
                    </p>

                    {/* CTA Card */}
                    <div className="bg-surface-light border border-border-light rounded-xl p-6 mb-10">
                        <h2 className="text-xl font-semibold text-white mb-3">
                            {t.countries.emptyState.ctaTitle}
                        </h2>
                        <Link
                            href="/places/create"
                            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-medium px-6 py-3 rounded-lg transition-colors no-underline shadow-sm hover:shadow"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            {t.countries.emptyState.ctaButton}
                        </Link>
                    </div>

                    {hasSuggestions && (
                        <div className="border-t border-border-light pt-8">
                            <p className="text-text-light font-medium mb-6">{t.countries.emptyState.exploreSuggestions}</p>

                            {availableCities && availableCities.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-lg font-semibold mb-4 text-white">{t.merchants.suggestions.otherCities.replace("{country}", countryLabel)}</h3>
                                    <ul className="flex flex-wrap gap-2">
                                        {availableCities.map((cityData) => {
                                            const slugKey = getLocalizedCitySlug(countryLabel, cityData.name, locale)
                                            return (
                                                slugKey && (
                                                    <li key={cityData.name} className="list-none">
                                                        <Link
                                                            href={`/${slugKey}`}
                                                            className="inline-block bg-surface-light hover:bg-surface-light/80 py-1.5 px-3 rounded-lg no-underline text-sm text-text-light hover:text-white transition-colors border border-border-light"
                                                        >
                                                            {cityData.name} ({cityData.count})
                                                        </Link>
                                                    </li>
                                                )
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}

                            {enrichedSubcategories && enrichedSubcategories.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-4 text-white">
                                        {location
                                            ? t.merchants.suggestions.categoriesIn.replace("{location}", countryLabel)
                                            : t.merchants.suggestions.otherCategories.replace("{location}", countryLabel)
                                        }
                                    </h3>
                                    <ul className="flex flex-wrap gap-2">
                                        {enrichedSubcategories.map(({slugKey, category, subcategory}) =>
                                            (
                                                <CategoryChip as={"li"} category={category ?? 'other'} key={slugKey}>
                                                    <Link href={`/${slugKey}`}>{subcategory ?? t.map["venue-tooltip"]?.defaultCategory}</Link>
                                                </CategoryChip>
                                            )
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
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
                <p>{translatedDescription}</p>
                <h2>{t.countries.seo.aboutBitcoin.replace('{location}', locationName)}</h2>
                <p>
                    {subcategoryLabel
                        ? t.countries.seo.findPlaces.replace('{count}', venueCount).replace('{category}', subcategoryLabel.toLowerCase()).replace('{location}', locationName)
                        : t.countries.seo.discoverPlaces.replace('{count}', venueCount).replace('{location}', locationName)}
                    {' '}{t.countries.seo.browseVerified}
                </p>
                <h2>{t.countries.seo.paymentLocationsTitle}</h2>
                <p>{t.countries.seo.paymentLocationsDescription}</p>
                {subcategoryLabel && (
                    <>
                        <h2>{t.countries.seo.categoryAcceptingTitle.replace('{category}', subcategoryLabel)}</h2>
                        <p>{t.countries.seo.categoryAcceptingDescription.replace('{category}', subcategoryLabel.toLowerCase()).replace('{location}', locationName)}</p>
                    </>
                )}
                <h2>{t.countries.seo.supportAdoptionTitle}</h2>
                <p>{t.countries.seo.supportAdoptionDescription.replace('{location}', locationName)}</p>
            </div>
            <PlacesDirectoryWrapper country={countryLabel} places={venues} city={location} categoryAndSubcategory={categoryAndSubcategory} availableCities={availableCities} availableSubcategories={availableCategories} exactMatch={data.exactMatch} />
        </>
    );
}

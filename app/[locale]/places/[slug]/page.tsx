import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { generateCanonical } from "@/i18n/seo";
import Script from "next/script";

import {env} from "@/lib/Environment";
import PlacePageWrapper from "./PlacePageWrapper";
import {Locale, Localized} from "@/i18n/types";
import {getPageSeo} from "@/utils/SEOUtils";
import {EnrichedVenue} from "@/models/Overpass";
import {parseTags} from "@/utils/OsmHelpers";
import {PAYMENT_METHODS} from "@/constants/PaymentMethods";
import {getFormattedAddress} from "@/utils/AddressUtils";
import {getLocalizedCountryName} from "@/utils/CountryUtils";
import {getSubcategoryLabel, matchPlaceSubcategory} from "@/constants/PlaceCategories";

async function getVenueBySlug(slug: string, preview = false): Promise<EnrichedVenue | null> {
    const base = env.siteUrl || "http://localhost:3000";
    const url = `${base}/api/places/${slug}${preview ? '?preview=true' : ''}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
}

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<Record<string, string>>
}

export async function generateMetadata({ params }: PageProps & Localized): Promise<Metadata> {
    const { slug, locale } = await params;
    const venue = await getVenueBySlug(slug);
    if (!venue) return { title: "Place Not Found" };

    const { metadata: baseMetadata } = await getPageSeo("place")({ params });
    const { paymentMethods, name } = parseTags(venue.tags);
    const formattedAddress = getFormattedAddress(locale, venue);

    const city = venue.city || "your area";
    const countryLabel = getLocalizedCountryName(locale, venue.country) || "";
    const match = venue.subcategory ? matchPlaceSubcategory(venue.subcategory) : null;
    const subcategory = match ? getSubcategoryLabel(locale, match.category, match.subcategory) ?? '' : venue.subcategory ?? '';
    const nameSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

    // Payment method labels
    const paymentLabels = Object.entries(paymentMethods)
        .filter(([, enabled]) => enabled === "yes")
        .map(([type]) => PAYMENT_METHODS[type]?.label.replace(' Accepted', '') || type);

    const paymentSentence = paymentLabels.length
        ? `Accepts payments via ${paymentLabels.join(", ")}.`
        : "";

    const addressSentence = formattedAddress
        ? ` Address: ${formattedAddress}.`
        : "";

    const fullDescription = baseMetadata.description
            ?.replace("{{name}}", name)
            ?.replace("{{city}}", city)
        + " "
        + paymentSentence
        + addressSentence;

    const keywords = [
        `${nameSlug}`,
        `bitcoin ${nameSlug}`,
        `bitcoin ${nameSlug} ${countryLabel}`,
        `bitcoin ${subcategory.toLowerCase()} ${countryLabel}`
    ];

    const titleSuffix = baseMetadata.title;

    const finalTitle= String(titleSuffix).replaceAll('{{name}}', name).replaceAll('{{city}}', city)
    // Destructure images out so file-based opengraph-image.tsx is used
    const { images: _ogImages, ...ogRest } = baseMetadata.openGraph || {};
    const { images: _twImages, ...twRest } = baseMetadata.twitter || {};

    return {
        title: finalTitle,
        description: fullDescription,
        keywords,
        openGraph: {
            ...ogRest,
            title: finalTitle,
            description: fullDescription,
            url: generateCanonical(`places/${venue.slug || slug}`, locale),
        },
        twitter: {
            ...twRest,
            title: finalTitle,
            description: fullDescription,
        }
    } as Metadata;
}

// Map subcategories to schema.org types
const subcategorySchemaTypeMap: Record<string, string> = {
    "pizza": "Restaurant",
    "restaurant": "Restaurant",
    "cafe": "CafeOrCoffeeShop",
    "fast_food": "FastFoodRestaurant",
    "hotel": "Hotel",
    "hostel": "Hostel",
    "bar": "BarOrPub",
    "pub": "BarOrPub",
    "bakery": "Bakery",
    "coworking_space": "LocalBusiness",
    "atm": "AutomatedTeller",
    "supermarket": "GroceryStore",
    "convenience": "ConvenienceStore",
    "pharmacy": "Pharmacy",
    "dentist": "Dentist",
    "doctor": "Physician",
    "hospital": "Hospital",
    "gym": "HealthClub",
    "hairdresser": "HairSalon",
    "beauty": "BeautySalon",
    "car_repair": "AutoRepair",
    "car_wash": "AutoWash",
    "fuel": "GasStation",
    "bank": "BankOrCreditUnion",
    "lawyer": "Attorney",
    "accountant": "AccountingService",
    "real_estate": "RealEstateAgent",
    "travel_agency": "TravelAgency",
};

function buildLocalBusinessSchema(venue: EnrichedVenue, locale: Locale) {
    const { name, address, paymentMethods } = parseTags(venue.tags);
    const subcategory = venue.subcategory || venue.tags?.subcategory;
    const schemaType = subcategorySchemaTypeMap[subcategory as string] || "LocalBusiness";

    const canonical = generateCanonical(`places/${venue.slug}`, locale);

    // Build payment methods array
    const acceptedPayments: string[] = [];
    if (paymentMethods["payment:bitcoin"] === "yes") acceptedPayments.push("Bitcoin");
    if (paymentMethods["payment:lightning"] === "yes") acceptedPayments.push("Lightning Network");
    if (paymentMethods["payment:onchain"] === "yes") acceptedPayments.push("Bitcoin (on-chain)");
    if (paymentMethods["payment:lightning_contactless"] === "yes") acceptedPayments.push("Lightning NFC");

    const schema: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": schemaType,
        "@id": canonical,
        "name": name,
        "url": canonical,
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": venue.lat,
            "longitude": venue.lon
        },
    };

    // Add address if available
    if (address?.street || venue.formattedAddress) {
        schema.address = {
            "@type": "PostalAddress",
            ...(address?.street && { "streetAddress": `${address.housenumber || ""} ${address.street}`.trim() }),
            ...(address?.city || venue.city) && { "addressLocality": address?.city || venue.city },
            ...(address?.state || venue.state) && { "addressRegion": address?.state || venue.state },
            ...(address?.postcode && { "postalCode": address.postcode }),
            ...(address?.country || venue.country) && { "addressCountry": address?.country || venue.country },
        };
    }

    // Add payment methods
    if (acceptedPayments.length > 0) {
        schema.paymentAccepted = acceptedPayments;
    }

    // Add image if available
    if (venue.tags?.image) {
        schema.image = venue.tags.image;
    }

    // Add phone if available
    if (venue.tags?.phone || venue.tags?.["contact:phone"]) {
        schema.telephone = venue.tags.phone || venue.tags["contact:phone"];
    }

    // Add website if available
    if (venue.tags?.website || venue.tags?.["contact:website"]) {
        schema.sameAs = venue.tags.website || venue.tags["contact:website"];
    }

    // Add email if available
    if (venue.tags?.email || venue.tags?.["contact:email"]) {
        schema.email = venue.tags.email || venue.tags["contact:email"];
    }

    // Add opening hours if available
    if (venue.tags?.opening_hours) {
        schema.openingHours = venue.tags.opening_hours;
    }

    // Add cuisine for restaurants
    if (venue.tags?.cuisine) {
        schema.servesCuisine = venue.tags.cuisine.split(";").map(c => c.trim());
    }

    // Add amenity features
    const amenityFeatures: Record<string, unknown>[] = [];
    if (venue.tags?.internet_access && venue.tags.internet_access !== "no") {
        amenityFeatures.push({
            "@type": "LocationFeatureSpecification",
            "name": "WiFi",
            "value": true
        });
    }
    if (venue.tags?.wheelchair === "yes") {
        amenityFeatures.push({
            "@type": "LocationFeatureSpecification",
            "name": "Wheelchair accessible",
            "value": true
        });
    }
    if (venue.tags?.outdoor_seating === "yes") {
        amenityFeatures.push({
            "@type": "LocationFeatureSpecification",
            "name": "Outdoor seating",
            "value": true
        });
    }
    if (amenityFeatures.length > 0) {
        schema.amenityFeature = amenityFeatures;
    }

    return schema;
}

function buildBreadcrumbSchema(venue: EnrichedVenue, locale: Locale) {
    const { name } = parseTags(venue.tags);
    const countryLabel = getLocalizedCountryName(locale, venue.country) || venue.country;

    const items = [
        {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": env.siteUrl
        },
        {
            "@type": "ListItem",
            "position": 2,
            "name": countryLabel,
            "item": `${env.siteUrl}/bitcoin-shops-in-${venue.country.toLowerCase().replace(/\s+/g, '-')}`
        },
    ];

    if (venue.city) {
        items.push({
            "@type": "ListItem",
            "position": 3,
            "name": venue.city,
            "item": `${env.siteUrl}/bitcoin-shops-in-${venue.city.toLowerCase().replace(/\s+/g, '-')}-${venue.country.toLowerCase().replace(/\s+/g, '-')}`
        });
    }

    items.push({
        "@type": "ListItem",
        "position": items.length + 1,
        "name": name,
        "item": generateCanonical(`places/${venue.slug}`, locale)
    });

    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items
    };
}

export default async function PlaceServerPage({ params, searchParams }: PageProps & Localized) {
    const { slug, locale } = await params;
    const awaitedSearchParams = await searchParams;
    const isPreview = awaitedSearchParams?.preview === 'true'

    const venue = await getVenueBySlug(slug, isPreview);

    if (!venue) return notFound();

    const localBusinessSchema = buildLocalBusinessSchema(venue, locale);
    const breadcrumbSchema = buildBreadcrumbSchema(venue, locale);

    return (
        <>
            <Script
                id="local-business-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
            />
            <Script
                id="breadcrumb-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <PlacePageWrapper venue={venue} isPreview={isPreview} />
        </>
    );
}

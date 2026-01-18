import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { generateCanonical } from "@/i18n/seo";

import {env} from "@/lib/Environment";
import PlacePageWrapper from "./PlacePageWrapper";
import {Localized} from "@/i18n/types";
import {getPageSeo} from "@/utils/SEOUtils";
import {EnrichedVenue} from "@/models/Overpass";
import {parseTags} from "@/utils/OsmHelpers";
import {PAYMENT_METHODS} from "@/constants/PaymentMethods";
import {getFormattedAddress} from "@/utils/AddressUtils";
import {getLocalizedCountryName} from "@/utils/CountryUtils";
import {getSubcategoryLabel, matchPlaceSubcategory} from "@/constants/PlaceCategories";

async function getVenueById(id: number, preview = false): Promise<EnrichedVenue | null> {
    const base = env.siteUrl || "http://localhost:3000";
    const url = `${base}/api/places/${id}${preview ? '?preview=true' : ''}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
}

interface PageProps {
    params: Promise<{ id: number }>;
    searchParams?: Promise<Record<string, string>>
}

export async function generateMetadata({ params }: PageProps & Localized): Promise<Metadata> {
    const { id, locale } = await params;
    const venue = await getVenueById(id);
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
    return {
        title: finalTitle,
        description: fullDescription,
        keywords,
        openGraph: {
            ...baseMetadata.openGraph,
            title: finalTitle,
            description: fullDescription,
            url: generateCanonical(`places/${id}`, locale),
            images: [
                ...(venue.tags.image ? [{
                    url: venue.tags.image,
                    width: 1200,
                    height: 630,
                    alt: `${name} @ MappingBitcoin.com`
                }] : []),
                {
                    url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                    width: 1200,
                    height: 630,
                    alt: `${name} @ MappingBitcoin.com`
                }
            ]
        },
        twitter: {
            ...baseMetadata.twitter,
            title: finalTitle,
            description: fullDescription,
            images: [
                ...(venue.tags.image ? [venue.tags.image] : []),
                `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`
            ]
        }
    } as Metadata;
}

export default async function PlaceServerPage({ params, searchParams }: PageProps & Localized) {
    const { id } = await params;
    const awaitedSearchParams = await searchParams;
    const isPreview = awaitedSearchParams?.preview === 'true'

    const venue = await getVenueById(id, isPreview);

    if (!venue) return notFound();

    return (
        <PlacePageWrapper venue={venue} isPreview={isPreview} />
    );
}

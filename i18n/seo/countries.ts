import { env } from "@/lib/Environment";
import { generateCanonical } from "./utils";
import type { SEOModule } from "./types";

export type CountriesPageKey = 'countries' | 'countries-pages';

const countriesSeo: SEOModule<CountriesPageKey> = {
    countries: {
        en: {
            title: "Bitcoin Places by Country | MappingBitcoin.com",
            description: "Explore cafes, shops, ATMs, and other places around the world where Bitcoin is accepted. Browse by continent and country to see where it's used most.",
            keywords: [
                "bitcoin friendly countries",
                "where is bitcoin accepted",
                "bitcoin usage by country",
                "countries that accept bitcoin",
                "bitcoin adoption map",
                "bitcoin places by country",
                "bitcoin places worldwide"
            ],
            openGraph: {
                title: "Bitcoin Places by Country | MappingBitcoin.com",
                description: "Find trusted places that accept Bitcoin — cafes, restaurants, and ATMs — organized by continent and country.",
                url: generateCanonical("countries", "en"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Bitcoin Places by Country | MappingBitcoin.com"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Bitcoin Places by Country | MappingBitcoin.com",
                description: "Explore Bitcoin-accepting locations around the world — sorted by continent and country.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
    },
    'countries-pages': {
        en: {
            title: "– MappingBitcoin.com",
            description: "Explore trusted locations around the world where Bitcoin is accepted. Cafes, restaurants, ATMs and more.",
            keywords: [
                "bitcoin places",
                "accepts bitcoin",
                "bitcoin cafes",
                "bitcoin map",
                "bitcoin friendly places",
                "lightning network locations"
            ],
            openGraph: {
                title: "– MappingBitcoin.com",
                description: "Find businesses that accept Bitcoin. Discover new locations globally.",
                url: generateCanonical("countries", "en"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "- MappingBitcoin.com"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "– MappingBitcoin.com",
                description: "Explore Bitcoin-accepting locations near you and around the world.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            },
        },
    },
};

export default countriesSeo;

import { env } from "@/lib/Environment";
import { generateCanonical } from "./utils";
import type { SEOModule } from "./types";

export type PlacesPageKey = 'place' | 'submit-place' | 'merchant-pages';

const placesSeo: SEOModule<PlacesPageKey> = {
    place: {
        en: {
            title: "{{name}} in {{city}} | MappingBitcoin.com",
            description: "Discover {{name}}, a place in {{city}} where you can use Bitcoin.",
            keywords: [],
            openGraph: {
                title: "{{name}} in {{city}} | MappingBitcoin.com",
                description: "Discover {{name}}, a place in {{city}} where you can use Bitcoin.",
                url: generateCanonical("places", "en"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Bitcoin Place | MappingBitcoin.com"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "{{name}} in {{city}} | MappingBitcoin.com",
                description: "Discover {{name}}, a place in {{city}} where you can use Bitcoin.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
    },
    'submit-place': {
        en: {
            title: "Submit a Bitcoin-Friendly Place | MappingBitcoin.com",
            description: "Share Bitcoin-friendly businesses with the community. Submit accurate place details so others can spend Bitcoin nearby.",
            keywords: [
                "submit bitcoin place",
                "add bitcoin business",
                "share bitcoin merchant",
                "bitcoin-friendly location",
                "bitcoin community map"
            ],
            openGraph: {
                title: "Submit a Bitcoin-Friendly Place | MappingBitcoin.com",
                description: "Share Bitcoin-friendly businesses with the community.",
                url: generateCanonical("places/create", "en"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Submit a Bitcoin Place | MappingBitcoin.com"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Submit a Bitcoin-Friendly Place | MappingBitcoin.com",
                description: "Help others find places to spend Bitcoin by submitting a trusted place.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
    },
    'merchant-pages': {
        en: {
            title: "Bitcoin {{category}} in {{location}} | MappingBitcoin.com",
            description: "Find Bitcoin-friendly {{category}} in {{location}}. Browse verified merchants accepting Bitcoin payments.",
            keywords: [
                "bitcoin merchants",
                "bitcoin-friendly businesses",
                "spend bitcoin",
                "bitcoin payments",
                "bitcoin directory"
            ],
            openGraph: {
                title: "Bitcoin {{category}} in {{location}} | MappingBitcoin.com",
                description: "Find Bitcoin-friendly {{category}} in {{location}}. Browse verified merchants accepting Bitcoin payments.",
                url: generateCanonical("", "en"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Bitcoin Merchants | MappingBitcoin.com"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Bitcoin {{category}} in {{location}} | MappingBitcoin.com",
                description: "Find Bitcoin-friendly {{category}} in {{location}}.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
    },
};

export default placesSeo;

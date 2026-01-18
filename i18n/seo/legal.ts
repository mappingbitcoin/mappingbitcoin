import { env } from "@/lib/Environment";
import { generateCanonical } from "./utils";
import type { SEOModule } from "./types";

export type LegalPageKey = 'privacy-policy' | 'terms-and-conditions';

const legalSeo: SEOModule<LegalPageKey> = {
    "privacy-policy": {
        en: {
            title: "Privacy Policy | MappingBitcoin.com",
            description: "Learn how MappingBitcoin.com handles data. We use minimal cookies, anonymous stats, and public OpenStreetMap sources.",
            keywords: [
                "bitcoin privacy",
                "privacy policy",
                "data handling",
                "cookie usage",
                "openstreetmap data",
                "mappingbitcoin privacy"
            ],
            openGraph: {
                title: "Privacy Policy | MappingBitcoin.com",
                description: "We use limited cookies, anonymous analytics, and community data from public sources like OpenStreetMap.",
                url: generateCanonical("privacy-policy", "en"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Privacy Policy | MappingBitcoin.com"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Privacy Policy | MappingBitcoin.com",
                description: "MappingBitcoin.com explains how data is handled: minimal cookies, IP geolocation, and public sources.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
    },
    "terms-and-conditions": {
        en: {
            title: "Terms and Conditions | MappingBitcoin.com",
            description: "Read the terms and conditions for using MappingBitcoin.com. Understand your rights and responsibilities when using our Bitcoin resources and tools.",
            keywords: [
                "terms and conditions",
                "bitcoin terms of service",
                "mappingbitcoin terms",
                "user agreement",
                "bitcoin platform rules"
            ],
            openGraph: {
                title: "Terms and Conditions | MappingBitcoin.com",
                description: "Terms of service for using MappingBitcoin.com's Bitcoin resources, maps, and educational content.",
                url: generateCanonical("terms-and-conditions", "en"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Terms and Conditions | MappingBitcoin.com"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Terms and Conditions | MappingBitcoin.com",
                description: "Terms of service for using MappingBitcoin.com's Bitcoin resources, maps, and educational content.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
    },
};

export default legalSeo;

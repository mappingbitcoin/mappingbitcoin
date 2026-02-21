import { env } from "@/lib/Environment";
import type { SEOModule } from "./types";

export type CategoriesPageKey = 'categories' | 'subcategory';

const categoriesSeo: SEOModule<CategoriesPageKey> = {
    categories: {
        en: {
            title: "Bitcoin Business Categories | Mapping Bitcoin",
            description: "Browse all categories of businesses that accept Bitcoin payments. Find restaurants, cafes, hotels, shops, and services accepting Bitcoin and Lightning.",
            keywords: [
                "bitcoin categories",
                "bitcoin business types",
                "bitcoin merchants",
                "bitcoin restaurants",
                "bitcoin cafes",
                "bitcoin hotels",
                "bitcoin shops",
                "bitcoin services",
                "lightning payments",
                "bitcoin directory"
            ],
            openGraph: {
                title: "Bitcoin Business Categories | Mapping Bitcoin",
                description: "Browse all categories of businesses that accept Bitcoin payments. Find restaurants, cafes, hotels, shops, and services accepting Bitcoin and Lightning.",
                url: `${env.siteUrl}/categories`,
                type: "website",
                siteName: "Mapping Bitcoin",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Bitcoin Business Categories - Mapping Bitcoin",
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "Bitcoin Business Categories | Mapping Bitcoin",
                description: "Browse all categories of businesses that accept Bitcoin payments. Find restaurants, cafes, hotels, shops, and services accepting Bitcoin and Lightning.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            }
        },
    },
    subcategory: {
        en: {
            title: "{{category}} Accepting Bitcoin | Mapping Bitcoin",
            description: "Find {{category}} that accept Bitcoin in {{countries}} countries. Browse {{count}} verified places on our Bitcoin map.",
            keywords: [
                "bitcoin {{category}}",
                "{{category}} accept bitcoin",
                "{{category}} bitcoin payment",
                "{{category}} lightning network",
                "bitcoin merchants",
                "spend bitcoin {{category}}"
            ],
            openGraph: {
                title: "{{category}} Accepting Bitcoin | Mapping Bitcoin",
                description: "Find {{category}} that accept Bitcoin in {{countries}} countries. Browse {{count}} verified places on our Bitcoin map.",
                url: `${env.siteUrl}/categories/{{subcategory}}`,
                type: "website",
                siteName: "Mapping Bitcoin",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "{{category}} Accepting Bitcoin - Mapping Bitcoin",
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "{{category}} Accepting Bitcoin | Mapping Bitcoin",
                description: "Find {{category}} that accept Bitcoin in {{countries}} countries. Browse {{count}} verified places on our Bitcoin map.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            }
        },
    },
};

export default categoriesSeo;

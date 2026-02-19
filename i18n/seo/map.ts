import { env } from "@/lib/Environment";
import { generateCanonical } from "./utils";
import type { SEOModule } from "./types";

export type MapPageKey = 'map';

const mapSeo: SEOModule<MapPageKey> = {
    map: {
        en: {
            title: "Interactive Bitcoin Map | Mapping Bitcoin",
            description: "Find Bitcoin-accepting places worldwide. Cafés, restaurants, shops, ATMs, and more. Search by location, filter by category, discover where to spend Bitcoin.",
            keywords: [
                "bitcoin map",
                "interactive bitcoin map",
                "bitcoin merchants map",
                "bitcoin locations",
                "bitcoin ATMs",
                "spend bitcoin",
                "bitcoin near me",
                "lightning network map"
            ],
            openGraph: {
                title: "Interactive Bitcoin Map | Mapping Bitcoin",
                description: "Find Bitcoin-accepting places worldwide. Cafés, restaurants, shops, ATMs, and more. Discover where to spend Bitcoin.",
                url: generateCanonical('map', 'en'),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Interactive Bitcoin Map - Mapping Bitcoin",
                    }
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "Interactive Bitcoin Map | Mapping Bitcoin",
                description: "Find Bitcoin-accepting places worldwide. Cafés, restaurants, shops, ATMs, and more. Discover where to spend Bitcoin.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            }
        },
    },
};

export default mapSeo;

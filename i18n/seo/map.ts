import { env } from "@/lib/Environment";
import { generateCanonical } from "./utils";
import type { SEOModule } from "./types";

export type MapPageKey = 'map';

const mapSeo: SEOModule<MapPageKey> = {
    map: {
        en: {
            title: "Bitcoin Map | MappingBitcoin.com",
            description: "Find cafés, shops, ATMs, and venues that accept Bitcoin — near you or around the world.",
            keywords: [
                "bitcoin map",
                "open source bitcoin map",
                "bitcoin locations",
                "bitcoin ATMs",
                "bitcoin merchants map"
            ],
            openGraph: {
                title: "Bitcoin Map | MappingBitcoin.com",
                description: "Find cafés, shops, ATMs, and venues that accept Bitcoin — near you or around the world.",
                url: generateCanonical('map', 'en'),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Bitcoin Map | MappingBitcoin.com",
                    }
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "Bitcoin Map | MappingBitcoin.com",
                description: "Find cafés, shops, ATMs, and venues that accept Bitcoin — near you or around the world.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            }
        },
    },
};

export default mapSeo;

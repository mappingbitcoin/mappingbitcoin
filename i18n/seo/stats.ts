import { env } from "@/lib/Environment";
import type { SEOModule } from "./types";

export type StatsPageKey = 'stats';

const statsSeo: SEOModule<StatsPageKey> = {
    stats: {
        en: {
            title: "Bitcoin Merchant Statistics | Mapping Bitcoin",
            description: "Explore global Bitcoin adoption statistics. See the growth of Bitcoin-accepting merchants, top countries, categories, and verification trends.",
            keywords: [
                "bitcoin statistics",
                "bitcoin adoption stats",
                "bitcoin merchants growth",
                "bitcoin acceptance trends",
                "bitcoin payment statistics",
                "lightning network adoption",
                "bitcoin business analytics"
            ],
            openGraph: {
                title: "Bitcoin Merchant Statistics | Mapping Bitcoin",
                description: "Explore global Bitcoin adoption statistics. See the growth of Bitcoin-accepting merchants, top countries, categories, and verification trends.",
                url: `${env.siteUrl}/stats`,
                type: "website",
                siteName: "Mapping Bitcoin",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Bitcoin Merchant Statistics - Mapping Bitcoin",
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "Bitcoin Merchant Statistics | Mapping Bitcoin",
                description: "Explore global Bitcoin adoption statistics. See the growth of Bitcoin-accepting merchants, top countries, categories, and verification trends.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            }
        },
    },
};

export default statsSeo;

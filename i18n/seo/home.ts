import { env } from "@/lib/Environment";
import type { SEOModule } from "./types";

export type HomePageKey = 'home';

const homeSeo: SEOModule<HomePageKey> = {
    home: {
        en: {
            title: "The Bitcoin Economy, Mapped | MappingBitcoin.com",
            description: "Find where Bitcoin works. Explore 21,000+ venues across 150 countries. Open-source, community-driven directory of Bitcoin-accepting places worldwide.",
            keywords: [
                "bitcoin map",
                "bitcoin merchants",
                "bitcoin directory",
                "where to spend bitcoin",
                "bitcoin locations",
                "bitcoin venues",
                "bitcoin economy",
                "bitcoin adoption",
                "bitcoin businesses",
                "bitcoin worldwide"
            ],
            openGraph: {
                title: "The Bitcoin Economy, Mapped | MappingBitcoin.com",
                description: "Find where Bitcoin works. Explore 21,000+ venues across 150 countries. Open-source, community-driven directory of Bitcoin-accepting places worldwide.",
                url: env.siteUrl,
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "The Bitcoin Economy, Mapped - MappingBitcoin.com",
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "The Bitcoin Economy, Mapped | MappingBitcoin.com",
                description: "Find where Bitcoin works. Explore 21,000+ venues across 150 countries. Open-source directory of Bitcoin-accepting places.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            }
        },
    },
};

export default homeSeo;

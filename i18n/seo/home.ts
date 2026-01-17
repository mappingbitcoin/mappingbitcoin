import { env } from "@/lib/Environment";
import type { SEOModule } from "./types";

export type HomePageKey = 'home';

const homeSeo: SEOModule<HomePageKey> = {
    home: {
        en: {
            title: "Bitcoin, Built for People | MappingBitcoin.com",
            description: "Discover where to use Bitcoin. Explore tools and guides to learn by doing — practical and made for everyday use.",
            keywords: [
                "MappingBitcoin",
                "mapping bitcoin",
                "Bitcoin project",
                "learn Bitcoin",
                "explore Bitcoin",
                "how to use Bitcoin",
                "start using Bitcoin",
                "understand Bitcoin",
                "Bitcoin resources",
                "Bitcoin for beginners"
            ],
            openGraph: {
                title: "Bitcoin, Built for People | MappingBitcoin.com",
                description: "Discover where to use Bitcoin. Explore tools and guides to learn by doing — practical and made for everyday use.",
                url: env.siteUrl,
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/wab-home.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Explore Bitcoin with MappingBitcoin.com",
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "Bitcoin, Built for People | MappingBitcoin.com",
                description: "Discover where to use Bitcoin. Explore tools and guides to learn by doing — practical and made for everyday use.",
                images: [`${env.siteUrl}/assets/opengraph/wab-home.webp`],
            }
        },
    },
};

export default homeSeo;

import { env } from "@/lib/Environment";
import { generateCanonical } from "./utils";
import type { SEOModule } from "./types";

export type CounterPageKey = 'counter';

const counterSeo: SEOModule<CounterPageKey> = {
    counter: {
        en: {
            title: "Bitcoin Venues Counter | MappingBitcoin.com",
            description: "Check the total number of Bitcoin-accepting venues indexed on MappingBitcoin.com. See how the Bitcoin ecosystem is growing worldwide.",
            keywords: [
                "bitcoin venues counter",
                "bitcoin merchants count",
                "bitcoin adoption statistics",
                "bitcoin friendly businesses",
                "bitcoin map statistics",
                "bitcoin venues database"
            ],
            openGraph: {
                title: "Bitcoin Venues Counter | MappingBitcoin.com",
                description: "Discover the total number of places worldwide that accept Bitcoin. Track the growth of Bitcoin adoption.",
                url: generateCanonical("counter", "en"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Bitcoin Venues Counter | MappingBitcoin.com"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Bitcoin Venues Counter | MappingBitcoin.com",
                description: "See how many businesses around the world accept Bitcoin. Real-time counter from MappingBitcoin.com.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
    },
};

export default counterSeo;

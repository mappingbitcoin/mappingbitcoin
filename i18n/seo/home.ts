import { env } from "@/lib/Environment";
import type { SEOModule } from "./types";

export type HomePageKey = 'home';

const homeSeo: SEOModule<HomePageKey> = {
    home: {
        en: {
            title: "Global Bitcoin Map | Mapping Bitcoin",
            description: "Find every place, organization, and community in the Bitcoin ecosystem. Open-source, community-driven map of merchants accepting Bitcoin and Lightning payments.",
            keywords: [
                "bitcoin map",
                "bitcoin merchants",
                "bitcoin directory",
                "where to spend bitcoin",
                "bitcoin locations",
                "spend bitcoin",
                "bitcoin economy",
                "bitcoin adoption",
                "lightning network",
                "bitcoin payments"
            ],
            openGraph: {
                title: "Global Bitcoin Map | Mapping Bitcoin",
                description: "Find every place, organization, and community in the Bitcoin ecosystem. Open-source, community-driven map of merchants accepting Bitcoin and Lightning payments.",
                url: env.siteUrl,
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Global Bitcoin Map - Mapping Bitcoin",
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "Global Bitcoin Map | Mapping Bitcoin",
                description: "Find every place, organization, and community in the Bitcoin ecosystem. Open-source, community-driven map of merchants accepting Bitcoin and Lightning payments.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            }
        },
    },
};

export default homeSeo;

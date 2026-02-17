import { env } from "@/lib/Environment";
import { generateCanonical } from "./utils";
import type { SEOModule } from "./types";

export type DocsPageKey = 'docs';

const docsSeo: SEOModule<DocsPageKey> = {
    "docs": {
        en: {
            title: "Documentation | Mapping Bitcoin",
            description: "Learn how Mapping Bitcoin works: OSM synchronization, data enrichment, venue creation, Blossom image uploading, and place verification system.",
            keywords: [
                "bitcoin documentation",
                "bitcoin merchant directory docs",
                "openstreetmap bitcoin",
                "osm sync",
                "blossom protocol",
                "place verification",
                "bitcoin venue creation",
                "mapping bitcoin guide"
            ],
            openGraph: {
                title: "Documentation | Mapping Bitcoin",
                description: "Complete guide to Mapping Bitcoin: OSM sync, data enrichment, venue submission, image hosting, and verification systems.",
                url: generateCanonical("docs", "en"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Documentation | Mapping Bitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Documentation | Mapping Bitcoin",
                description: "Learn how Mapping Bitcoin works: OSM sync, data enrichment, venue creation, and place verification.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
    },
};

export default docsSeo;

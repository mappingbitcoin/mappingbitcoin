import { env } from "@/lib/Environment";
import { generateCanonical } from "./utils";
import type { SEOModule } from "./types";

export type BlogPageKey = 'blog';

const blogSeo: SEOModule<BlogPageKey> = {
    "blog": {
        en: {
            title: "Blog | Mapping Bitcoin",
            description: "Updates, insights, and announcements from the MappingBitcoin team. Learn about our mission to build better Bitcoin merchant discovery.",
            keywords: [
                "bitcoin blog",
                "bitcoin merchants",
                "nostr",
                "web of trust",
                "bitcoin adoption",
                "mapping bitcoin",
                "bitcoin directory",
                "bitcoin news"
            ],
            openGraph: {
                title: "Blog | Mapping Bitcoin",
                description: "Updates, insights, and announcements from the MappingBitcoin team.",
                url: generateCanonical("blog", "en"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "MappingBitcoin Blog"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Blog | Mapping Bitcoin",
                description: "Updates, insights, and announcements from the MappingBitcoin team.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
    },
};

export default blogSeo;

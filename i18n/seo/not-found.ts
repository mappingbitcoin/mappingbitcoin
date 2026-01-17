import { env } from "@/lib/Environment";
import type { SEOModule } from "./types";

export type NotFoundPageKey = 'not-found';

const notFoundSeo: SEOModule<NotFoundPageKey> = {
    'not-found': {
        en: {
            title: "Page Not Found | MappingBitcoin.com",
            description: "This page doesn't exist, but you can still explore Bitcoin tools, guides, and places where it's accepted.",
            openGraph: {
                title: "Page Not Found | MappingBitcoin.com",
                description: "This page doesn't exist, but you can still explore Bitcoin tools, guides, and places where it's accepted.",
                url: env.siteUrl,
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/wab-home.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Page Not Found | MappingBitcoin.com",
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "Page Not Found | MappingBitcoin.com",
                description: "This page doesn't exist, but you can still explore Bitcoin tools, guides, and places where it's accepted.",
                images: [`${env.siteUrl}/assets/opengraph/wab-home.webp`],
            },
        },
    },
};

export default notFoundSeo;

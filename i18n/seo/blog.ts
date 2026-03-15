import { env } from "@/lib/Environment";
import { generateCanonical } from "./utils";
import type { SEOModule } from "./types";

export type BlogPageKey = 'blog';

const blogSeo: SEOModule<BlogPageKey> = {
    "blog": {
        en: {
            title: "Bitcoin Merchant News & Guides | Mapping Bitcoin",
            description: "Updates, insights, and announcements from the MappingBitcoin team. Learn about our mission to build better Bitcoin merchant discovery.",
            keywords: [
                "mapping bitcoin blog",
                "bitcoin adoption"
            ],
            openGraph: {
                title: "Bitcoin Merchant News & Guides | Mapping Bitcoin",
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
                title: "Bitcoin Merchant News & Guides | Mapping Bitcoin",
                description: "Updates, insights, and announcements from the MappingBitcoin team.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
        es: {
            title: "Noticias y Guias sobre Comercios Bitcoin | Mapping Bitcoin",
            description: "Actualizaciones, analisis y novedades del equipo de MappingBitcoin. Conoce nuestra mision de mejorar el descubrimiento de comercios Bitcoin.",
            keywords: [
                "blog bitcoin",
                "adopcion bitcoin"
            ],
            openGraph: {
                title: "Noticias y Guias sobre Comercios Bitcoin | Mapping Bitcoin",
                description: "Actualizaciones, analisis y novedades del equipo de MappingBitcoin.",
                url: generateCanonical("blog", "es"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Blog de MappingBitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Noticias y Guias sobre Comercios Bitcoin | Mapping Bitcoin",
                description: "Actualizaciones, analisis y novedades del equipo de MappingBitcoin.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
        pt: {
            title: "Noticias e Guias sobre Comercios Bitcoin | Mapping Bitcoin",
            description: "Atualizacoes, analises e novidades da equipe do MappingBitcoin. Conheca nossa missao de melhorar a descoberta de comercios Bitcoin.",
            keywords: [
                "blog bitcoin",
                "adocao bitcoin"
            ],
            openGraph: {
                title: "Noticias e Guias sobre Comercios Bitcoin | Mapping Bitcoin",
                description: "Atualizacoes, analises e novidades da equipe do MappingBitcoin.",
                url: generateCanonical("blog", "pt"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Blog do MappingBitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Noticias e Guias sobre Comercios Bitcoin | Mapping Bitcoin",
                description: "Atualizacoes, analises e novidades da equipe do MappingBitcoin.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
    },
};

export default blogSeo;

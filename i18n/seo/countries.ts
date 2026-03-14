import { env } from "@/lib/Environment";
import { generateCanonical } from "./utils";
import type { SEOModule } from "./types";

export type CountriesPageKey = 'countries' | 'countries-pages';

const countriesSeo: SEOModule<CountriesPageKey> = {
    countries: {
        en: {
            title: "Bitcoin Places by Country | Mapping Bitcoin",
            description: "Explore cafes, shops, ATMs, and other places around the world where Bitcoin is accepted. Browse by continent and country to see where it's used most.",
            keywords: [
                "bitcoin by country",
                "bitcoin adoption map"
            ],
            openGraph: {
                title: "Bitcoin Places by Country | Mapping Bitcoin",
                description: "Find trusted places that accept Bitcoin — cafes, restaurants, and ATMs — organized by continent and country.",
                url: generateCanonical("countries", "en"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Bitcoin Places by Country | Mapping Bitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Bitcoin Places by Country | Mapping Bitcoin",
                description: "Explore Bitcoin-accepting locations around the world — sorted by continent and country.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
        es: {
            title: "Lugares Bitcoin por Pais | Mapping Bitcoin",
            description: "Explora cafeterias, tiendas, cajeros y otros lugares del mundo que aceptan Bitcoin. Navega por continente y pais para ver donde se usa mas.",
            keywords: [
                "bitcoin por pais",
                "mapa adopcion bitcoin"
            ],
            openGraph: {
                title: "Lugares Bitcoin por Pais | Mapping Bitcoin",
                description: "Encuentra lugares de confianza que aceptan Bitcoin — cafeterias, restaurantes y cajeros — organizados por continente y pais.",
                url: generateCanonical("countries", "es"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Lugares Bitcoin por Pais | Mapping Bitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Lugares Bitcoin por Pais | Mapping Bitcoin",
                description: "Explora lugares que aceptan Bitcoin en todo el mundo — ordenados por continente y pais.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
        pt: {
            title: "Locais Bitcoin por Pais | Mapping Bitcoin",
            description: "Explore cafes, lojas, caixas eletronicos e outros lugares do mundo que aceitam Bitcoin. Navegue por continente e pais para ver onde e mais usado.",
            keywords: [
                "bitcoin por pais",
                "mapa adocao bitcoin"
            ],
            openGraph: {
                title: "Locais Bitcoin por Pais | Mapping Bitcoin",
                description: "Encontre lugares confiaveis que aceitam Bitcoin — cafes, restaurantes e caixas eletronicos — organizados por continente e pais.",
                url: generateCanonical("countries", "pt"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Locais Bitcoin por Pais | Mapping Bitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Locais Bitcoin por Pais | Mapping Bitcoin",
                description: "Explore locais que aceitam Bitcoin no mundo todo — organizados por continente e pais.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
    },
    'countries-pages': {
        en: {
            title: "– Mapping Bitcoin",
            description: "Explore trusted locations around the world where Bitcoin is accepted. Cafes, restaurants, ATMs and more.",
            keywords: [
                "bitcoin places",
                "accepts bitcoin"
            ],
            openGraph: {
                title: "– Mapping Bitcoin",
                description: "Find businesses that accept Bitcoin. Discover new locations globally.",
                url: generateCanonical("countries", "en"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "- Mapping Bitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "– Mapping Bitcoin",
                description: "Explore Bitcoin-accepting locations near you and around the world.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            },
        },
        es: {
            title: "– Mapping Bitcoin",
            description: "Explora lugares de confianza en todo el mundo donde se acepta Bitcoin. Cafeterias, restaurantes, cajeros y mas.",
            keywords: [
                "lugares bitcoin",
                "acepta bitcoin"
            ],
            openGraph: {
                title: "– Mapping Bitcoin",
                description: "Encuentra negocios que aceptan Bitcoin. Descubre nuevos lugares globalmente.",
                url: generateCanonical("countries", "es"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "- Mapping Bitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "– Mapping Bitcoin",
                description: "Explora lugares que aceptan Bitcoin cerca de ti y en todo el mundo.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            },
        },
        pt: {
            title: "– Mapping Bitcoin",
            description: "Explore locais confiaveis em todo o mundo onde o Bitcoin e aceito. Cafes, restaurantes, caixas eletronicos e mais.",
            keywords: [
                "locais bitcoin",
                "aceita bitcoin"
            ],
            openGraph: {
                title: "– Mapping Bitcoin",
                description: "Encontre comercios que aceitam Bitcoin. Descubra novos locais globalmente.",
                url: generateCanonical("countries", "pt"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "- Mapping Bitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "– Mapping Bitcoin",
                description: "Explore locais que aceitam Bitcoin perto de voce e no mundo todo.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            },
        },
    },
};

export default countriesSeo;

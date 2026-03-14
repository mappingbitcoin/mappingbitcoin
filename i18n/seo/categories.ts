import { env } from "@/lib/Environment";
import type { SEOModule } from "./types";

export type CategoriesPageKey = 'categories' | 'subcategory';

const categoriesSeo: SEOModule<CategoriesPageKey> = {
    categories: {
        en: {
            title: "Bitcoin Business Categories | Mapping Bitcoin",
            description: "Browse all categories of businesses that accept Bitcoin payments. Find restaurants, cafes, hotels, shops, and services accepting Bitcoin and Lightning.",
            keywords: [
                "bitcoin merchants",
                "bitcoin categories"
            ],
            openGraph: {
                title: "Bitcoin Business Categories | Mapping Bitcoin",
                description: "Browse all categories of businesses that accept Bitcoin payments. Find restaurants, cafes, hotels, shops, and services accepting Bitcoin and Lightning.",
                url: `${env.siteUrl}/categories`,
                type: "website",
                siteName: "Mapping Bitcoin",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Bitcoin Business Categories - Mapping Bitcoin",
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "Bitcoin Business Categories | Mapping Bitcoin",
                description: "Browse all categories of businesses that accept Bitcoin payments. Find restaurants, cafes, hotels, shops, and services accepting Bitcoin and Lightning.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            }
        },
        es: {
            title: "Categorias de Negocios Bitcoin | Mapping Bitcoin",
            description: "Explora todas las categorias de negocios que aceptan pagos con Bitcoin. Encuentra restaurantes, cafeterias, hoteles, tiendas y servicios que aceptan Bitcoin y Lightning.",
            keywords: [
                "comercios bitcoin",
                "categorias bitcoin"
            ],
            openGraph: {
                title: "Categorias de Negocios Bitcoin | Mapping Bitcoin",
                description: "Explora todas las categorias de negocios que aceptan pagos con Bitcoin. Encuentra restaurantes, cafeterias, hoteles, tiendas y servicios que aceptan Bitcoin y Lightning.",
                url: `${env.siteUrl}/es/categories`,
                type: "website",
                siteName: "Mapping Bitcoin",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Categorias de Negocios Bitcoin - Mapping Bitcoin",
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "Categorias de Negocios Bitcoin | Mapping Bitcoin",
                description: "Explora todas las categorias de negocios que aceptan pagos con Bitcoin. Encuentra restaurantes, cafeterias, hoteles, tiendas y servicios que aceptan Bitcoin y Lightning.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            }
        },
        pt: {
            title: "Categorias de Comercios Bitcoin | Mapping Bitcoin",
            description: "Explore todas as categorias de comercios que aceitam pagamentos com Bitcoin. Encontre restaurantes, cafes, hoteis, lojas e servicos que aceitam Bitcoin e Lightning.",
            keywords: [
                "comercios bitcoin",
                "categorias bitcoin"
            ],
            openGraph: {
                title: "Categorias de Comercios Bitcoin | Mapping Bitcoin",
                description: "Explore todas as categorias de comercios que aceitam pagamentos com Bitcoin. Encontre restaurantes, cafes, hoteis, lojas e servicos que aceitam Bitcoin e Lightning.",
                url: `${env.siteUrl}/pt/categories`,
                type: "website",
                siteName: "Mapping Bitcoin",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Categorias de Comercios Bitcoin - Mapping Bitcoin",
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "Categorias de Comercios Bitcoin | Mapping Bitcoin",
                description: "Explore todas as categorias de comercios que aceitam pagamentos com Bitcoin. Encontre restaurantes, cafes, hoteis, lojas e servicos que aceitam Bitcoin e Lightning.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            }
        },
    },
    subcategory: {
        en: {
            title: "{{category}} Accepting Bitcoin | Mapping Bitcoin",
            description: "Find {{category}} that accept Bitcoin in {{countries}} countries. Browse {{count}} verified places on our Bitcoin map.",
            keywords: [
                "bitcoin {{category}}",
                "{{category}} accept bitcoin"
            ],
            openGraph: {
                title: "{{category}} Accepting Bitcoin | Mapping Bitcoin",
                description: "Find {{category}} that accept Bitcoin in {{countries}} countries. Browse {{count}} verified places on our Bitcoin map.",
                url: `${env.siteUrl}/categories/{{subcategory}}`,
                type: "website",
                siteName: "Mapping Bitcoin",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "{{category}} Accepting Bitcoin - Mapping Bitcoin",
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "{{category}} Accepting Bitcoin | Mapping Bitcoin",
                description: "Find {{category}} that accept Bitcoin in {{countries}} countries. Browse {{count}} verified places on our Bitcoin map.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            }
        },
        es: {
            title: "{{category}} que Aceptan Bitcoin | Mapping Bitcoin",
            description: "Encuentra {{category}} que aceptan Bitcoin en {{countries}} paises. Explora {{count}} lugares verificados en nuestro mapa Bitcoin.",
            keywords: [
                "{{category}} bitcoin",
                "{{category}} aceptan bitcoin"
            ],
            openGraph: {
                title: "{{category}} que Aceptan Bitcoin | Mapping Bitcoin",
                description: "Encuentra {{category}} que aceptan Bitcoin en {{countries}} paises. Explora {{count}} lugares verificados en nuestro mapa Bitcoin.",
                url: `${env.siteUrl}/es/categories/{{subcategory}}`,
                type: "website",
                siteName: "Mapping Bitcoin",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "{{category}} que Aceptan Bitcoin - Mapping Bitcoin",
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "{{category}} que Aceptan Bitcoin | Mapping Bitcoin",
                description: "Encuentra {{category}} que aceptan Bitcoin en {{countries}} paises. Explora {{count}} lugares verificados en nuestro mapa Bitcoin.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            }
        },
        pt: {
            title: "{{category}} que Aceitam Bitcoin | Mapping Bitcoin",
            description: "Encontre {{category}} que aceitam Bitcoin em {{countries}} paises. Explore {{count}} locais verificados no nosso mapa Bitcoin.",
            keywords: [
                "{{category}} bitcoin",
                "{{category}} aceitam bitcoin"
            ],
            openGraph: {
                title: "{{category}} que Aceitam Bitcoin | Mapping Bitcoin",
                description: "Encontre {{category}} que aceitam Bitcoin em {{countries}} paises. Explore {{count}} locais verificados no nosso mapa Bitcoin.",
                url: `${env.siteUrl}/pt/categories/{{subcategory}}`,
                type: "website",
                siteName: "Mapping Bitcoin",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "{{category}} que Aceitam Bitcoin - Mapping Bitcoin",
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "{{category}} que Aceitam Bitcoin | Mapping Bitcoin",
                description: "Encontre {{category}} que aceitam Bitcoin em {{countries}} paises. Explore {{count}} locais verificados no nosso mapa Bitcoin.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            }
        },
    },
};

export default categoriesSeo;

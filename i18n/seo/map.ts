import { env } from "@/lib/Environment";
import { generateCanonical } from "./utils";
import type { SEOModule } from "./types";

export type MapPageKey = 'map';

const mapSeo: SEOModule<MapPageKey> = {
    map: {
        en: {
            title: "Interactive Bitcoin Map | Mapping Bitcoin",
            description: "Find Bitcoin-accepting places worldwide. Cafés, restaurants, shops, ATMs, and more. Search by location, filter by category, discover where to spend Bitcoin.",
            keywords: [
                "bitcoin map",
                "bitcoin near me",
                "spend bitcoin"
            ],
            openGraph: {
                title: "Interactive Bitcoin Map | Mapping Bitcoin",
                description: "Find Bitcoin-accepting places worldwide. Cafés, restaurants, shops, ATMs, and more. Discover where to spend Bitcoin.",
                url: generateCanonical('map', 'en'),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Interactive Bitcoin Map - Mapping Bitcoin",
                    }
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "Interactive Bitcoin Map | Mapping Bitcoin",
                description: "Find Bitcoin-accepting places worldwide. Cafés, restaurants, shops, ATMs, and more. Discover where to spend Bitcoin.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            }
        },
        es: {
            title: "Mapa Interactivo de Bitcoin | Mapping Bitcoin",
            description: "Encuentra lugares que aceptan Bitcoin en todo el mundo. Cafeterias, restaurantes, tiendas, cajeros y mas. Busca por ubicacion, filtra por categoria, descubre donde gastar Bitcoin.",
            keywords: [
                "mapa bitcoin interactivo",
                "bitcoin cerca de mi",
                "gastar bitcoin"
            ],
            openGraph: {
                title: "Mapa Interactivo de Bitcoin | Mapping Bitcoin",
                description: "Encuentra lugares que aceptan Bitcoin en todo el mundo. Cafeterias, restaurantes, tiendas, cajeros y mas. Descubre donde gastar Bitcoin.",
                url: generateCanonical('map', 'es'),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Mapa Interactivo de Bitcoin - Mapping Bitcoin",
                    }
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "Mapa Interactivo de Bitcoin | Mapping Bitcoin",
                description: "Encuentra lugares que aceptan Bitcoin en todo el mundo. Cafeterias, restaurantes, tiendas, cajeros y mas. Descubre donde gastar Bitcoin.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            }
        },
        pt: {
            title: "Mapa Interativo de Bitcoin | Mapping Bitcoin",
            description: "Encontre lugares que aceitam Bitcoin no mundo todo. Cafes, restaurantes, lojas, caixas eletronicos e mais. Pesquise por localizacao, filtre por categoria, descubra onde gastar Bitcoin.",
            keywords: [
                "mapa bitcoin interativo",
                "bitcoin perto de mim",
                "gastar bitcoin"
            ],
            openGraph: {
                title: "Mapa Interativo de Bitcoin | Mapping Bitcoin",
                description: "Encontre lugares que aceitam Bitcoin no mundo todo. Cafes, restaurantes, lojas, caixas eletronicos e mais. Descubra onde gastar Bitcoin.",
                url: generateCanonical('map', 'pt'),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Mapa Interativo de Bitcoin - Mapping Bitcoin",
                    }
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "Mapa Interativo de Bitcoin | Mapping Bitcoin",
                description: "Encontre lugares que aceitam Bitcoin no mundo todo. Cafes, restaurantes, lojas, caixas eletronicos e mais. Descubra onde gastar Bitcoin.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            }
        },
    },
};

export default mapSeo;

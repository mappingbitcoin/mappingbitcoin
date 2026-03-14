import { env } from "@/lib/Environment";
import type { SEOModule } from "./types";

export type StatsPageKey = 'stats';

const statsSeo: SEOModule<StatsPageKey> = {
    stats: {
        en: {
            title: "Bitcoin Merchant Statistics | Mapping Bitcoin",
            description: "Explore global Bitcoin adoption statistics. See the growth of Bitcoin-accepting merchants, top countries, categories, and verification trends.",
            keywords: [
                "bitcoin statistics",
                "bitcoin adoption stats"
            ],
            openGraph: {
                title: "Bitcoin Merchant Statistics | Mapping Bitcoin",
                description: "Explore global Bitcoin adoption statistics. See the growth of Bitcoin-accepting merchants, top countries, categories, and verification trends.",
                url: `${env.siteUrl}/stats`,
                type: "website",
                siteName: "Mapping Bitcoin",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Bitcoin Merchant Statistics - Mapping Bitcoin",
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "Bitcoin Merchant Statistics | Mapping Bitcoin",
                description: "Explore global Bitcoin adoption statistics. See the growth of Bitcoin-accepting merchants, top countries, categories, and verification trends.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            }
        },
        es: {
            title: "Estadisticas de Comercios Bitcoin | Mapping Bitcoin",
            description: "Explora las estadisticas globales de adopcion de Bitcoin. Ve el crecimiento de comercios que aceptan Bitcoin, principales paises, categorias y tendencias de verificacion.",
            keywords: [
                "estadisticas bitcoin",
                "datos adopcion bitcoin"
            ],
            openGraph: {
                title: "Estadisticas de Comercios Bitcoin | Mapping Bitcoin",
                description: "Explora las estadisticas globales de adopcion de Bitcoin. Ve el crecimiento de comercios que aceptan Bitcoin, principales paises, categorias y tendencias de verificacion.",
                url: `${env.siteUrl}/es/stats`,
                type: "website",
                siteName: "Mapping Bitcoin",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Estadisticas de Comercios Bitcoin - Mapping Bitcoin",
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "Estadisticas de Comercios Bitcoin | Mapping Bitcoin",
                description: "Explora las estadisticas globales de adopcion de Bitcoin. Ve el crecimiento de comercios que aceptan Bitcoin, principales paises, categorias y tendencias de verificacion.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            }
        },
        pt: {
            title: "Estatisticas de Comercios Bitcoin | Mapping Bitcoin",
            description: "Explore as estatisticas globais de adocao do Bitcoin. Veja o crescimento de comercios que aceitam Bitcoin, principais paises, categorias e tendencias de verificacao.",
            keywords: [
                "estatisticas bitcoin",
                "dados adocao bitcoin"
            ],
            openGraph: {
                title: "Estatisticas de Comercios Bitcoin | Mapping Bitcoin",
                description: "Explore as estatisticas globais de adocao do Bitcoin. Veja o crescimento de comercios que aceitam Bitcoin, principais paises, categorias e tendencias de verificacao.",
                url: `${env.siteUrl}/pt/stats`,
                type: "website",
                siteName: "Mapping Bitcoin",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Estatisticas de Comercios Bitcoin - Mapping Bitcoin",
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "Estatisticas de Comercios Bitcoin | Mapping Bitcoin",
                description: "Explore as estatisticas globais de adocao do Bitcoin. Veja o crescimento de comercios que aceitam Bitcoin, principais paises, categorias e tendencias de verificacao.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            }
        },
    },
};

export default statsSeo;

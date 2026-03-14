import { env } from "@/lib/Environment";
import type { SEOModule } from "./types";

export type HomePageKey = 'home';

const homeSeo: SEOModule<HomePageKey> = {
    home: {
        en: {
            title: "Global Bitcoin Map | Mapping Bitcoin",
            description: "Find every place, organization, and community in the Bitcoin ecosystem. Open-source, community-driven map of merchants accepting Bitcoin and Lightning payments.",
            keywords: [
                "mapping bitcoin",
                "bitcoin map",
                "btc map"
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
        es: {
            title: "Mapa Global de Bitcoin | Mapping Bitcoin",
            description: "Encuentra todos los lugares, organizaciones y comunidades del ecosistema Bitcoin. Mapa de comercios que aceptan pagos con Bitcoin y Lightning, de codigo abierto e impulsado por la comunidad.",
            keywords: [
                "mapa bitcoin",
                "comercios bitcoin",
                "donde pagar con bitcoin"
            ],
            openGraph: {
                title: "Mapa Global de Bitcoin | Mapping Bitcoin",
                description: "Encuentra todos los lugares, organizaciones y comunidades del ecosistema Bitcoin. Mapa de comercios que aceptan pagos con Bitcoin y Lightning, de codigo abierto e impulsado por la comunidad.",
                url: env.siteUrl,
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Mapa Global de Bitcoin - Mapping Bitcoin",
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "Mapa Global de Bitcoin | Mapping Bitcoin",
                description: "Encuentra todos los lugares, organizaciones y comunidades del ecosistema Bitcoin. Mapa de comercios que aceptan pagos con Bitcoin y Lightning, de codigo abierto e impulsado por la comunidad.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            }
        },
        pt: {
            title: "Mapa Global do Bitcoin | Mapping Bitcoin",
            description: "Encontre todos os lugares, organizacoes e comunidades do ecossistema Bitcoin. Mapa de comercios que aceitam pagamentos com Bitcoin e Lightning, de codigo aberto e impulsionado pela comunidade.",
            keywords: [
                "mapa bitcoin",
                "comercios bitcoin",
                "onde gastar bitcoin"
            ],
            openGraph: {
                title: "Mapa Global do Bitcoin | Mapping Bitcoin",
                description: "Encontre todos os lugares, organizacoes e comunidades do ecossistema Bitcoin. Mapa de comercios que aceitam pagamentos com Bitcoin e Lightning, de codigo aberto e impulsionado pela comunidade.",
                url: env.siteUrl,
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Mapa Global do Bitcoin - Mapping Bitcoin",
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "Mapa Global do Bitcoin | Mapping Bitcoin",
                description: "Encontre todos os lugares, organizacoes e comunidades do ecossistema Bitcoin. Mapa de comercios que aceitam pagamentos com Bitcoin e Lightning, de codigo aberto e impulsionado pela comunidade.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            }
        },
    },
};

export default homeSeo;

import { env } from "@/lib/Environment";
import type { SEOModule } from "./types";

export type HomePageKey = 'home';

const homeSeo: SEOModule<HomePageKey> = {
    home: {
        en: {
            title: "Bitcoin Ecosystem Explorer | Mapping Bitcoin",
            description: "Find every place, organization, and community in the Bitcoin ecosystem. Open-source, community-driven map of merchants accepting Bitcoin and Lightning payments.",
            keywords: [
                "mapping bitcoin",
                "bitcoin ecosystem",
                "bitcoin map",
                "btc map"
            ],
            openGraph: {
                title: "Bitcoin Ecosystem Explorer | Mapping Bitcoin",
                description: "Find every place, organization, and community in the Bitcoin ecosystem. Open-source, community-driven map of merchants accepting Bitcoin and Lightning payments.",
                url: env.siteUrl,
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Bitcoin Ecosystem Explorer - Mapping Bitcoin",
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "Bitcoin Ecosystem Explorer | Mapping Bitcoin",
                description: "Find every place, organization, and community in the Bitcoin ecosystem. Open-source, community-driven map of merchants accepting Bitcoin and Lightning payments.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            }
        },
        es: {
            title: "Explorador del Ecosistema Bitcoin | Mapping Bitcoin",
            description: "Encuentra todos los lugares, organizaciones y comunidades del ecosistema Bitcoin. Mapa de comercios que aceptan pagos con Bitcoin y Lightning, de codigo abierto e impulsado por la comunidad.",
            keywords: [
                "mapa bitcoin",
                "ecosistema bitcoin",
                "comercios bitcoin",
                "donde pagar con bitcoin"
            ],
            openGraph: {
                title: "Explorador del Ecosistema Bitcoin | Mapping Bitcoin",
                description: "Encuentra todos los lugares, organizaciones y comunidades del ecosistema Bitcoin. Mapa de comercios que aceptan pagos con Bitcoin y Lightning, de codigo abierto e impulsado por la comunidad.",
                url: env.siteUrl,
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Explorador del Ecosistema Bitcoin - Mapping Bitcoin",
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "Explorador del Ecosistema Bitcoin | Mapping Bitcoin",
                description: "Encuentra todos los lugares, organizaciones y comunidades del ecosistema Bitcoin. Mapa de comercios que aceptan pagos con Bitcoin y Lightning, de codigo abierto e impulsado por la comunidad.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            }
        },
        pt: {
            title: "Explorador do Ecossistema Bitcoin | Mapping Bitcoin",
            description: "Encontre todos os lugares, organizacoes e comunidades do ecossistema Bitcoin. Mapa de comercios que aceitam pagamentos com Bitcoin e Lightning, de codigo aberto e impulsionado pela comunidade.",
            keywords: [
                "mapa bitcoin",
                "ecossistema bitcoin",
                "comercios bitcoin",
                "onde gastar bitcoin"
            ],
            openGraph: {
                title: "Explorador do Ecossistema Bitcoin | Mapping Bitcoin",
                description: "Encontre todos os lugares, organizacoes e comunidades do ecossistema Bitcoin. Mapa de comercios que aceitam pagamentos com Bitcoin e Lightning, de codigo aberto e impulsionado pela comunidade.",
                url: env.siteUrl,
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Explorador do Ecossistema Bitcoin - Mapping Bitcoin",
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "Explorador do Ecossistema Bitcoin | Mapping Bitcoin",
                description: "Encontre todos os lugares, organizacoes e comunidades do ecossistema Bitcoin. Mapa de comercios que aceitam pagamentos com Bitcoin e Lightning, de codigo aberto e impulsionado pela comunidade.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            }
        },
    },
};

export default homeSeo;

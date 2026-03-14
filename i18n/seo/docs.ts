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
                "mapping bitcoin docs"
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
        es: {
            title: "Documentacion | Mapping Bitcoin",
            description: "Aprende como funciona Mapping Bitcoin: sincronizacion con OSM, enriquecimiento de datos, creacion de lugares, subida de imagenes con Blossom y sistema de verificacion.",
            keywords: [
                "documentacion mapping bitcoin"
            ],
            openGraph: {
                title: "Documentacion | Mapping Bitcoin",
                description: "Guia completa de Mapping Bitcoin: sincronizacion OSM, enriquecimiento de datos, envio de lugares, alojamiento de imagenes y sistemas de verificacion.",
                url: generateCanonical("docs", "es"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Documentacion | Mapping Bitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Documentacion | Mapping Bitcoin",
                description: "Aprende como funciona Mapping Bitcoin: sincronizacion OSM, enriquecimiento de datos, creacion de lugares y verificacion.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
        pt: {
            title: "Documentacao | Mapping Bitcoin",
            description: "Aprenda como o Mapping Bitcoin funciona: sincronizacao com OSM, enriquecimento de dados, criacao de locais, upload de imagens com Blossom e sistema de verificacao.",
            keywords: [
                "documentacao mapping bitcoin"
            ],
            openGraph: {
                title: "Documentacao | Mapping Bitcoin",
                description: "Guia completo do Mapping Bitcoin: sincronizacao OSM, enriquecimento de dados, envio de locais, hospedagem de imagens e sistemas de verificacao.",
                url: generateCanonical("docs", "pt"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Documentacao | Mapping Bitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Documentacao | Mapping Bitcoin",
                description: "Aprenda como o Mapping Bitcoin funciona: sincronizacao OSM, enriquecimento de dados, criacao de locais e verificacao.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
    },
};

export default docsSeo;

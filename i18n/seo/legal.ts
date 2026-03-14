import { env } from "@/lib/Environment";
import { generateCanonical } from "./utils";
import type { SEOModule } from "./types";

export type LegalPageKey = 'privacy-policy' | 'terms-and-conditions';

const legalSeo: SEOModule<LegalPageKey> = {
    "privacy-policy": {
        en: {
            title: "Privacy Policy | Mapping Bitcoin",
            description: "Learn how Mapping Bitcoin handles data. We use minimal cookies, anonymous stats, and public OpenStreetMap sources.",
            keywords: [
                "mapping bitcoin privacy"
            ],
            openGraph: {
                title: "Privacy Policy | Mapping Bitcoin",
                description: "We use limited cookies, anonymous analytics, and community data from public sources like OpenStreetMap.",
                url: generateCanonical("privacy-policy", "en"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Privacy Policy | Mapping Bitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Privacy Policy | Mapping Bitcoin",
                description: "Mapping Bitcoin explains how data is handled: minimal cookies, IP geolocation, and public sources.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
        es: {
            title: "Politica de Privacidad | Mapping Bitcoin",
            description: "Conoce como Mapping Bitcoin gestiona los datos. Usamos cookies minimas, estadisticas anonimas y fuentes publicas de OpenStreetMap.",
            keywords: [
                "privacidad mapping bitcoin"
            ],
            openGraph: {
                title: "Politica de Privacidad | Mapping Bitcoin",
                description: "Usamos cookies limitadas, analiticas anonimas y datos comunitarios de fuentes publicas como OpenStreetMap.",
                url: generateCanonical("privacy-policy", "es"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Politica de Privacidad | Mapping Bitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Politica de Privacidad | Mapping Bitcoin",
                description: "Mapping Bitcoin explica como se gestionan los datos: cookies minimas, geolocalizacion IP y fuentes publicas.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
        pt: {
            title: "Politica de Privacidade | Mapping Bitcoin",
            description: "Saiba como o Mapping Bitcoin gerencia os dados. Usamos cookies minimos, estatisticas anonimas e fontes publicas do OpenStreetMap.",
            keywords: [
                "privacidade mapping bitcoin"
            ],
            openGraph: {
                title: "Politica de Privacidade | Mapping Bitcoin",
                description: "Usamos cookies limitados, analises anonimas e dados comunitarios de fontes publicas como OpenStreetMap.",
                url: generateCanonical("privacy-policy", "pt"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Politica de Privacidade | Mapping Bitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Politica de Privacidade | Mapping Bitcoin",
                description: "Mapping Bitcoin explica como os dados sao gerenciados: cookies minimos, geolocalizacao IP e fontes publicas.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
    },
    "terms-and-conditions": {
        en: {
            title: "Terms and Conditions | Mapping Bitcoin",
            description: "Read the terms and conditions for using Mapping Bitcoin. Understand your rights and responsibilities when using our Bitcoin resources and tools.",
            keywords: [
                "mapping bitcoin terms"
            ],
            openGraph: {
                title: "Terms and Conditions | Mapping Bitcoin",
                description: "Terms of service for using Mapping Bitcoin's Bitcoin resources, maps, and educational content.",
                url: generateCanonical("terms-and-conditions", "en"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Terms and Conditions | Mapping Bitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Terms and Conditions | Mapping Bitcoin",
                description: "Terms of service for using Mapping Bitcoin's Bitcoin resources, maps, and educational content.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
        es: {
            title: "Terminos y Condiciones | Mapping Bitcoin",
            description: "Lee los terminos y condiciones de uso de Mapping Bitcoin. Conoce tus derechos y responsabilidades al usar nuestros recursos y herramientas Bitcoin.",
            keywords: [
                "terminos mapping bitcoin"
            ],
            openGraph: {
                title: "Terminos y Condiciones | Mapping Bitcoin",
                description: "Terminos de servicio para el uso de los recursos, mapas y contenido educativo de Mapping Bitcoin.",
                url: generateCanonical("terms-and-conditions", "es"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Terminos y Condiciones | Mapping Bitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Terminos y Condiciones | Mapping Bitcoin",
                description: "Terminos de servicio para el uso de los recursos, mapas y contenido educativo de Mapping Bitcoin.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
        pt: {
            title: "Termos e Condicoes | Mapping Bitcoin",
            description: "Leia os termos e condicoes de uso do Mapping Bitcoin. Entenda seus direitos e responsabilidades ao usar nossos recursos e ferramentas Bitcoin.",
            keywords: [
                "termos mapping bitcoin"
            ],
            openGraph: {
                title: "Termos e Condicoes | Mapping Bitcoin",
                description: "Termos de servico para o uso dos recursos, mapas e conteudo educativo do Mapping Bitcoin.",
                url: generateCanonical("terms-and-conditions", "pt"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Termos e Condicoes | Mapping Bitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Termos e Condicoes | Mapping Bitcoin",
                description: "Termos de servico para o uso dos recursos, mapas e conteudo educativo do Mapping Bitcoin.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
    },
};

export default legalSeo;

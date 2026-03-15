import { env } from "@/lib/Environment";
import { generateCanonical } from "./utils";
import type { SEOModule } from "./types";

export type ContactPageKey = 'contact';

const contactSeo: SEOModule<ContactPageKey> = {
    contact: {
        en: {
            title: "Contact Us — Bitcoin Merchant Map Support | Mapping Bitcoin",
            description: "Mapping Bitcoin is an open-source platform for discovering, learning, and using Bitcoin. Contact us for collaboration, questions, or feedback.",
            keywords: [
                "mapping bitcoin contact"
            ],
            openGraph: {
                title: "Contact Us — Bitcoin Merchant Map Support | Mapping Bitcoin",
                description: "Mapping Bitcoin is an open-source platform for discovering, learning, and using Bitcoin. Contact us for collaboration, questions, or feedback.",
                url: generateCanonical('contact', 'en'),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Contact Us — Bitcoin Merchant Map Support | Mapping Bitcoin",
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Contact Us — Bitcoin Merchant Map Support | Mapping Bitcoin",
                description: "Mapping Bitcoin is an open-source platform for discovering, learning, and using Bitcoin. Contact us for collaboration, questions, or feedback.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
        es: {
            title: "Contactenos — Soporte del Mapa de Comercios Bitcoin | Mapping Bitcoin",
            description: "Mapping Bitcoin es una plataforma de codigo abierto para descubrir, aprender y usar Bitcoin. Contactanos para colaboraciones, preguntas o comentarios.",
            keywords: [
                "contacto mapping bitcoin"
            ],
            openGraph: {
                title: "Contactenos — Soporte del Mapa de Comercios Bitcoin | Mapping Bitcoin",
                description: "Mapping Bitcoin es una plataforma de codigo abierto para descubrir, aprender y usar Bitcoin. Contactanos para colaboraciones, preguntas o comentarios.",
                url: generateCanonical('contact', 'es'),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Contactenos — Soporte del Mapa de Comercios Bitcoin | Mapping Bitcoin",
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Contactenos — Soporte del Mapa de Comercios Bitcoin | Mapping Bitcoin",
                description: "Mapping Bitcoin es una plataforma de codigo abierto para descubrir, aprender y usar Bitcoin. Contactanos para colaboraciones, preguntas o comentarios.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
        pt: {
            title: "Fale Conosco — Suporte do Mapa de Comercios Bitcoin | Mapping Bitcoin",
            description: "Mapping Bitcoin e uma plataforma de codigo aberto para descobrir, aprender e usar Bitcoin. Entre em contato para colaboracoes, perguntas ou feedback.",
            keywords: [
                "contato mapping bitcoin"
            ],
            openGraph: {
                title: "Fale Conosco — Suporte do Mapa de Comercios Bitcoin | Mapping Bitcoin",
                description: "Mapping Bitcoin e uma plataforma de codigo aberto para descobrir, aprender e usar Bitcoin. Entre em contato para colaboracoes, perguntas ou feedback.",
                url: generateCanonical('contact', 'pt'),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Fale Conosco — Suporte do Mapa de Comercios Bitcoin | Mapping Bitcoin",
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Fale Conosco — Suporte do Mapa de Comercios Bitcoin | Mapping Bitcoin",
                description: "Mapping Bitcoin e uma plataforma de codigo aberto para descobrir, aprender e usar Bitcoin. Entre em contato para colaboracoes, perguntas ou feedback.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
    },
};

export default contactSeo;

import { env } from "@/lib/Environment";
import { generateCanonical } from "./utils";
import type { SEOModule } from "./types";

export type VerifyYourBusinessPageKey = 'verify-your-business';

const verifyYourBusinessSeo: SEOModule<VerifyYourBusinessPageKey> = {
    'verify-your-business': {
        en: {
            title: "Verify Your Business | Mapping Bitcoin",
            description: "Prove ownership of your Bitcoin-accepting business on Mapping Bitcoin. Learn about our transparent verification process using email or domain verification.",
            keywords: [
                "verify bitcoin business",
                "claim business listing"
            ],
            openGraph: {
                title: "Verify Your Business | Mapping Bitcoin",
                description: "Prove ownership of your Bitcoin-accepting business on Mapping Bitcoin. Learn about our transparent verification process.",
                url: generateCanonical('verify-your-business', 'en'),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Verify Your Business | Mapping Bitcoin",
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Verify Your Business | Mapping Bitcoin",
                description: "Prove ownership of your Bitcoin-accepting business on Mapping Bitcoin. Learn about our transparent verification process.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
        es: {
            title: "Verifica tu Negocio | Mapping Bitcoin",
            description: "Demuestra la propiedad de tu negocio que acepta Bitcoin en Mapping Bitcoin. Conoce nuestro proceso de verificacion transparente mediante email o dominio.",
            keywords: [
                "verificar negocio bitcoin",
                "reclamar listado negocio"
            ],
            openGraph: {
                title: "Verifica tu Negocio | Mapping Bitcoin",
                description: "Demuestra la propiedad de tu negocio que acepta Bitcoin en Mapping Bitcoin. Conoce nuestro proceso de verificacion transparente.",
                url: generateCanonical('verify-your-business', 'es'),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Verifica tu Negocio | Mapping Bitcoin",
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Verifica tu Negocio | Mapping Bitcoin",
                description: "Demuestra la propiedad de tu negocio que acepta Bitcoin en Mapping Bitcoin. Conoce nuestro proceso de verificacion transparente.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
        pt: {
            title: "Verifique seu Negocio | Mapping Bitcoin",
            description: "Comprove a propriedade do seu negocio que aceita Bitcoin no Mapping Bitcoin. Conheca nosso processo de verificacao transparente usando email ou dominio.",
            keywords: [
                "verificar negocio bitcoin",
                "reivindicar listagem negocio"
            ],
            openGraph: {
                title: "Verifique seu Negocio | Mapping Bitcoin",
                description: "Comprove a propriedade do seu negocio que aceita Bitcoin no Mapping Bitcoin. Conheca nosso processo de verificacao transparente.",
                url: generateCanonical('verify-your-business', 'pt'),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Verifique seu Negocio | Mapping Bitcoin",
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Verifique seu Negocio | Mapping Bitcoin",
                description: "Comprove a propriedade do seu negocio que aceita Bitcoin no Mapping Bitcoin. Conheca nosso processo de verificacao transparente.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
    },
};

export default verifyYourBusinessSeo;

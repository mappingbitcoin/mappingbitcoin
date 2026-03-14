import { env } from "@/lib/Environment";
import { generateCanonical } from "./utils";
import type { SEOModule } from "./types";

export type PlacesPageKey = 'place' | 'submit-place' | 'merchant-pages';

const placesSeo: SEOModule<PlacesPageKey> = {
    place: {
        en: {
            title: "{{name}} in {{city}} | Mapping Bitcoin",
            description: "Discover {{name}}, a place in {{city}} where you can use Bitcoin.",
            keywords: [],
            openGraph: {
                title: "{{name}} in {{city}} | Mapping Bitcoin",
                description: "Discover {{name}}, a place in {{city}} where you can use Bitcoin.",
                url: generateCanonical("places", "en"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Bitcoin Place | Mapping Bitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "{{name}} in {{city}} | Mapping Bitcoin",
                description: "Discover {{name}}, a place in {{city}} where you can use Bitcoin.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
        es: {
            title: "{{name}} en {{city}} | Mapping Bitcoin",
            description: "Descubre {{name}}, un lugar en {{city}} donde puedes usar Bitcoin.",
            keywords: [],
            openGraph: {
                title: "{{name}} en {{city}} | Mapping Bitcoin",
                description: "Descubre {{name}}, un lugar en {{city}} donde puedes usar Bitcoin.",
                url: generateCanonical("places", "es"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Lugar Bitcoin | Mapping Bitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "{{name}} en {{city}} | Mapping Bitcoin",
                description: "Descubre {{name}}, un lugar en {{city}} donde puedes usar Bitcoin.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
        pt: {
            title: "{{name}} em {{city}} | Mapping Bitcoin",
            description: "Descubra {{name}}, um lugar em {{city}} onde voce pode usar Bitcoin.",
            keywords: [],
            openGraph: {
                title: "{{name}} em {{city}} | Mapping Bitcoin",
                description: "Descubra {{name}}, um lugar em {{city}} onde voce pode usar Bitcoin.",
                url: generateCanonical("places", "pt"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Local Bitcoin | Mapping Bitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "{{name}} em {{city}} | Mapping Bitcoin",
                description: "Descubra {{name}}, um lugar em {{city}} onde voce pode usar Bitcoin.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
    },
    'submit-place': {
        en: {
            title: "Submit a Bitcoin-Friendly Place | Mapping Bitcoin",
            description: "Share Bitcoin-friendly businesses with the community. Submit accurate place details so others can spend Bitcoin nearby.",
            keywords: [
                "submit bitcoin place",
                "add bitcoin business"
            ],
            openGraph: {
                title: "Submit a Bitcoin-Friendly Place | Mapping Bitcoin",
                description: "Share Bitcoin-friendly businesses with the community.",
                url: generateCanonical("places/create", "en"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Submit a Bitcoin Place | Mapping Bitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Submit a Bitcoin-Friendly Place | Mapping Bitcoin",
                description: "Help others find places to spend Bitcoin by submitting a trusted place.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
        es: {
            title: "Enviar un Lugar que Acepta Bitcoin | Mapping Bitcoin",
            description: "Comparte negocios que aceptan Bitcoin con la comunidad. Envia datos precisos del lugar para que otros puedan gastar Bitcoin cerca.",
            keywords: [
                "agregar lugar bitcoin",
                "enviar negocio bitcoin"
            ],
            openGraph: {
                title: "Enviar un Lugar que Acepta Bitcoin | Mapping Bitcoin",
                description: "Comparte negocios que aceptan Bitcoin con la comunidad.",
                url: generateCanonical("places/create", "es"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Enviar un Lugar Bitcoin | Mapping Bitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Enviar un Lugar que Acepta Bitcoin | Mapping Bitcoin",
                description: "Ayuda a otros a encontrar lugares para gastar Bitcoin enviando un lugar verificado.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
        pt: {
            title: "Enviar um Local que Aceita Bitcoin | Mapping Bitcoin",
            description: "Compartilhe comercios que aceitam Bitcoin com a comunidade. Envie dados precisos do local para que outros possam gastar Bitcoin por perto.",
            keywords: [
                "adicionar local bitcoin",
                "enviar comercio bitcoin"
            ],
            openGraph: {
                title: "Enviar um Local que Aceita Bitcoin | Mapping Bitcoin",
                description: "Compartilhe comercios que aceitam Bitcoin com a comunidade.",
                url: generateCanonical("places/create", "pt"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Enviar um Local Bitcoin | Mapping Bitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Enviar um Local que Aceita Bitcoin | Mapping Bitcoin",
                description: "Ajude outros a encontrar lugares para gastar Bitcoin enviando um local verificado.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
    },
    'merchant-pages': {
        en: {
            title: "Bitcoin {{category}} in {{location}} | Mapping Bitcoin",
            description: "Find Bitcoin-friendly {{category}} in {{location}}. Browse verified merchants accepting Bitcoin payments.",
            keywords: [
                "bitcoin merchants",
                "spend bitcoin"
            ],
            openGraph: {
                title: "Bitcoin {{category}} in {{location}} | Mapping Bitcoin",
                description: "Find Bitcoin-friendly {{category}} in {{location}}. Browse verified merchants accepting Bitcoin payments.",
                url: generateCanonical("", "en"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Bitcoin Merchants | Mapping Bitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Bitcoin {{category}} in {{location}} | Mapping Bitcoin",
                description: "Find Bitcoin-friendly {{category}} in {{location}}.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
        es: {
            title: "{{category}} Bitcoin en {{location}} | Mapping Bitcoin",
            description: "Encuentra {{category}} que aceptan Bitcoin en {{location}}. Explora comercios verificados que aceptan pagos con Bitcoin.",
            keywords: [
                "comercios bitcoin",
                "gastar bitcoin"
            ],
            openGraph: {
                title: "{{category}} Bitcoin en {{location}} | Mapping Bitcoin",
                description: "Encuentra {{category}} que aceptan Bitcoin en {{location}}. Explora comercios verificados que aceptan pagos con Bitcoin.",
                url: generateCanonical("", "es"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Comercios Bitcoin | Mapping Bitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "{{category}} Bitcoin en {{location}} | Mapping Bitcoin",
                description: "Encuentra {{category}} que aceptan Bitcoin en {{location}}.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
        pt: {
            title: "{{category}} Bitcoin em {{location}} | Mapping Bitcoin",
            description: "Encontre {{category}} que aceitam Bitcoin em {{location}}. Explore comercios verificados que aceitam pagamentos com Bitcoin.",
            keywords: [
                "comercios bitcoin",
                "gastar bitcoin"
            ],
            openGraph: {
                title: "{{category}} Bitcoin em {{location}} | Mapping Bitcoin",
                description: "Encontre {{category}} que aceitam Bitcoin em {{location}}. Explore comercios verificados que aceitam pagamentos com Bitcoin.",
                url: generateCanonical("", "pt"),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Comercios Bitcoin | Mapping Bitcoin"
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "{{category}} Bitcoin em {{location}} | Mapping Bitcoin",
                description: "Encontre {{category}} que aceitam Bitcoin em {{location}}.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
    },
};

export default placesSeo;

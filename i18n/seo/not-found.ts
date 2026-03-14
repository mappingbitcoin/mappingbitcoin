import { env } from "@/lib/Environment";
import type { SEOModule } from "./types";

export type NotFoundPageKey = 'not-found';

const notFoundSeo: SEOModule<NotFoundPageKey> = {
    'not-found': {
        en: {
            title: "Page Not Found | Mapping Bitcoin",
            description: "This page doesn't exist, but you can still explore Bitcoin tools, guides, and places where it's accepted.",
            openGraph: {
                title: "Page Not Found | Mapping Bitcoin",
                description: "This page doesn't exist, but you can still explore Bitcoin tools, guides, and places where it's accepted.",
                url: env.siteUrl,
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Page Not Found | Mapping Bitcoin",
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "Page Not Found | Mapping Bitcoin",
                description: "This page doesn't exist, but you can still explore Bitcoin tools, guides, and places where it's accepted.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            },
        },
        es: {
            title: "Pagina No Encontrada | Mapping Bitcoin",
            description: "Esta pagina no existe, pero aun puedes explorar herramientas Bitcoin, guias y lugares donde se acepta.",
            openGraph: {
                title: "Pagina No Encontrada | Mapping Bitcoin",
                description: "Esta pagina no existe, pero aun puedes explorar herramientas Bitcoin, guias y lugares donde se acepta.",
                url: env.siteUrl,
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Pagina No Encontrada | Mapping Bitcoin",
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "Pagina No Encontrada | Mapping Bitcoin",
                description: "Esta pagina no existe, pero aun puedes explorar herramientas Bitcoin, guias y lugares donde se acepta.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            },
        },
        pt: {
            title: "Pagina Nao Encontrada | Mapping Bitcoin",
            description: "Esta pagina nao existe, mas voce ainda pode explorar ferramentas Bitcoin, guias e locais onde e aceito.",
            openGraph: {
                title: "Pagina Nao Encontrada | Mapping Bitcoin",
                description: "Esta pagina nao existe, mas voce ainda pode explorar ferramentas Bitcoin, guias e locais onde e aceito.",
                url: env.siteUrl,
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Pagina Nao Encontrada | Mapping Bitcoin",
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "Pagina Nao Encontrada | Mapping Bitcoin",
                description: "Esta pagina nao existe, mas voce ainda pode explorar ferramentas Bitcoin, guias e locais onde e aceito.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`],
            },
        },
    },
};

export default notFoundSeo;

import DocArticle from "../DocArticle";
import { Locale } from "@/i18n/types";
import Script from "next/script";
import { generateCanonical } from "@/i18n/seo";
import { Metadata } from "next";
import { allDocs, getDocBySlug } from "../docsConfig";
import { notFound } from "next/navigation";
import { env } from "@/lib/Environment";

export const dynamic = 'force-dynamic';

interface DocsSlugParams {
    params: Promise<{
        locale: Locale;
        slug: string;
    }>;
}

export async function generateMetadata({ params }: DocsSlugParams): Promise<Metadata> {
    const { slug } = await params;
    const doc = getDocBySlug(slug);

    if (!doc) {
        return {
            title: "Not Found | Documentation | MappingBitcoin.com",
        };
    }

    return {
        title: `${doc.title} | Documentation | MappingBitcoin.com`,
        description: doc.description,
        openGraph: {
            title: `${doc.title} | Documentation | MappingBitcoin.com`,
            description: doc.description,
            type: "article",
            images: [
                {
                    url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                    width: 1200,
                    height: 630,
                    alt: doc.title,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: `${doc.title} | MappingBitcoin.com`,
            description: doc.description,
        },
    };
}

export default async function DocsSlugPage({ params }: DocsSlugParams) {
    const { locale, slug } = await params;
    const doc = getDocBySlug(slug);

    if (!doc) {
        notFound();
    }

    const canonical = generateCanonical(`docs/${slug}`, locale);

    return (
        <>
            <Script
                id="webpage-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "TechArticle",
                        "name": doc.title,
                        "description": doc.description,
                        "url": canonical,
                        "isPartOf": {
                            "@type": "WebSite",
                            "name": "MappingBitcoin.com",
                            "url": "https://mappingbitcoin.com/"
                        }
                    })
                }}
            />
            <Script
                id="breadcrumb-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        "itemListElement": [
                            {
                                "@type": "ListItem",
                                "position": 1,
                                "name": "Home",
                                "item": "https://mappingbitcoin.com/"
                            },
                            {
                                "@type": "ListItem",
                                "position": 2,
                                "name": "Documentation",
                                "item": "https://mappingbitcoin.com/docs"
                            },
                            {
                                "@type": "ListItem",
                                "position": 3,
                                "name": doc.title,
                                "item": canonical
                            }
                        ]
                    })
                }}
            />
            <DocArticle slug={slug} locale={locale} />
        </>
    );
}

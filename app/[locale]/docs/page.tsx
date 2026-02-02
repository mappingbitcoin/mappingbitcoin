import DocArticle from "./DocArticle";
import { buildGeneratePageMetadata, getPageSeo } from "@/utils/SEOUtils";
import { Localized } from "@/i18n/types";
import Script from "next/script";
import { generateCanonical } from "@/i18n/seo";
import React from "react";

export const dynamic = 'force-dynamic';
export const generateMetadata = buildGeneratePageMetadata("docs");

export default async function DocsPage({ params }: Localized) {
    const { metadata, locale } = await getPageSeo("docs")({ params });
    const canonical = generateCanonical("docs", locale);

    return (
        <>
            <Script
                id="webpage-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "TechArticle",
                        "name": metadata.title,
                        "description": metadata.description,
                        "url": canonical,
                        "isPartOf": {
                            "@type": "WebSite",
                            "name": "MappingBitcoin.com",
                            "url": "https://mappingbitcoin.com/"
                        }
                    })
                }}
            />
            <DocArticle slug="overview" locale={locale} />
        </>
    );
}

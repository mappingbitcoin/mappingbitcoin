import TermsAndConditions from "@/app/[locale]/terms-and-conditions/TermsAndConditions";
import {buildGeneratePageMetadata, getPageSeo} from "@/utils/SEOUtils";
import {Localized} from "@/i18n/types";
import Script from "next/script";
import {generateCanonical} from "@/i18n/seo";
import React from "react";
import fs from "fs";
import path from "path";

export const generateMetadata = buildGeneratePageMetadata("terms-and-conditions");

export default async function TermsAndConditionsPage({ params }: Localized) {
    const { metadata, locale } = await getPageSeo("terms-and-conditions")({ params });
    const canonical = generateCanonical("terms-and-conditions", locale);

    // Read markdown content server-side for SEO
    const mdPath = path.join(process.cwd(), "public", "terms-and-conditions", `${locale}.md`);
    const content = fs.existsSync(mdPath)
        ? fs.readFileSync(mdPath, "utf-8")
        : fs.readFileSync(path.join(process.cwd(), "public", "terms-and-conditions", "en.md"), "utf-8");

    return (
        <>
            <Script
                id="webpage-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebPage",
                        "name": metadata.title,
                        "description": metadata.description,
                        "url": canonical,
                        "isPartOf": {
                            "@type": "WebSite",
                            "name": "Mapping Bitcoin",
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
                                "name": "Terms & Conditions",
                                "item": canonical
                            }
                        ]
                    })
                }}
            />
            <TermsAndConditions content={content} />
        </>
    );
}

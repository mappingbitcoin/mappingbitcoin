import PrivacyPolicy from "@/app/[locale]/privacy-policy/PrivacyPolicy";
import {buildGeneratePageMetadata, getPageSeo} from "@/utils/SEOUtils";
import {Localized} from "@/i18n/types";
import Script from "next/script";
import {generateCanonical} from "@/i18n/seo";
import React from "react";
import fs from "fs";
import path from "path";

export const generateMetadata = buildGeneratePageMetadata("privacy-policy");

export default async function PrivacyPolicyPage({ params }: Localized) {
    const { metadata, locale } = await getPageSeo("privacy-policy")({ params });
    const canonical = generateCanonical("privacy-policy", locale);

    // Read markdown content server-side for SEO
    const mdPath = path.join(process.cwd(), "public", "privacy-policy", `${locale}.md`);
    const content = fs.existsSync(mdPath)
        ? fs.readFileSync(mdPath, "utf-8")
        : fs.readFileSync(path.join(process.cwd(), "public", "privacy-policy", "en.md"), "utf-8");

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
                                "name": "Privacy Policy",
                                "item": canonical
                            }
                        ]
                    })
                }}
            />
            <PrivacyPolicy content={content} />
        </>
    );
}

import React from "react";
import { buildGeneratePageMetadata, getPageSeo } from "@/utils/SEOUtils";
import { Localized } from "@/i18n/types";
import { generateCanonical } from "@/i18n/seo";
import Script from "next/script";
import VerifyYourBusinessContent from "./VerifyYourBusinessContent";

export const generateMetadata = buildGeneratePageMetadata('verify-your-business');

const VerifyYourBusinessPage = async ({ params }: Localized) => {
    const { metadata, locale } = await getPageSeo('verify-your-business')({ params });
    const canonical = generateCanonical('verify-your-business', locale);

    return (
        <>
            <Script
                id="verify-business-jsonld"
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
                            "name": "MappingBitcoin.com",
                            "url": "https://mappingbitcoin.com/"
                        }
                    }),
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
                                "name": "Verify Your Business",
                                "item": canonical
                            }
                        ]
                    }),
                }}
            />
            <VerifyYourBusinessContent />
        </>
    );
};

export default VerifyYourBusinessPage;

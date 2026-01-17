import PrivacyPolicy from "@/app/[locale]/privacy-policy/PrivacyPolicy";
import {buildGeneratePageMetadata, getPageSeo} from "@/utils/SEOUtils";
import {Localized} from "@/i18n/types";
import Script from "next/script";
import {generateCanonical} from "@/i18n/seo";
import React from "react";

export const generateMetadata = buildGeneratePageMetadata("privacy-policy");

export default async function PrivacyPolicyPage({ params }: Localized) {
    const { metadata, locale } = await getPageSeo("privacy-policy")({ params });
    return (
        <>
            <Script
                id="json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Website",
                        name: metadata.title,
                        description: metadata.description,
                        url: generateCanonical("privacy-policy", locale)
                    })
                }}
            />
            <PrivacyPolicy locale={locale} />
        </>
    );
}

import TermsAndConditions from "@/app/[locale]/terms-and-conditions/TermsAndConditions";
import {buildGeneratePageMetadata, getPageSeo} from "@/utils/SEOUtils";
import {Localized} from "@/i18n/types";
import Script from "next/script";
import {generateCanonical} from "@/i18n/seo";
import React from "react";

export const generateMetadata = buildGeneratePageMetadata("terms-and-conditions");

export default async function TermsAndConditionsPage({ params }: Localized) {
    const { metadata, locale } = await getPageSeo("terms-and-conditions")({ params });
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
                        url: generateCanonical("terms-and-conditions", locale)
                    })
                }}
            />
            <TermsAndConditions locale={locale} />
        </>
    );
}

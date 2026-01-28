import React from "react";
import Unsubscribe from "./Unsubscribe";
import { Localized } from "@/i18n/types";
import { generateCanonical } from "@/i18n/seo";
import { getTranslations } from "next-intl/server";
import Script from "next/script";
import type { Metadata } from "next";

export async function generateMetadata({ params }: Localized): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "unsubscribe" });

    return {
        title: t("meta.title"),
        description: t("meta.description"),
        robots: { index: false, follow: false },
    };
}

const UnsubscribePage = async ({ params }: Localized) => {
    const { locale } = await params;
    const canonical = generateCanonical("unsubscribe", locale);

    return (
        <>
            <Script
                id="unsubscribepage-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebPage",
                        "name": "Unsubscribe - MappingBitcoin",
                        "description": "Manage your email subscriptions",
                        "url": canonical,
                        "isPartOf": {
                            "@type": "WebSite",
                            "name": "MappingBitcoin.com",
                            "url": "https://mappingbitcoin.com/"
                        }
                    }),
                }}
            />
            <Unsubscribe />
        </>
    );
};

export default UnsubscribePage;

import React from "react";
import { buildGeneratePageMetadata, getPageSeo } from "@/utils/SEOUtils";
import { Localized } from "@/i18n/types";
import { generateCanonical } from "@/i18n/seo";
import { getTranslations } from "next-intl/server";
import Script from "next/script";
import MapClient from "./MapClient";

export const generateMetadata = buildGeneratePageMetadata('map');

const MapPage = async ({ params }: Localized) => {
    const { metadata, locale } = await getPageSeo("map")({ params });
    const t = await getTranslations({ locale, namespace: "map" });

    const canonical = generateCanonical('map', locale);

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
                        "url": canonical,
                        "description": metadata.description,
                        "isPartOf": {
                            "@type": "WebSite",
                            "name": "Mapping Bitcoin",
                            "url": "https://mappingbitcoin.com/"
                        },
                        "mainEntity": {
                            "@type": "Map",
                            "name": metadata.title,
                            "url": canonical,
                            "description": metadata.description,
                            "mapType": "https://schema.org/VenueMap"
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
                                "name": "Map",
                                "item": canonical
                            }
                        ]
                    })
                }}
            />
            {/* Server-rendered SEO content for crawlers */}
            <div className="sr-only">
                <h1>{t("seo.h1")}</h1>
                <p>{t("seo.intro")}</p>
                <h2>{t("seo.findTitle")}</h2>
                <p>{t("seo.findDescription")}</p>
                <h2>{t("seo.categoriesTitle")}</h2>
                <p>{t("seo.categoriesDescription")}</p>
                <h2>{t("seo.dataTitle")}</h2>
                <p>{t("seo.dataDescription")}</p>
                <h2>{t("seo.spendTitle")}</h2>
                <p>{t("seo.spendDescription")}</p>
            </div>
            <MapClient metadata={metadata} />
        </>
    );
};

export default MapPage;

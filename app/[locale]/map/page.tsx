import React from "react";
import { buildGeneratePageMetadata, getPageSeo } from "@/utils/SEOUtils";
import { Localized } from "@/i18n/types";
import { generateCanonical } from "@/i18n/seo";
import Script from "next/script";
import MapClient from "./MapClient";

export const generateMetadata = buildGeneratePageMetadata('map');

const MapPage = async ({ params }: Localized) => {
    const { metadata, locale } = await getPageSeo("map")({ params });

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
            <MapClient metadata={metadata} />
        </>
    );
};

export default MapPage;

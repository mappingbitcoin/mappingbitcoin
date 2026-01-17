import React from "react";
import { buildGeneratePageMetadata, getPageSeo } from "@/utils/SEOUtils";
import { Localized } from "@/i18n/types";
import { generateCanonical } from "@/i18n/seo";
import Script from "next/script";
import MapWrapper from "./MapWrapper";

export const generateMetadata = buildGeneratePageMetadata('map');

const MapPage = async ({ params }: Localized) => {
    const { metadata, locale } = await getPageSeo("map")({ params });

    return (
        <>
            <Script
                id="jsonld-map"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Map",
                        "name": metadata.title,
                        "url": generateCanonical('map', locale),
                        "description": metadata.description,
                        "hasMap": {
                            "@type": "Map",
                            "url": generateCanonical('map', locale),
                            "description": metadata.description
                        }
                    })
                }}
            />
            <MapWrapper metadata={metadata} />
        </>
    );
};

export default MapPage;

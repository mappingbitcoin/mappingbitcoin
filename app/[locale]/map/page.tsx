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
            {/* Server-rendered SEO content for crawlers */}
            <div className="sr-only">
                <h1>Interactive Bitcoin Map - Find Bitcoin-Accepting Places Worldwide</h1>
                <p>
                    Discover Bitcoin-accepting businesses near you with our interactive map.
                    Mapping Bitcoin helps you find cafes, restaurants, shops, ATMs, hotels,
                    and services that accept Bitcoin payments anywhere in the world.
                </p>
                <h2>Find Bitcoin-Friendly Businesses</h2>
                <p>
                    Our map displays thousands of Bitcoin-accepting locations across all continents.
                    Search by location, filter by business category, and find trusted merchants
                    that welcome Bitcoin payments.
                </p>
                <h2>Bitcoin Payment Categories</h2>
                <p>
                    Browse Bitcoin-accepting businesses by category: restaurants, cafes, bars,
                    hotels, retail stores, professional services, ATMs, coworking spaces,
                    and many more. Each category shows verified and community-sourced locations.
                </p>
                <h2>Real-Time Bitcoin Merchant Data</h2>
                <p>
                    Our map pulls data from OpenStreetMap and community contributions to provide
                    the most comprehensive Bitcoin merchant directory. Help grow the Bitcoin
                    economy by adding new Bitcoin-accepting businesses you discover.
                </p>
                <h2>Spend Bitcoin Anywhere</h2>
                <p>
                    Whether you are traveling or exploring your local area, use Mapping Bitcoin
                    to find places where you can spend your Bitcoin. Support businesses that
                    embrace cryptocurrency payments and help drive global Bitcoin adoption.
                </p>
            </div>
            <MapClient metadata={metadata} />
        </>
    );
};

export default MapPage;

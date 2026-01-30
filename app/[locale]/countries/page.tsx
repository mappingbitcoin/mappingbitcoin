import CountriesPage from "@/app/[locale]/countries/CountriesPage";
import {getLocationCache} from "@/app/api/cache/LocationCache";
import {buildGeneratePageMetadata} from "@/utils/SEOUtils";
import Script from "next/script";
import {env} from "@/lib/Environment";

export const generateMetadata = buildGeneratePageMetadata('countries')

export default async function CountriesRoute() {
    const locationCache = await getLocationCache();
    const countries = Object.values(locationCache.countries);

    // Build ItemList schema for countries
    const itemListSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Bitcoin-Accepting Countries",
        "description": "Directory of countries with Bitcoin-accepting merchants and venues",
        "numberOfItems": countries.length,
        "itemListElement": countries
            .sort((a, b) => b.count - a.count)
            .slice(0, 50) // Top 50 countries
            .map((country, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": country.label,
                "url": `${env.siteUrl}/bitcoin-shops-in-${country.label.toLowerCase().replace(/\s+/g, '-')}`,
                "description": `${country.count} Bitcoin-accepting venues in ${country.label}`
            }))
    };

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": env.siteUrl
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Countries",
                "item": `${env.siteUrl}/countries`
            }
        ]
    };

    return (
        <>
            <Script
                id="itemlist-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
            />
            <Script
                id="breadcrumb-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <CountriesPage countries={locationCache.countries}/>
        </>
    );
}

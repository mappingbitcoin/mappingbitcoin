import Script from "next/script";
import { env } from "@/lib/Environment";
import { buildGeneratePageMetadata } from "@/utils/SEOUtils";
import { getTranslations } from "next-intl/server";
import StatsClient from "./StatsClient";

export const generateMetadata = buildGeneratePageMetadata('stats');

export default async function StatsPage() {
    const t = await getTranslations("stats");

    // JSON-LD: BreadcrumbList schema
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": t("breadcrumb.home"),
                "item": env.siteUrl
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": t("breadcrumb.stats"),
                "item": `${env.siteUrl}/stats`
            }
        ]
    };

    return (
        <>
            <Script
                id="breadcrumb-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            {/* Server-rendered SEO content for crawlers */}
            <div className="sr-only">
                <h1>{t("seo.h1")}</h1>
                <p>{t("seo.intro")}</p>
                <h2>{t("seo.globalTitle")}</h2>
                <p>{t("seo.globalDescription")}</p>
                <h2>{t("seo.categoriesTitle")}</h2>
                <p>{t("seo.categoriesDescription")}</p>
                <h2>{t("seo.verifiedTitle")}</h2>
                <p>{t("seo.verifiedDescription")}</p>
                <h2>{t("seo.trendsTitle")}</h2>
                <p>{t("seo.trendsDescription")}</p>
            </div>
            <StatsClient />
        </>
    );
}

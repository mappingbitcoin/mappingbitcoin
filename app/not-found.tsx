import { env } from "@/lib/Environment";
import Script from "next/script";
import { Localized } from "@/i18n/types";
import { NotFoundPage } from "@/components/common";
import {buildGeneratePageMetadata, getPageSeo} from "@/utils/SEOUtils";
import {getMessages} from "next-intl/server";
import {NextIntlClientProvider} from "next-intl";

export const generateMetadata = buildGeneratePageMetadata('not-found')

export default async function NotFound({ params }: Localized) {
    const { metadata } = await getPageSeo("not-found")({ params });

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": metadata.title,
        "description": metadata.description,
        "isPartOf": {
            "@type": "WebSite",
            "name": "Mapping Bitcoin",
            "url": env.siteUrl
        }
    };

    const breadcrumbJsonLd = {
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
                "name": "Page Not Found"
            }
        ]
    };

    const locale = 'en'
    const allMessages = await getMessages({ locale });

    return (
        <>
            <Script
                id="webpage-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Script
                id="breadcrumb-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            <NextIntlClientProvider locale={locale} messages={allMessages}>
                <NotFoundPage />
            </NextIntlClientProvider>
        </>
    );
}

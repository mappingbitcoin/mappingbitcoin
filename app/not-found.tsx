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
        name: metadata.title,
        description: metadata.description,
        isPartOf: {
            "@type": "WebSite",
            name: "MappingBitcoin.com",
            url: env.siteUrl,
        },
    };

    const locale = 'en'
    const allMessages = await getMessages({ locale });

    return (
        <>
            <Script
                id="json-ld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <NextIntlClientProvider locale={locale} messages={allMessages}>
                <NotFoundPage />
            </NextIntlClientProvider>
        </>
    );
}

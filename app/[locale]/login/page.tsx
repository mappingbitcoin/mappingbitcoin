import React from "react";
import Login from "@/app/[locale]/login/Login";
import { Localized } from "@/i18n/types";
import { generateCanonical } from "@/i18n/seo";
import { getTranslations } from "next-intl/server";
import Script from "next/script";
import type { Metadata } from "next";

export async function generateMetadata({ params }: Localized): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "login" });

    return {
        title: t("meta.title"),
        description: t("meta.description"),
    };
}

const LoginPage = async ({ params }: Localized) => {
    const { locale } = await params;
    const canonical = generateCanonical("login", locale);

    return (
        <>
            <Script
                id="loginpage-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebPage",
                        "name": "Login - MappingBitcoin",
                        "description": "Sign in to MappingBitcoin using your Nostr identity",
                        "url": canonical,
                        "isPartOf": {
                            "@type": "WebSite",
                            "name": "MappingBitcoin.com",
                            "url": "https://mappingbitcoin.com/"
                        }
                    }),
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
                                "name": "Login",
                                "item": canonical
                            }
                        ]
                    }),
                }}
            />
            <Login />
        </>
    );
};

export default LoginPage;

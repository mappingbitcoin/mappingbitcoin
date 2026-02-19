import React, { cache, Suspense } from "react";
import { Toaster } from "react-hot-toast";
import Script from "next/script";

import { Footer, NavBar, PageTransition, BodyLockManager } from "@/components/layout";
import { ClientOnlyAnalytics, CookieNotice } from "@/components/common";
import { NostrAuthProvider } from "@/contexts/NostrAuthContext";

import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { startBitcoinVenueCron } from "@/utils/sync/CronJob";
import { getMessages } from "next-intl/server";

// Organization schema for all pages
const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://mappingbitcoin.com/#organization",
    "name": "Mapping Bitcoin",
    "url": "https://mappingbitcoin.com",
    "logo": "https://mappingbitcoin.com/assets/logo.png",
    "description": "Open-source directory of Bitcoin-accepting merchants worldwide. Built on OpenStreetMap with places verification, reviews and ratings powered by Nostr and filtered by Web of Trust.",
    "foundingDate": "2026",
    "sameAs": [
        "https://github.com/mappingbitcoin/mappingbitcoin"
    ],
    "contactPoint": {
        "@type": "ContactPage",
        "url": "https://mappingbitcoin.com/contact"
    },
    "knowsAbout": [
        "Bitcoin",
        "Lightning Network",
        "Bitcoin merchants",
        "Nostr protocol",
        "Nostr WoT"
    ]
};

const bootOnce = cache(async () => {
    startBitcoinVenueCron();      // Schedule recurring task
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
    await bootOnce();

    try {
        const { locale } = await params;

        if (!hasLocale(routing.locales, locale)) {
            console.error(`[LocaleLayout] Invalid locale received: "${locale}"`);
            notFound();
        }

        // Load only global namespaces used in the layout components
        const allMessages = await getMessages({ locale });

        return (
          <NextIntlClientProvider locale={locale} messages={allMessages}>
            <NostrAuthProvider>
              <Script
                id="organization-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
              />
              <Toaster
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: '#1A1A1A',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  },
                  success: {
                    iconTheme: {
                      primary: '#f7931a',
                      secondary: '#fff',
                    },
                  },
                }}
              />
              <ClientOnlyAnalytics />
              <BodyLockManager />
              <NavBar />
              <main id="main-content" className="w-full flex flex-col">
                <Suspense>
                  <PageTransition>{children}</PageTransition>
                </Suspense>
              </main>
              <Footer />
              <CookieNotice />
            </NostrAuthProvider>
          </NextIntlClientProvider>
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("[LocaleLayout] Unexpected error:", error);

        return (
          <section style={{ padding: "2rem" }}>
            <h1>💥 Locale Layout Error</h1>
            <p>{error?.message || "Unknown error"}</p>
            <p>{"Contact support at satoshi@mappingbitcoin.com"}</p>
            <pre style={{ whiteSpace: "pre-wrap" }}>{error?.stack}</pre>
          </section>
        );
    }
}

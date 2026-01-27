import React, { cache, Suspense } from "react";

import { Footer, NavBar, PageTransition } from "@/components/layout";
import { ClientOnlyAnalytics, CookieNotice } from "@/components/common";
import { NostrAuthProvider } from "@/contexts/NostrAuthContext";

import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { startBitcoinVenueCron } from "@/utils/sync/CronJob";
import { getMessages } from "next-intl/server";

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
              <ClientOnlyAnalytics />
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

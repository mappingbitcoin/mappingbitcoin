import type { Metadata, Viewport } from "next";
import { Oswald } from "next/font/google";
import React from "react";

import { routing } from "@/i18n/routing";
import { publicEnv } from "@/lib/Environment";
import { getLocale } from "next-intl/server";

import "@/app/globals.css";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let lang: string = routing.defaultLocale;
  try {
    const locale = await getLocale();
    if (routing.locales.includes(locale as (typeof routing.locales)[number])) {
      lang = locale;
    }
  } catch {
    // Fallback to default locale for non-locale pages (404, sitemap, etc.)
  }

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={oswald.variable}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[10000] focus:bg-accent focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:outline-none">
            Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}

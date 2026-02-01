import type { Metadata, Viewport } from "next";
import { Oswald } from "next/font/google";
import React from "react";

import { routing } from "@/i18n/routing";
import { publicEnv } from "@/lib/Environment";

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

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale?: string };
}) {
  const locale = params?.locale;
  const lang = locale && routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale;

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={oswald.variable}>{children}</body>
    </html>
  );
}

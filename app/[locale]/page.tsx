import React from "react";
import { buildGeneratePageMetadata } from "@/utils/SEOUtils";
import { Localized } from "@/i18n/types";
import { getTranslations } from "next-intl/server";
import Script from "next/script";
import Link from "next/link";
import fs from "fs/promises";
import path from "path";
import TopographicPattern from "@/components/ui/TopographicPattern";
import { NewsletterCTA, FAQSection } from "@/components/common";
import HomeStatsSection from "./HomeStatsSection";

export const generateMetadata = buildGeneratePageMetadata('home')

interface StatsData {
    totalVenues: number;
    countries: number;
    continents: number;
    verifiedBusinesses: number;
    regions: { name: string; count: number }[];
    topCountries: { code: string; name: string; flag: string; count: number; slug: string }[];
}

async function getStats(): Promise<StatsData> {
    try {
        const filePath = path.join(process.cwd(), "public", "data", "stats.json");
        const raw = await fs.readFile(filePath, "utf8");
        return JSON.parse(raw);
    } catch {
        // Fallback data if file doesn't exist
        return {
            totalVenues: 21000,
            countries: 150,
            continents: 6,
            verifiedBusinesses: 0,
            regions: [
                { name: "Europe", count: 7371 },
                { name: "North America", count: 7027 },
                { name: "South America", count: 3076 },
                { name: "Africa", count: 2108 },
                { name: "Asia", count: 1573 },
                { name: "Oceania", count: 320 },
            ],
            topCountries: [
                { code: "US", name: "United States", flag: "🇺🇸", count: 3215, slug: "united-states-of-america" },
                { code: "BR", name: "Brazil", flag: "🇧🇷", count: 2284, slug: "brazil" },
                { code: "ZA", name: "South Africa", flag: "🇿🇦", count: 1588, slug: "south-africa" },
                { code: "SV", name: "El Salvador", flag: "🇸🇻", count: 1515, slug: "el-salvador" },
                { code: "CZ", name: "Czech Republic", flag: "🇨🇿", count: 1133, slug: "czech-republic" },
                { code: "IT", name: "Italy", flag: "🇮🇹", count: 1111, slug: "italy" },
            ],
        };
    }
}

function formatNumber(num: number | undefined): string {
    return (num ?? 0).toLocaleString();
}

const HomePage = async ({ params }: Localized) => {
    const { locale } = await params;
    const stats = await getStats();
    const t = await getTranslations({ locale, namespace: "home" });

    // How it works features from translations
    const features = [
        {
            title: t("howItWorks.features.openData.title"),
            description: t("howItWorks.features.openData.description"),
        },
        {
            title: t("howItWorks.features.communityDriven.title"),
            description: t("howItWorks.features.communityDriven.description"),
        },
        {
            title: t("howItWorks.features.verifiablePlaces.title"),
            description: t("howItWorks.features.verifiablePlaces.description"),
        },
        {
            title: t("howItWorks.features.alwaysCurrent.title"),
            description: t("howItWorks.features.alwaysCurrent.description"),
        },
    ];

    return (
        <>
            <Script
                id="website-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        "name": "MappingBitcoin.com",
                        "url": "https://mappingbitcoin.com/",
                        "description": "Discover Bitcoin-accepting merchants worldwide. Interactive map with 21,000+ venues across 150+ countries.",
                        "potentialAction": {
                            "@type": "SearchAction",
                            "target": {
                                "@type": "EntryPoint",
                                "urlTemplate": "https://mappingbitcoin.com/map?search={search_term_string}"
                            },
                            "query-input": "required name=search_term_string"
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
                            }
                        ]
                    })
                }}
            />

            <main className="bg-[#0D0D0D] min-h-screen">
                {/* Section 1: Hero */}
                <section className="min-h-[90vh] flex items-center justify-center px-6 relative overflow-hidden">
                    {/* Subtle gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A1A] via-[#0D0D0D] to-[#0D0D0D]" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/5 via-transparent to-transparent" />

                    {/* Animated topographic pattern */}
                    <TopographicPattern className="z-0" lineCount={14} baseColor="orange" />

                    <div className="relative z-10 text-center max-w-4xl mx-auto mt-20">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                            {t("hero.title")}
                        </h1>
                        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                            {t("hero.description", { venues: formatNumber(stats.totalVenues), continents: stats.continents })}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                            <Link
                                href="/map"
                                className="inline-flex items-center justify-center px-8 py-4 bg-orange-500/10 border border-orange-500 hover:bg-orange-500/20 text-white font-semibold rounded-lg transition-colors"
                            >
                                {t("hero.cta.primary")}
                            </Link>
                            <Link
                                href="/countries"
                                className="inline-flex items-center justify-center px-8 py-4 border border-white/30 hover:border-white/60 text-white font-semibold rounded-lg transition-colors"
                            >
                                {t("hero.cta.secondary")}
                            </Link>
                        </div>

                        {/* Powered by */}
                        <div className="mt-14 flex flex-col items-center justify-center gap-2 text-gray-500">
                            <span className="text-sm">{t("hero.poweredBy")}</span>
                            <div className="flex items-center gap-5">
                                <a
                                    href="https://www.openstreetmap.org"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-4 text-gray-400 hover:text-white transition-colors group"
                                >
                                    <img
                                        src="/assets/icons/osm.svg"
                                        alt="OpenStreetMap"
                                        className="w-5 h-5 opacity-32 group-hover:opacity-100 transition-opacity"
                                    />
                                    <span className="text-sm font-medium">OpenStreetMap</span>
                                </a>
                                <span className="text-gray-600">+</span>
                                <a
                                    href="https://nostr.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-0 text-gray-400 hover:text-purple-400 transition-colors group -ml-4"
                                >
                                    <span
                                        className="w-11 h-11 opacity-60 group-hover:opacity-100 transition-all bg-current"
                                        style={{
                                            maskImage: 'url(/assets/icons/nostr.svg)',
                                            WebkitMaskImage: 'url(/assets/icons/nostr.svg)',
                                            maskSize: 'contain',
                                            WebkitMaskSize: 'contain',
                                            maskRepeat: 'no-repeat',
                                            WebkitMaskRepeat: 'no-repeat',
                                            maskPosition: 'center',
                                            WebkitMaskPosition: 'center',
                                        }}
                                        aria-hidden="true"
                                    />
                                    <span className="text-sm font-medium">Nostr</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: Stats Bar */}
                <HomeStatsSection
                    totalVenues={stats.totalVenues}
                    countries={stats.countries}
                    continents={stats.continents}
                    verifiedBusinesses={stats.verifiedBusinesses}
                />

                {/* Section 3: Own a Bitcoin Business */}
                <section className="py-16 md:py-24 px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
                                    {t("ownBusiness.title")}
                                </h2>
                                <p className="text-gray-400 mb-6">
                                    {t("ownBusiness.description")}
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <Link
                                        href="/verify-your-business"
                                        className="inline-flex items-center justify-center px-6 py-3 bg-orange-500/10 border border-orange-500 hover:bg-orange-500/20 text-white font-semibold rounded-lg transition-colors"
                                    >
                                        {t("ownBusiness.verifyLink")}
                                    </Link>
                                    <Link
                                        href="/places/create"
                                        className="inline-flex items-center justify-center px-6 py-3 border border-white/30 hover:border-white/60 text-white font-semibold rounded-lg transition-colors"
                                    >
                                        {t("ownBusiness.cta")}
                                    </Link>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-[#1A1A1A] border border-white/10 rounded-xl">
                                    <div className="w-10 h-10 mb-3 rounded-full bg-green-500/10 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-white font-semibold mb-1">{t("ownBusiness.benefits.verified.title")}</h3>
                                    <p className="text-gray-400 text-sm">{t("ownBusiness.benefits.verified.description")}</p>
                                </div>
                                <div className="p-5 bg-[#1A1A1A] border border-white/10 rounded-xl">
                                    <div className="w-10 h-10 mb-3 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-white font-semibold mb-1">{t("ownBusiness.benefits.edit.title")}</h3>
                                    <p className="text-gray-400 text-sm">{t("ownBusiness.benefits.edit.description")}</p>
                                </div>
                                <div className="p-5 bg-[#1A1A1A] border border-white/10 rounded-xl">
                                    <div className="w-10 h-10 mb-3 rounded-full bg-purple-500/10 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-white font-semibold mb-1">{t("ownBusiness.benefits.reviews.title")}</h3>
                                    <p className="text-gray-400 text-sm">{t("ownBusiness.benefits.reviews.description")}</p>
                                </div>
                                <div className="p-5 bg-[#1A1A1A] border border-white/10 rounded-xl">
                                    <div className="w-10 h-10 mb-3 rounded-full bg-orange-500/10 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-white font-semibold mb-1">{t("ownBusiness.benefits.secure.title")}</h3>
                                    <p className="text-gray-400 text-sm">{t("ownBusiness.benefits.secure.description")}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 4: How It Works */}
                <section className="py-16 md:py-24 px-6 bg-[#111111]">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-10 text-center">
                            {t("howItWorks.title")}
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {features.map((feature, index) => (
                                <div key={index} className="text-center p-6">
                                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-orange-500/10 flex items-center justify-center">
                                        <span className="text-orange-500 font-bold text-lg">{index + 1}</span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-3">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-400">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Section 5: Browse by Region */}
                <section className="py-16 md:py-24 px-6">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-10 text-center">
                            {t("regions.title")}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stats.regions.map((region, index) => (
                                <Link
                                    key={index}
                                    href="/countries"
                                    className="group flex items-center justify-between p-6 bg-[#1A1A1A] border border-white/10 rounded-xl hover:border-orange-500/50 transition-all"
                                >
                                    <div>
                                        <div className="text-lg font-semibold text-white group-hover:text-orange-500 transition-colors">
                                            {region.name}
                                        </div>
                                        <div className="text-sm text-gray-400">
                                            {formatNumber(region.count)} {t("topCountries.venues")}
                                        </div>
                                    </div>
                                    <svg
                                        className="w-5 h-5 text-gray-500 group-hover:text-orange-500 group-hover:translate-x-1 transition-all"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Section 6: Featured Countries */}
                <section className="py-16 md:py-24 px-6 bg-[#111111]">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-10 text-center">
                            {t("topCountries.title")}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {stats.topCountries.slice(0, 6).map((country, index) => (
                                <Link
                                    key={index}
                                    href={`/bitcoin-shops-in-${country.slug}`}
                                    className="group flex items-center gap-4 p-6 bg-[#1A1A1A] border border-white/10 rounded-xl hover:border-orange-500/50 transition-all"
                                >
                                    <span className="text-4xl">{country.flag}</span>
                                    <div className="flex-1">
                                        <div className="text-lg font-semibold text-white group-hover:text-orange-500 transition-colors">
                                            {country.name}
                                        </div>
                                        <div className="text-sm text-gray-400">
                                            {formatNumber(country.count)} {t("topCountries.venues")}
                                        </div>
                                    </div>
                                    <svg
                                        className="w-5 h-5 text-gray-500 group-hover:text-orange-500 group-hover:translate-x-1 transition-all"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Section 7: FAQ */}
                <FAQSection translationKey="home.faq" />

                {/* Section 8: Newsletter CTA */}
                <NewsletterCTA />
            </main>
        </>
    );
};

export default HomePage;

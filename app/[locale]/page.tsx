import React from "react";
import { buildGeneratePageMetadata } from "@/utils/SEOUtils";
import { Localized } from "@/i18n/types";
import { generateCanonical } from "@/i18n/seo";
import Script from "next/script";
import Link from "next/link";
import fs from "fs/promises";
import path from "path";

export const generateMetadata = buildGeneratePageMetadata('home')

interface StatsData {
    totalVenues: number;
    countries: number;
    continents: number;
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

function formatNumber(num: number): string {
    return num.toLocaleString();
}

// How it works data
const features = [
    {
        title: "Open data",
        description: "Built on OpenStreetMap. Transparent and verifiable.",
    },
    {
        title: "Community driven",
        description: "Anyone can add venues. Real user reviews.",
    },
    {
        title: "Always current",
        description: "Continuous updates. Moderated submissions.",
    },
];

const HomePage = async ({ params }: Localized) => {
    const { locale } = await params;
    const stats = await getStats();

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

                    <div className="relative z-10 text-center max-w-4xl mx-auto">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                            The Bitcoin Economy, Mapped
                        </h1>
                        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                            {formatNumber(stats.totalVenues)}+ venues across {stats.continents} continents. Find where Bitcoin works.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/map"
                                className="inline-flex items-center justify-center px-8 py-4 bg-orange-500/10 border border-orange-500 hover:bg-orange-500/20 text-white font-semibold rounded-lg transition-colors"
                            >
                                Explore map
                            </Link>
                            <Link
                                href="/countries"
                                className="inline-flex items-center justify-center px-8 py-4 border border-white/30 hover:border-white/60 text-white font-semibold rounded-lg transition-colors"
                            >
                                Browse directory
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Section 2: Stats Bar */}
                <section className="py-12 border-y border-white/10 bg-[#111111]">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
                            <div className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                                    {formatNumber(stats.totalVenues)}+
                                </div>
                                <div className="text-sm md:text-base text-gray-400">Venues</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                                    {stats.countries}+
                                </div>
                                <div className="text-sm md:text-base text-gray-400">Countries</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                                    {stats.continents}
                                </div>
                                <div className="text-sm md:text-base text-gray-400">Continents</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                                    Open
                                </div>
                                <div className="text-sm md:text-base text-gray-400">Source</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 3: Browse by Region */}
                <section className="py-16 md:py-24 px-6">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-10 text-center">
                            Explore by region
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
                                            {formatNumber(region.count)} venues
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

                {/* Section 4: Featured Countries */}
                <section className="py-16 md:py-24 px-6 bg-[#111111]">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-10 text-center">
                            Top Bitcoin countries
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
                                            {formatNumber(country.count)} venues
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

                {/* Section 5: How It Works */}
                <section className="py-16 md:py-24 px-6">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-10 text-center">
                            How it works
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

                {/* Section 6: Add Business CTA */}
                <section className="py-16 md:py-24 px-6 bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-orange-500/10 border-y border-orange-500/20">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
                            Accept Bitcoin? Get on the map.
                        </h2>
                        <p className="text-gray-400 mb-8">
                            Join {formatNumber(stats.totalVenues)}+ venues worldwide. Free listing.
                        </p>
                        <Link
                            href="/places/create"
                            className="inline-flex items-center justify-center px-8 py-4 bg-orange-500/10 border border-orange-500 hover:bg-orange-500/20 text-white font-semibold rounded-lg transition-colors"
                        >
                            Add your venue
                        </Link>
                    </div>
                </section>
            </main>
        </>
    );
};

export default HomePage;

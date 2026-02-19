import React from "react";
import { buildGeneratePageMetadata } from "@/utils/SEOUtils";
import { Localized } from "@/i18n/types";
import { getTranslations } from "next-intl/server";
import Script from "next/script";
import fs from "fs/promises";
import path from "path";
import TopographicPattern from "@/components/ui/TopographicPattern";
import { NewsletterCTA, FAQSection } from "@/components/common";
import HomeStatsSection from "./HomeStatsSection";
import {
    HeroSection,
    OwnBusinessSection,
    HowItWorksSection,
    RegionsSection,
    TopCountriesSection,
} from "./HomeAnimatedSections";
import { PoweredBySection } from "./HomePoweredBy";
import { WotIntegrationSection } from "./HomeWotSection";
import { CommunitySection } from "./HomeCommunitySection";

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
                        "@id": "https://mappingbitcoin.com/#website",
                        "name": "Mapping Bitcoin",
                        "url": "https://mappingbitcoin.com/",
                        "description": "Find places that accept Bitcoin worldwide. Open-source, community-driven map of merchants accepting Bitcoin and Lightning payments.",
                        "publisher": {
                            "@id": "https://mappingbitcoin.com/#organization"
                        },
                        "potentialAction": {
                            "@type": "SearchAction",
                            "target": {
                                "@type": "EntryPoint",
                                "urlTemplate": "https://mappingbitcoin.com/map?q={search_term_string}"
                            },
                            "query-input": "required name=search_term_string",
                            "description": "Search for Bitcoin-accepting venues, cities, or countries"
                        },
                        "inLanguage": ["en", "es"]
                    })
                }}
            />
            <Script
                id="search-results-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "ItemList",
                        "name": "Bitcoin Merchant Search Examples",
                        "description": "Examples of searchable content on Mapping Bitcoin",
                        "itemListElement": [
                            {
                                "@type": "ListItem",
                                "position": 1,
                                "name": "Search by Venue Name",
                                "description": "Find specific Bitcoin-accepting businesses by name",
                                "url": "https://mappingbitcoin.com/places/",
                                "item": {
                                    "@type": "LocalBusiness",
                                    "name": "Bitcoin-accepting venues",
                                    "description": "Restaurants, cafes, shops, hotels and more accepting Bitcoin payments"
                                }
                            },
                            {
                                "@type": "ListItem",
                                "position": 2,
                                "name": "Search by City",
                                "description": "Browse all Bitcoin merchants in a specific city",
                                "url": "https://mappingbitcoin.com/bitcoin-shops-in-rome-italy",
                                "item": {
                                    "@type": "City",
                                    "name": "Cities with Bitcoin merchants",
                                    "description": "Find Bitcoin-accepting businesses grouped by city"
                                }
                            },
                            {
                                "@type": "ListItem",
                                "position": 3,
                                "name": "Search by Country",
                                "description": "Explore all Bitcoin merchants in a country",
                                "url": "https://mappingbitcoin.com/bitcoin-shops-in-italy",
                                "item": {
                                    "@type": "Country",
                                    "name": "Countries with Bitcoin merchants",
                                    "description": "Browse Bitcoin-accepting businesses by country"
                                }
                            },
                            {
                                "@type": "ListItem",
                                "position": 4,
                                "name": "Search by Category",
                                "description": "Find Bitcoin merchants by business type",
                                "url": "https://mappingbitcoin.com/bitcoin-restaurants-in-italy",
                                "item": {
                                    "@type": "Thing",
                                    "name": "Business categories",
                                    "description": "Restaurants, cafes, hotels, shops, ATMs and more"
                                }
                            }
                        ],
                        "numberOfItems": 4
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
                <HeroSection
                    title={t("hero.title")}
                    description={t("hero.description", { venues: formatNumber(stats.totalVenues), continents: stats.continents })}
                    ctaPrimary={t("hero.cta.primary")}
                    ctaSecondary={t("hero.cta.secondary")}
                    pattern={<TopographicPattern className="z-0" lineCount={14} baseColor="orange" />}
                    poweredBySection={<PoweredBySection label={t("hero.poweredBy")} />}
                />

                {/* Section 2: Stats Bar */}
                <HomeStatsSection
                    totalVenues={stats.totalVenues}
                    countries={stats.countries}
                    continents={stats.continents}
                    verifiedBusinesses={stats.verifiedBusinesses}
                />

                {/* Section 3: Own a Bitcoin Business */}
                <OwnBusinessSection
                    title={t("ownBusiness.title")}
                    description={t("ownBusiness.description")}
                    verifyLink={t("ownBusiness.verifyLink")}
                    cta={t("ownBusiness.cta")}
                    benefits={{
                        verified: {
                            title: t("ownBusiness.benefits.verified.title"),
                            description: t("ownBusiness.benefits.verified.description"),
                        },
                        edit: {
                            title: t("ownBusiness.benefits.edit.title"),
                            description: t("ownBusiness.benefits.edit.description"),
                        },
                        reviews: {
                            title: t("ownBusiness.benefits.reviews.title"),
                            description: t("ownBusiness.benefits.reviews.description"),
                        },
                        secure: {
                            title: t("ownBusiness.benefits.secure.title"),
                            description: t("ownBusiness.benefits.secure.description"),
                        },
                    }}
                />

                {/* Section 4: Community - Reviews & Ratings */}
                <CommunitySection
                    title={t("community.title")}
                    description={t("community.description")}
                    features={{
                        reviews: {
                            title: t("community.features.reviews.title"),
                            description: t("community.features.reviews.description"),
                        },
                        ratings: {
                            title: t("community.features.ratings.title"),
                            description: t("community.features.ratings.description"),
                        },
                        photos: {
                            title: t("community.features.photos.title"),
                            description: t("community.features.photos.description"),
                        },
                        navigate: {
                            title: t("community.features.navigate.title"),
                            description: t("community.features.navigate.description"),
                        },
                    }}
                    cta={{
                        explore: t("community.cta.explore"),
                        docs: t("community.cta.docs"),
                    }}
                />

                {/* Section 5: How It Works */}
                <HowItWorksSection
                    title={t("howItWorks.title")}
                    features={features}
                />

                {/* Section 6: Browse by Region */}
                <RegionsSection
                    title={t("regions.title")}
                    venuesLabel={t("topCountries.venues")}
                    regions={stats.regions}
                />

                {/* Section 7: Featured Countries */}
                <TopCountriesSection
                    title={t("topCountries.title")}
                    venuesLabel={t("topCountries.venues")}
                    countries={stats.topCountries}
                />

                {/* Section 8: Web of Trust Integration */}
                <WotIntegrationSection
                    title={t("wotIntegration.title")}
                    description={t("wotIntegration.description")}
                    features={{
                        trust: {
                            title: t("wotIntegration.features.trust.title"),
                            description: t("wotIntegration.features.trust.description"),
                        },
                        transparency: {
                            title: t("wotIntegration.features.transparency.title"),
                            description: t("wotIntegration.features.transparency.description"),
                        },
                        spam: {
                            title: t("wotIntegration.features.spam.title"),
                            description: t("wotIntegration.features.spam.description"),
                        },
                    }}
                    cta={{
                        install: t("wotIntegration.cta.install"),
                        learnMore: t("wotIntegration.cta.learnMore"),
                    }}
                />

                {/* Section 9: FAQ */}
                <FAQSection translationKey="home.faq" />

                {/* Section 10: Newsletter CTA */}
                <NewsletterCTA />
            </main>
        </>
    );
};

export default HomePage;

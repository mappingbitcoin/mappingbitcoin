"use client"

import { useState } from "react"
import { Link } from "@/i18n/navigation"
import { useLocale, useTranslations } from "next-intl"
import { getLocalizedCountrySlug } from "@/utils/SlugUtils"
import { Locale } from "@/i18n/types"
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { getContinentName } from '@brixtol/country-continent';
import { getLocalizedCountryName } from "@/utils/CountryUtils";
import { Place } from "@/models/Place";
import { FAQSection, NewsletterCTA } from "@/components/common";
import TabButton from "@/components/ui/TabButton";
import Image from 'next/image'

interface RegionData {
    region: string;
    countries: { code: string; count: number }[];
    totalCount: number;
}

export default function CountriesPage({ countries }: { countries: Record<string, Place> }) {
    const locale = useLocale() as Locale
    const t = useTranslations("countries")

    // Process countries into regions
    const regions: Record<string, { code: string, count: number }[]> = {};
    const processCountries = Object.values(countries)

    for (let i = 0; i < processCountries.length; i++) {
        const country = processCountries[i]
        const continent: string = getContinentName(country.label);
        if (!regions[continent]) regions[continent] = [];
        regions[continent].push({
            code: country.label,
            count: country.count
        });
    }

    // Create sorted output with total counts
    const output: RegionData[] = Object.entries(regions)
        .map(([region, countries]) => ({
            region,
            countries: countries.sort((a, b) => b.count - a.count),
            totalCount: countries.reduce((sum, c) => sum + c.count, 0)
        }))
        .sort((a, b) => b.totalCount - a.totalCount);

    const [activeTab, setActiveTab] = useState(output[0]?.region || "");

    const activeRegion = output.find(r => r.region === activeTab);

    return (
        <section className="w-full py-20 px-6 md:px-8 bg-primary min-h-screen">
            <div className="max-w-container mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold mb-4 text-white">{t("title")}</h1>
                    <p className="text-lg text-text-light max-w-[700px]">{t("description")}</p>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-8 border-b border-border pb-0">
                    {output.map(({ region, totalCount }) => (
                        <TabButton
                            key={region}
                            active={activeTab === region}
                            onClick={() => setActiveTab(region)}
                            className="flex-none px-5 text-[15px] flex items-center gap-2"
                        >
                            {region}
                            <span className={`py-0.5 px-2 rounded-xl text-[13px] font-semibold ${
                                activeTab === region
                                    ? 'bg-accent/20 text-accent'
                                    : 'bg-surface text-text-light'
                            }`}>
                                {totalCount.toLocaleString()}
                            </span>
                        </TabButton>
                    ))}
                </div>

                {/* Countries Grid */}
                {activeRegion && (
                    <div className="flex flex-wrap gap-3">
                        {activeRegion.countries.map(({ code, count }) => {
                            const countryName = getLocalizedCountryName(locale, code)
                            if (!countryName) return null
                            const localizedSlug = getLocalizedCountrySlug(countryName, locale)

                            const content = (
                                <>
                                    <Image
                                        src={`https://cdn.jsdelivr.net/npm/react-world-flags@1.6.0/src/svgs/${code.toLowerCase()}.svg`}
                                        alt={`Flag of ${countryName}`}
                                        width={24}
                                        height={16}
                                        className="rounded-sm"
                                    />
                                    <span>{countryName}</span>
                                    {count > 0 && (
                                        <span className="text-text-light text-sm">({count})</span>
                                    )}
                                </>
                            )

                            return count > 0 ? (
                                <Link
                                    key={localizedSlug}
                                    href={`/${localizedSlug}`}
                                    className="bg-surface py-3 px-4 rounded-lg flex items-center gap-2.5 border border-border-light transition-all duration-200 no-underline text-white text-[15px] hover:border-accent/50 hover:bg-surface-light"
                                >
                                    {content}
                                </Link>
                            ) : (
                                <div key={code} className="bg-surface py-3 px-4 rounded-lg flex items-center gap-2.5 border border-border-light no-underline text-white text-[15px] opacity-40 cursor-default">
                                    {content}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* FAQ */}
                <div className="mt-16">
                    <FAQSection
                        translationKey="countries.countriesFaq"
                        substitutions={{}}
                    />
                </div>

                {/* Newsletter */}
                <NewsletterCTA />
            </div>
        </section>
    )
}

"use client";

import { Counter } from "@/components/ui/Animations";
import { useTranslations } from "next-intl";

interface HomeStatsSectionProps {
    totalVenues: number;
    countries: number;
    continents: number;
    verifiedBusinesses: number;
}

export default function HomeStatsSection({
    totalVenues,
    countries,
    continents,
    verifiedBusinesses,
}: HomeStatsSectionProps) {
    const t = useTranslations("home");

    return (
        <section className="py-12 border-y border-white/10 bg-[#111111]">
            <div className="max-w-6xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
                    <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                            <Counter to={totalVenues} duration={2} suffix="+" />
                        </div>
                        <div className="text-sm md:text-base text-gray-400">{t("stats.venues")}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                            <Counter to={countries} duration={2} suffix="+" />
                        </div>
                        <div className="text-sm md:text-base text-gray-400">{t("stats.countries")}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                            <Counter to={continents} duration={1.5} />
                        </div>
                        <div className="text-sm md:text-base text-gray-400">{t("stats.continents")}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                            <Counter to={verifiedBusinesses} duration={2} />
                        </div>
                        <div className="text-sm md:text-base text-gray-400">{t("stats.verifiedBusinesses")}</div>
                    </div>
                </div>
            </div>
        </section>
    );
}

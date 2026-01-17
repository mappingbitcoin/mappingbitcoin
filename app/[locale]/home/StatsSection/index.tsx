"use client";

import { PageSection } from "@/components/layout";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import StatCard from "./StatCard";
import useSWR from "swr";

interface Stats {
    totalVenues: number;
    newThisMonth: number;
    countries: number;
    growthPercent: number;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

const StatsSection = () => {
    const t = useTranslations("home.stats");
    const { data: stats } = useSWR<Stats>("/api/stats", fetcher, {
        fallbackData: {
            totalVenues: 15000,
            newThisMonth: 120,
            countries: 75,
            growthPercent: 12,
        },
        revalidateOnFocus: false,
    });

    return (
        <PageSection background="gradient-transparent">
            <motion.div
                className="text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
            >
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    {t("title")}
                </h2>
                <p className="text-white/70 text-lg max-w-[600px] mx-auto">
                    {t("description")}
                </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <StatCard
                    value={stats?.totalVenues ?? 15000}
                    label={t("totalVenues")}
                    prefix=""
                    suffix="+"
                    accent="orange"
                    delay={0}
                />
                <StatCard
                    value={stats?.newThisMonth ?? 120}
                    label={t("newThisMonth")}
                    prefix="+"
                    suffix=""
                    accent="green"
                    delay={0.1}
                />
                <StatCard
                    value={stats?.countries ?? 75}
                    label={t("countries")}
                    prefix=""
                    suffix=""
                    accent="orange"
                    delay={0.2}
                />
                <StatCard
                    value={stats?.growthPercent ?? 12}
                    label={t("growth")}
                    prefix="+"
                    suffix="%"
                    accent="green"
                    delay={0.3}
                />
            </div>
        </PageSection>
    );
};

export default StatsSection;

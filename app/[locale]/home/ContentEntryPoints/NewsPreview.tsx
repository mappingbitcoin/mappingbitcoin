"use client";

import { Badge } from "@/components/ui";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

interface NewsCard {
    titleKey: string;
    descriptionKey: string;
}

const news: NewsCard[] = [
    { titleKey: "news1.title", descriptionKey: "news1.description" },
    { titleKey: "news2.title", descriptionKey: "news2.description" },
];

const NewsPreview = () => {
    const t = useTranslations("home.content.news");

    return (
        <motion.div
            className="bg-white rounded-card p-8 shadow-soft border border-success-glow"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
        >
            <Badge text={t("badge")} variant="green" />
            <h3 className="text-2xl font-bold text-text-dark mb-3">
                {t("title")}
            </h3>
            <p className="text-text-light mb-6">
                {t("description")}
            </p>

            <div className="space-y-4 mb-6">
                {news.map((item, index) => (
                    <motion.div
                        key={index}
                        className="p-4 bg-success-subtle rounded-xl border border-transparent hover:border-success/30 transition-all cursor-pointer"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.1 * index }}
                        whileHover={{ x: 4 }}
                    >
                        <h4 className="font-semibold text-text-dark mb-1">
                            {t(item.titleKey)}
                        </h4>
                        <p className="text-sm text-text-light">
                            {t(item.descriptionKey)}
                        </p>
                    </motion.div>
                ))}
            </div>

            <span className="text-success hover:text-success-light font-semibold cursor-pointer transition-colors">
                {t("cta")} &rarr;
            </span>
        </motion.div>
    );
};

export default NewsPreview;

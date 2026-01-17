"use client";

import { PageSection } from "@/components/layout";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import StoriesPreview from "./StoriesPreview";
import NewsPreview from "./NewsPreview";

const ContentEntryPoints = () => {
    const t = useTranslations("home.content");

    return (
        <PageSection background="light-transparent">
            <motion.div
                className="text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
            >
                <h2 className="text-3xl md:text-4xl font-bold text-text-dark mb-4">
                    {t("title")}
                </h2>
                <p className="text-text-light text-lg max-w-[600px] mx-auto">
                    {t("description")}
                </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
                <StoriesPreview />
                <NewsPreview />
            </div>
        </PageSection>
    );
};

export default ContentEntryPoints;

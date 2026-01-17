"use client";

import { Badge } from "@/components/ui";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

interface StoryCard {
    titleKey: string;
    descriptionKey: string;
}

const stories: StoryCard[] = [
    { titleKey: "story1.title", descriptionKey: "story1.description" },
    { titleKey: "story2.title", descriptionKey: "story2.description" },
];

const StoriesPreview = () => {
    const t = useTranslations("home.content.stories");

    return (
        <motion.div
            className="bg-white rounded-card p-8 shadow-soft border border-accent-glow"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
        >
            <Badge text={t("badge")} variant="orange" />
            <h3 className="text-2xl font-bold text-text-dark mb-3">
                {t("title")}
            </h3>
            <p className="text-text-light mb-6">
                {t("description")}
            </p>

            <div className="space-y-4 mb-6">
                {stories.map((story, index) => (
                    <motion.div
                        key={index}
                        className="p-4 bg-accent-subtle rounded-xl border border-transparent hover:border-accent/30 transition-all cursor-pointer"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.1 * index }}
                        whileHover={{ x: 4 }}
                    >
                        <h4 className="font-semibold text-text-dark mb-1">
                            {t(story.titleKey)}
                        </h4>
                        <p className="text-sm text-text-light">
                            {t(story.descriptionKey)}
                        </p>
                    </motion.div>
                ))}
            </div>

            <span className="text-accent hover:text-accent-light font-semibold cursor-pointer transition-colors">
                {t("cta")} &rarr;
            </span>
        </motion.div>
    );
};

export default StoriesPreview;

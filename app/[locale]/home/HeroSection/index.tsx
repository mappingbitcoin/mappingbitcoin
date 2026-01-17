"use client";

import { Button, ButtonSecondary } from "@/components/ui";
import { PageSection } from "@/components/layout";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Image from "next/image";

const HeroSection = () => {
    const t = useTranslations("home.hero");

    return (
        <PageSection className="pt-25" background={"gradient-transparent"}>
            <div className="flex flex-col lg:flex-row gap-12 items-center justify-between">
                {/* Text Content */}
                <motion.div
                    className="flex-1 max-w-160"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <motion.h1
                        className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-white"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        {t.rich("title", {
                            span: (chunks) => <span className="text-gradient-accent">{chunks}</span>,
                        })}
                    </motion.h1>
                    <motion.p
                        className="text-xl font-light mb-8 text-white/80 leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {t("description")}
                    </motion.p>
                    <motion.div
                        className="flex flex-wrap gap-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <Button href="/countries">{t("cta.primary")}</Button>
                        <ButtonSecondary href="/map">{t("cta.secondary")}</ButtonSecondary>
                    </motion.div>
                </motion.div>
            </div>
        </PageSection>
    );
};

export default HeroSection;

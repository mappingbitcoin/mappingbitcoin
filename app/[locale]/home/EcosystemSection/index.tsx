"use client";

import { Button } from "@/components/ui";
import { PageSection } from "@/components/layout";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import Image from "next/image";

const EcosystemSection = () => {
    const t = useTranslations("home.ecosystem");

    return (
        <PageSection background="gradient-transparent">
            <div className="text-center">
                <motion.h2
                    className="text-3xl md:text-4xl font-bold text-white mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    {t.rich("title", {
                        span: (chunks) => <span className="text-gradient-accent">{chunks}</span>,
                    })}
                </motion.h2>
                <motion.p
                    className="text-white/70 text-lg max-w-[700px] mx-auto mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    {t("description")}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <Button href="/map">{t("cta")}</Button>
                </motion.div>
            </div>
        </PageSection>
    );
};

export default EcosystemSection;

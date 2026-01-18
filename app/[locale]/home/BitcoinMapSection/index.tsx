"use client";

import { Button } from "@/components/ui";
import { PageSection } from "@/components/layout";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

const FeatureItem = ({ icon, title, description, index }: { icon: string; title: string; description: string; index: number }) => (
    <motion.li
        className="flex gap-4 items-start"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
    >
        <motion.div
            className="p-2.5 rounded-xl bg-accent-subtle shrink-0"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
        >
            <Image src={icon} alt="" width={24} height={24} />
        </motion.div>
        <div>
            <strong className="text-base text-text-dark block mb-1">{title}</strong>
            <p className="text-sm text-text-light leading-relaxed">{description}</p>
        </div>
    </motion.li>
);

const BitcoinMapSection = () => {
    const t = useTranslations("home.map");

    return (
        <PageSection background="white">
            <div className="flex gap-12 flex-wrap justify-between items-center">
                <motion.div
                    className="flex-1 min-w-[300px] max-w-[560px]"
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <h2 className="text-[32px] font-bold mb-4 text-text-dark">{t("title")}</h2>
                    <p className="text-lg mb-8 text-text-light leading-relaxed">{t("description")}</p>

                    <ul className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(240px,1fr))] mb-10 list-none">
                        <FeatureItem icon="/assets/icons/merchant.svg" title={t("localMerchants.title")} description={t("localMerchants.description")} index={0} />
                        <FeatureItem icon="/assets/icons/atm.svg" title={t("bitcoinAtms.title")} description={t("bitcoinAtms.description")} index={1} />
                        <FeatureItem icon="/assets/icons/star.svg" title={t("reviewsRatings.title")} description={t("reviewsRatings.description")} index={2} />
                        <FeatureItem icon="/assets/icons/notification.svg" title={t("notifications.title")} description={t("notifications.description")} index={3} />
                    </ul>

                    <Button href="/map">{t("button")}</Button>
                </motion.div>

                <motion.div
                    className="flex-1 min-w-[300px] max-w-[500px] relative"
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                >
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <Image
                            src="/assets/opengraph/mapping-bitcoin-preview.webp"
                            alt={t("title")}
                            width={600}
                            height={400}
                            className="w-full shadow-medium rounded-card border border-border"
                        />
                    </motion.div>
                    <motion.div
                        className="absolute bottom-4 right-4 bg-gradient-accent text-white py-3 px-5 rounded-xl text-center font-medium text-sm shadow-accent"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.5, type: "spring" }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <strong className="block text-xl font-bold">{t("badge.count")}</strong>
                        <span>{t("badge.label")}</span>
                    </motion.div>
                </motion.div>
            </div>
        </PageSection>
    );
};

export default BitcoinMapSection;

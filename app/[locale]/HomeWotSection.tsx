"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { NostrWotIcon } from "@/assets/icons/social";
import Image from "next/image";

interface WotSectionProps {
    title: string;
    description: string;
    features: {
        trust: { title: string; description: string };
        transparency: { title: string; description: string };
        spam: { title: string; description: string };
    };
    cta: {
        install: string;
        learnMore: string;
    };
}

export function WotIntegrationSection({ title, description, features, cta }: WotSectionProps) {
    const [hasExtension, setHasExtension] = useState<boolean | null>(null);

    useEffect(() => {
        // Check if nostr-wot extension is installed by looking for injected elements or APIs
        const checkExtension = () => {
            // The extension typically injects a specific element or window property
            const hasWotExtension =
                typeof window !== 'undefined' &&
                (document.querySelector('[data-nostr-wot]') !== null ||
                 (window as unknown as { nostrWot?: unknown }).nostrWot !== undefined);
            setHasExtension(hasWotExtension);
        };

        // Check after a small delay to allow extension to inject
        const timer = setTimeout(checkExtension, 500);
        return () => clearTimeout(timer);
    }, []);

    const featureList = [
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            ),
            ...features.trust,
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            ),
            ...features.transparency,
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
            ),
            ...features.spam,
        },
    ];

    return (
        <section className="relative py-20 px-6 md:px-8 overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/20 to-transparent" />

            <div className="relative max-w-6xl mx-auto">
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <NostrWotIcon className="w-10 h-10 rounded-lg" aria-hidden="true" />
                        <h2 className="text-3xl md:text-4xl font-bold text-white">{title}</h2>
                    </div>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        {description}
                    </p>
                </motion.div>

                {/* Features grid */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {featureList.map((feature, index) => (
                        <motion.div
                            key={index}
                            className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.07] transition-colors"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                                {feature.icon}
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                            <p className="text-gray-400 text-sm">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>

                {/* CTA section */}
                <motion.div
                    className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-8 md:p-10"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="hidden md:block">
                                <Image
                                    src="/images/nostr-wot-logo.svg"
                                    alt="Nostr Web of Trust"
                                    width={64}
                                    height={64}
                                    className="rounded-xl"
                                />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-1">
                                    Nostr Web of Trust Extension
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    Enhance your browsing with trust scores across the Nostr ecosystem
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            {hasExtension === false && (
                                <motion.a
                                    href="https://chromewebstore.google.com/detail/nostr-wot/eepdlplljpnmjgjdpbclopkclkmnagbh"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    {cta.install}
                                </motion.a>
                            )}
                            {hasExtension === true && (
                                <span className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/20 text-green-400 font-medium rounded-lg">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Extension Installed
                                </span>
                            )}
                            <motion.a
                                href="https://nostr-wot.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg border border-white/10 transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {cta.learnMore}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </motion.a>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

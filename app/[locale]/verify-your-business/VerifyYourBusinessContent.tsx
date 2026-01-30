"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FAQSection } from "@/components/common";
import {
    ShieldCheckIcon,
    CheckmarkIcon,
    EditIcon,
    TrendingUpIcon,
    GlobeIcon,
    EmailIcon,
} from "@/assets/icons";

export default function VerifyYourBusinessContent() {
    const t = useTranslations("verify-your-business");

    return (
        <main className="bg-[#0D0D0D] min-h-screen">
            {/* Hero Section */}
            <section className="py-16 md:py-24 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <ShieldCheckIcon className="w-8 h-8 text-orange-500" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        {t("hero.title")}
                    </h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        {t("hero.description")}
                    </p>
                </div>
            </section>

            {/* Why Verify Section */}
            <section className="py-12 px-6 border-t border-white/10">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-semibold text-white mb-8 text-center">
                        {t("whyVerify.title")}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-[#1A1A1A] border border-white/10 rounded-xl">
                            <div className="w-10 h-10 mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                                <CheckmarkIcon className="w-5 h-5 text-green-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">{t("whyVerify.cards.trust.title")}</h3>
                            <p className="text-gray-400 text-sm">
                                {t("whyVerify.cards.trust.description")}
                            </p>
                        </div>
                        <div className="p-6 bg-[#1A1A1A] border border-white/10 rounded-xl">
                            <div className="w-10 h-10 mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <EditIcon className="w-5 h-5 text-blue-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">{t("whyVerify.cards.manage.title")}</h3>
                            <p className="text-gray-400 text-sm">
                                {t("whyVerify.cards.manage.description")}
                            </p>
                        </div>
                        <div className="p-6 bg-[#1A1A1A] border border-white/10 rounded-xl">
                            <div className="w-10 h-10 mb-4 rounded-full bg-orange-500/10 flex items-center justify-center">
                                <TrendingUpIcon className="w-5 h-5 text-orange-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">{t("whyVerify.cards.standOut.title")}</h3>
                            <p className="text-gray-400 text-sm">
                                {t("whyVerify.cards.standOut.description")}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Verification Methods Section */}
            <section className="py-16 px-6 bg-[#111111]">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4 text-center">
                        {t("methods.title")}
                    </h2>
                    <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
                        {t("methods.description")}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Email Verification */}
                        <div className="p-8 bg-[#1A1A1A] border border-white/10 rounded-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <EmailIcon className="w-6 h-6 text-blue-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-white">{t("methods.email.title")}</h3>
                            </div>

                            <p className="text-gray-400 mb-6">
                                {t("methods.email.description")}
                            </p>

                            <div className="space-y-4 mb-6">
                                <h4 className="text-sm font-semibold text-white uppercase tracking-wide">{t("methods.email.requirements")}</h4>
                                <ul className="space-y-2 text-gray-400 text-sm">
                                    <li className="flex items-start gap-2">
                                        <CheckmarkIcon className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                        {t("methods.email.req1")}
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckmarkIcon className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                        {t("methods.email.req2")}
                                    </li>
                                </ul>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-white uppercase tracking-wide">{t("methods.email.howItWorks")}</h4>
                                <ol className="space-y-3 text-gray-400 text-sm">
                                    <li className="flex items-start gap-3">
                                        <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-semibold shrink-0">1</span>
                                        {t("methods.email.step1")}
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-semibold shrink-0">2</span>
                                        {t("methods.email.step2")}
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-semibold shrink-0">3</span>
                                        {t("methods.email.step3")}
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-semibold shrink-0">4</span>
                                        {t("methods.email.step4")}
                                    </li>
                                </ol>
                            </div>
                        </div>

                        {/* Domain Verification */}
                        <div className="p-8 bg-[#1A1A1A] border border-white/10 rounded-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                                    <GlobeIcon className="w-6 h-6 text-orange-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-white">{t("methods.domain.title")}</h3>
                            </div>

                            <p className="text-gray-400 mb-6">
                                {t("methods.domain.description")}
                            </p>

                            <div className="space-y-4 mb-6">
                                <h4 className="text-sm font-semibold text-white uppercase tracking-wide">{t("methods.domain.requirements")}</h4>
                                <ul className="space-y-2 text-gray-400 text-sm">
                                    <li className="flex items-start gap-2">
                                        <CheckmarkIcon className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                        {t("methods.domain.req1")}
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckmarkIcon className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                        {t("methods.domain.req2")}
                                    </li>
                                </ul>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-white uppercase tracking-wide">{t("methods.domain.howItWorks")}</h4>
                                <ol className="space-y-3 text-gray-400 text-sm">
                                    <li className="flex items-start gap-3">
                                        <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-semibold shrink-0">1</span>
                                        {t("methods.domain.step1")}
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-semibold shrink-0">2</span>
                                        {t("methods.domain.step2")}
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-semibold shrink-0">3</span>
                                        {t("methods.domain.step3")}
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-semibold shrink-0">4</span>
                                        {t("methods.domain.step4")}
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-semibold shrink-0">5</span>
                                        {t("methods.domain.step5")}
                                    </li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Transparency Section */}
            <section className="py-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-semibold text-white mb-8 text-center">
                        {t("transparency.title")}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-[#1A1A1A] border border-white/10 rounded-xl">
                            <h3 className="text-lg font-semibold text-white mb-3">{t("transparency.cards.openSource.title")}</h3>
                            <p className="text-gray-400 text-sm">
                                {t("transparency.cards.openSource.description")}
                            </p>
                        </div>
                        <div className="p-6 bg-[#1A1A1A] border border-white/10 rounded-xl">
                            <h3 className="text-lg font-semibold text-white mb-3">{t("transparency.cards.decentralized.title")}</h3>
                            <p className="text-gray-400 text-sm">
                                {t("transparency.cards.decentralized.description")}
                            </p>
                        </div>
                        <div className="p-6 bg-[#1A1A1A] border border-white/10 rounded-xl">
                            <h3 className="text-lg font-semibold text-white mb-3">{t("transparency.cards.noAuthority.title")}</h3>
                            <p className="text-gray-400 text-sm">
                                {t("transparency.cards.noAuthority.description")}
                            </p>
                        </div>
                        <div className="p-6 bg-[#1A1A1A] border border-white/10 rounded-xl">
                            <h3 className="text-lg font-semibold text-white mb-3">{t("transparency.cards.cryptographic.title")}</h3>
                            <p className="text-gray-400 text-sm">
                                {t("transparency.cards.cryptographic.description")}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <FAQSection translationKey="verify-your-business.faq" />

            {/* CTA Section */}
            <section className="py-16 md:py-24 px-6 bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-orange-500/10 border-y border-orange-500/20">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
                        {t("cta.title")}
                    </h2>
                    <p className="text-gray-400 mb-8">
                        {t("cta.description")}
                    </p>
                    <Link
                        href="/map"
                        className="inline-flex items-center justify-center px-8 py-4 bg-orange-500/10 border border-orange-500 hover:bg-orange-500/20 text-white font-semibold rounded-lg transition-colors"
                    >
                        {t("cta.button")}
                    </Link>
                </div>
            </section>
        </main>
    );
}

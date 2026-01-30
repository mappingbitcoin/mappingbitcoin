"use client"

import React from "react";
import {Link, usePathname} from '@/i18n/navigation';
import Image from "next/image";
import {useTranslations} from "next-intl";
import { CookieSettingsButton } from "@/components/common";
import {routing} from "@/i18n/routing";
import {Locale} from "@/i18n/types";
import { motion } from "framer-motion";
import { LinkedInIcon, FacebookIcon, InstagramIcon, TwitterIcon } from "@/assets/icons/social";
import { ComponentType } from "react";
import { IconProps } from "@/assets/icons/types";

const Footer = () => {
    const t = useTranslations("footer");
    const pathname = usePathname() || "";

    const segments = pathname.split("/").filter(Boolean);

    const isBtcMap =
        (segments.length === 1 && segments[0] === "map") ||
        (segments.length === 2 && routing.locales.includes(segments[0] as Locale) && segments[1] === "map");

    if (isBtcMap) return null;

    const socialLinks: { href: string; label: string; Icon: ComponentType<IconProps> }[] = [
        { href: "https://www.linkedin.com/company/mappingbitcoin/", label: "LinkedIn", Icon: LinkedInIcon },
        { href: "https://www.facebook.com/mappingbitcoin", label: "Facebook", Icon: FacebookIcon },
        { href: "https://www.instagram.com/mappingbitcoin/", label: "Instagram", Icon: InstagramIcon },
        { href: "https://x.com/mappingbitcoin_", label: "X", Icon: TwitterIcon }
    ];

    return (
        <footer className="relative z-10 w-full py-16 px-8 pb-8 bg-gradient-primary text-white">
                <div className="max-w-container mx-auto">
                    {/* Top Section */}
                    <motion.div
                        className="flex flex-wrap gap-12 justify-between mb-12"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Logo */}
                        <motion.div
                            className="flex-[1_1_200px]"
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 400 }}
                        >
                            <Link href="/">
                                <Image
                                    src="/mapping-bitcoin-logo.svg"
                                    alt="MappingBitcoin.com"
                                    width={140}
                                    height={50}
                                />
                            </Link>
                        </motion.div>

                        {/* Resources Column */}
                        <div className="flex-[0_0_auto] min-w-37.5">
                            <h3 className="text-base font-semibold mb-5 text-white">Resources</h3>
                            <ul className="list-none flex flex-col gap-3">
                                {[
                                    { href: "/map", key: "menu.map" },
                                    { href: "/countries", key: "menu.countries" },
                                    { href: "/verify-your-business", label: "Verify Your Business" },
                                    { href: "/contact", key: "menu.contact" }
                                ].map((item, index) => (
                                    <motion.li
                                        key={item.href}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                    >
                                        <Link href={item.href} className="text-white/60 no-underline text-[15px] transition-colors duration-200 hover:text-white/90">
                                            {item.label || t(item.key!)}
                                        </Link>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>

                        {/* Socials Column */}
                        <div className="flex-[0_0_auto] min-w-37.5">
                            <h3 className="text-base font-semibold mb-5 text-white">Follow Us</h3>
                            <div className="flex gap-4">
                                {socialLinks.map((social, index) => (
                                    <motion.a
                                        key={social.label}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 transition-colors duration-200 hover:bg-white/20"
                                        aria-label={social.label}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                                        whileHover={{ scale: 1.1, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <social.Icon className="w-5 h-5 fill-white" />
                                    </motion.a>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Bottom Section */}
                    <motion.div
                        className="border-t border-white/10 pt-6 flex flex-wrap gap-4 justify-between items-center"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <div className="flex gap-6 items-center">
                            <Link href="/privacy-policy" className="text-white/40 no-underline text-sm transition-colors duration-200 hover:text-white/70">{t("menu.privacy-policy")}</Link>
                            <Link href="/terms-and-conditions" className="text-white/40 no-underline text-sm transition-colors duration-200 hover:text-white/70">{t("menu.terms")}</Link>
                            <CookieSettingsButton />
                        </div>
                        <p className="text-sm text-white/40">© 2026 MappingBitcoin.com | {t('allRightsReserved')}</p>
                    </motion.div>
                </div>
        </footer>
    )
}

export default Footer

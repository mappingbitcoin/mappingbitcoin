"use client"

import React from "react";
import {Link, usePathname} from '@/i18n/navigation';
import Image from "next/image";
import {useTranslations} from "next-intl";
import { CookieSettingsButton } from "@/components/common";
import {routing} from "@/i18n/routing";
import {Locale} from "@/i18n/types";
import { motion } from "framer-motion";

const Footer = () => {
    const t = useTranslations("footer");
    const pathname = usePathname() || "";

    const segments = pathname.split("/").filter(Boolean);

    const isBtcMap =
        (segments.length === 1 && segments[0] === "map") ||
        (segments.length === 2 && routing.locales.includes(segments[0] as Locale) && segments[1] === "map");

    if (isBtcMap) return null;

    const socialLinks = [
        { href: "https://www.linkedin.com/company/mappingbitcoin/", label: "LinkedIn", icon: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
        { href: "https://www.facebook.com/mappingbitcoin", label: "Facebook", icon: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
        { href: "https://www.instagram.com/mappingbitcoin/", label: "Instagram", icon: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" },
        { href: "https://x.com/mappingbitcoin_", label: "X", icon: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" }
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
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                            <path d={social.icon}/>
                                        </svg>
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

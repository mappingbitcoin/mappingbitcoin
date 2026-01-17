"use client";

import React, {useState} from "react";
import {Link, usePathname} from '@/i18n/navigation';
import Image from "next/image";
import {useTranslations} from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

const menuItems = [
    'countries',
    'contact',
]

const NavBar = () => {
    const pathname = usePathname()
    const [menuOpen, setMenuOpen] = useState(false);
    const t = useTranslations("menu");

    const openMenu = () => {
        setMenuOpen(true);
    };

    const closeMenu = () => {
        setMenuOpen(false);
    };

    return (
        <motion.nav
            className="w-full py-1 px-6 md:px-8 bg-primary/90 text-white fixed top-0 z-1000 backdrop-blur-[20px] border-b border-white/10"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            <div className="max-w-container mx-auto flex justify-between items-center">
                {!menuOpen ? (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Link href="/">
                                <Image
                                    src={'/mapping-bitcoin-logo.svg'}
                                    alt={'MappingBitcoin.com'}
                                    width={120} height={36}
                                />
                            </Link>
                        </motion.div>

                        {/* Desktop Navigation + CTA */}
                        <div className="hidden md:flex items-center gap-8">
                            <ul className="flex items-center gap-8 list-none">
                                {menuItems.map((el, ix) => (
                                    <motion.li
                                        key={ix}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.1 + ix * 0.05 }}
                                    >
                                        <Link
                                            onClick={closeMenu}
                                            className={`text-white/70 no-underline text-sm font-medium transition-colors duration-300 relative hover:text-white ${
                                                pathname === `/${el}` ? 'text-white' : ''
                                            }`}
                                            href={`/${el}`}
                                        >
                                            {t(el)}
                                        </Link>
                                    </motion.li>
                                ))}
                            </ul>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                                className="flex items-center gap-3"
                            >
                                <Link
                                    href="/places/create"
                                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-accent/10 border border-accent rounded-lg hover:bg-accent/20 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    {t('addPlace')}
                                </Link>
                                <Link
                                    href="/map"
                                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-accent border border-accent rounded-lg hover:bg-accent-dark transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                    {t('map')}
                                </Link>
                            </motion.div>
                        </div>

                        {/* Mobile Menu Button */}
                        <motion.button
                            className="flex md:hidden items-center justify-center w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white cursor-pointer hover:bg-white/10 transition-colors"
                            onClick={openMenu}
                            whileTap={{ scale: 0.95 }}
                            aria-label="Open menu"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="3" y1="12" x2="21" y2="12"></line>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                        </motion.button>
                    </>
                ) : (
                    <AnimatePresence>
                        <motion.div
                            className="fixed h-screen top-0 left-0 w-full bg-primary/98 backdrop-blur-[20px] flex flex-col items-center justify-center gap-8 overscroll-none touch-none z-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {menuItems.map((el, ix) =>
                                <motion.div
                                    key={ix}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: ix * 0.1 }}
                                >
                                    <Link
                                        onClick={closeMenu}
                                        className={`text-white/80 text-xl no-underline font-medium transition-colors duration-300 hover:text-accent ${
                                            pathname === `/${el}` ? 'text-white' : ''
                                        }`}
                                        href={`/${el}`}
                                    >
                                        {t(el)}
                                    </Link>
                                </motion.div>
                            )}

                            {/* Mobile CTAs */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.3 }}
                                className="flex flex-col items-center gap-3"
                            >
                                <Link
                                    onClick={closeMenu}
                                    href="/places/create"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-accent/10 border border-accent rounded-lg hover:bg-accent/20 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    {t('addPlace')}
                                </Link>
                                <Link
                                    onClick={closeMenu}
                                    href="/map"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-accent border border-accent rounded-lg hover:bg-accent-dark transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                    {t('map')}
                                </Link>
                            </motion.div>

                            {/* Close Button */}
                            <motion.button
                                className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white cursor-pointer hover:bg-white/10 transition-colors"
                                onClick={closeMenu}
                                whileTap={{ scale: 0.95 }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                aria-label="Close menu"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </motion.button>
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </motion.nav>
    );
};

export default NavBar;

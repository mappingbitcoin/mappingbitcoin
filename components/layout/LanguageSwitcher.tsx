"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { motion, AnimatePresence } from "framer-motion";

const LOCALE_LABELS: Record<string, string> = {
    en: "EN",
    es: "ES",
    pt: "PT",
};

const LOCALE_NAMES: Record<string, string> = {
    en: "English",
    es: "Español",
    pt: "Português",
};

export default function LanguageSwitcher() {
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLocaleChange = (newLocale: string) => {
        router.replace(pathname, { locale: newLocale });
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-colors cursor-pointer"
                aria-label="Change language"
                aria-expanded={isOpen}
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                {LOCALE_LABELS[locale] || locale.toUpperCase()}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 mt-1 w-32 bg-surface border border-border-light rounded-lg shadow-lg overflow-hidden z-50"
                    >
                        {routing.locales.map((loc) => (
                            <button
                                key={loc}
                                onClick={() => handleLocaleChange(loc)}
                                className={`w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer ${
                                    loc === locale
                                        ? 'text-accent bg-accent/10'
                                        : 'text-white/70 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {LOCALE_NAMES[loc] || loc.toUpperCase()}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

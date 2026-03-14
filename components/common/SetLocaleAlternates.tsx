"use client";

import { useEffect } from "react";
import { useLocaleAlternates } from "@/contexts/LocaleAlternatesContext";

interface SetLocaleAlternatesProps {
    alternates: Record<string, string>;
}

/**
 * Render this component on pages with locale-specific slugs
 * to tell the LanguageSwitcher where to navigate per locale.
 *
 * Usage: <SetLocaleAlternates alternates={{ en: "/blog/english-slug", es: "/es/blog/spanish-slug" }} />
 */
export default function SetLocaleAlternates({ alternates }: SetLocaleAlternatesProps) {
    const { setAlternates } = useLocaleAlternates();

    useEffect(() => {
        setAlternates(alternates);
        return () => setAlternates({});
    }, [alternates, setAlternates]);

    return null;
}

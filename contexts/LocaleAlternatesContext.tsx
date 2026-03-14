"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type LocaleAlternates = Record<string, string>; // locale → full path (e.g. "/es/blog/slug-es")

interface LocaleAlternatesContextValue {
    alternates: LocaleAlternates;
    setAlternates: (alternates: LocaleAlternates) => void;
}

const LocaleAlternatesContext = createContext<LocaleAlternatesContextValue>({
    alternates: {},
    setAlternates: () => {},
});

export function LocaleAlternatesProvider({ children }: { children: ReactNode }) {
    const [alternates, setAlternatesState] = useState<LocaleAlternates>({});

    const setAlternates = useCallback((newAlternates: LocaleAlternates) => {
        setAlternatesState(newAlternates);
    }, []);

    return (
        <LocaleAlternatesContext.Provider value={{ alternates, setAlternates }}>
            {children}
        </LocaleAlternatesContext.Provider>
    );
}

export function useLocaleAlternates() {
    return useContext(LocaleAlternatesContext);
}

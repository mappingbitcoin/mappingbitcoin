import type { Metadata } from "next";

export type Locale = 'en' | 'es' | 'pt';

export type LocalizedMetadata = {
    [locale in Locale]?: Metadata;
};

export type SEOModule<T extends string> = {
    [key in T]: LocalizedMetadata;
};

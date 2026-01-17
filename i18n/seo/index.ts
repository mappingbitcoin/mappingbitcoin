import type { Metadata } from "next";
import type { Locale, LocalizedMetadata } from "./types";

// Import all SEO modules
import homeSeo, { type HomePageKey } from "./home";
import mapSeo, { type MapPageKey } from "./map";
import contactSeo, { type ContactPageKey } from "./contact";
import placesSeo, { type PlacesPageKey } from "./places";
import countriesSeo, { type CountriesPageKey } from "./countries";
import legalSeo, { type LegalPageKey } from "./legal";
import counterSeo, { type CounterPageKey } from "./counter";
import notFoundSeo, { type NotFoundPageKey } from "./not-found";

// Re-export utilities
export { generateCanonical } from "./utils";

// Combined page key type
export type PageKey =
    | HomePageKey
    | MapPageKey
    | ContactPageKey
    | PlacesPageKey
    | CountriesPageKey
    | LegalPageKey
    | CounterPageKey
    | NotFoundPageKey;

// Re-export types
export type { Locale, LocalizedMetadata };

// SEO content map type
export type SEOMap<T extends string> = {
    [key in T]: LocalizedMetadata;
};

// Merged SEO content
const seoContent: SEOMap<PageKey> = {
    ...homeSeo,
    ...mapSeo,
    ...contactSeo,
    ...placesSeo,
    ...countriesSeo,
    ...legalSeo,
    ...counterSeo,
    ...notFoundSeo,
};

export default seoContent;

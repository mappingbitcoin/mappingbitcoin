import {Locale, Localized} from "@/i18n/types";
import {Metadata} from "next";
import seoContent, {PageKey, SEOMap, generateCanonical} from "@/i18n/seo";
import {routing} from "@/i18n/routing";

// Page path mapping for generating alternates
const pagePathMap: Record<PageKey, string> = {
    home: "",
    map: "map",
    contact: "contact",
    places: "places",
    countries: "countries",
    privacy: "privacy",
    terms: "terms",
    notFound: "404",
    "verify-your-business": "verify-your-business",
    docs: "docs",
    blog: "blog",
};

// Build alternates (hreflang) for a page
function buildAlternates(pageKey: PageKey, currentLocale: Locale): Metadata['alternates'] {
    const pagePath = pagePathMap[pageKey];
    if (pagePath === undefined) return undefined;

    const canonical = generateCanonical(pagePath, currentLocale);
    const languages: Record<string, string> = {};

    for (const locale of routing.locales) {
        languages[locale] = generateCanonical(pagePath, locale);
    }
    languages['x-default'] = generateCanonical(pagePath, routing.defaultLocale);

    return { canonical, languages };
}

export const buildGetSeo= <T extends string>(map: SEOMap<T>) => (tool: T) => async ({ params }: Localized): Promise<{
        metadata: Metadata; locale: Locale;
}> => {
        const awaitedParams = await params;
        const locale: Locale = awaitedParams && 'locale' in awaitedParams ? awaitedParams.locale : 'en';
        const content = map[tool][locale] ?? map[tool].en;
        return {metadata: content!, locale}
}

export const getPageSeo = buildGetSeo<PageKey>(seoContent)

export const buildGenerateMetadata = <T extends string>(map: SEOMap<T>) => (tool: T) => async ({ params }: Localized): Promise<Metadata> => {
        const awaitedParams = await params;
        const locale: Locale = awaitedParams && 'locale' in awaitedParams ? awaitedParams.locale : 'en';
        const content = map[tool][locale] ?? map[tool].en;
        const alternates = buildAlternates(tool as PageKey, locale);
        return { ...content!, alternates };
}

export const buildGeneratePageMetadata = buildGenerateMetadata<PageKey>(seoContent)

import {Locale, Localized} from "@/i18n/types";
import {Metadata} from "next";
import seoContent, {PageKey, SEOMap} from "@/i18n/seo";

export const buildGetSeo= <T extends string>(map: SEOMap<T>) => (tool: T) => async ({ params }: Localized): Promise<{
        metadata: Metadata; locale: Locale;
}> => {
        const awaitedParams = await params;
        const content = awaitedParams && 'locale' in awaitedParams ? map[tool][awaitedParams.locale] : map[tool].en; // fallback to English
        return {metadata: content!, locale: awaitedParams && 'locale' in awaitedParams ? awaitedParams.locale : 'en'}
}

export const getPageSeo = buildGetSeo<PageKey>(seoContent)

export const buildGenerateMetadata = <T extends string>(map: SEOMap<T>) => (tool: T) => async ({ params }: Localized): Promise<Metadata> => {
        const awaitedParams = await params;
        const content = awaitedParams && 'locale' in awaitedParams ? map[tool][awaitedParams.locale] : map[tool].en; // fallback to English
        return content!
}

export const buildGeneratePageMetadata = buildGenerateMetadata<PageKey>(seoContent)

import { describe, it, expect } from "vitest";
import {
    getBlogSlugs,
    getBlogPost,
    getBlogPostMeta,
    getBlogSlugForLocale,
    getPostAvailableLocales,
    getAvailableBlogLocales,
    formatBlogDate,
    LOCALE_NAMES,
} from "@/lib/blog/parser";

describe("Blog Parser", () => {
    describe("getBlogSlugs", () => {
        it("returns slugs for en locale", () => {
            const slugs = getBlogSlugs("en");
            expect(slugs).toContain("why-we-built-mapping-bitcoin");
        });

        it("returns slugs for es locale", () => {
            const slugs = getBlogSlugs("es");
            expect(slugs).toContain("por-que-construimos-mapping-bitcoin");
        });

        it("returns slugs for pt locale", () => {
            const slugs = getBlogSlugs("pt");
            expect(slugs).toContain("por-que-construimos-mapping-bitcoin");
        });

        it("returns empty array for nonexistent locale", () => {
            const slugs = getBlogSlugs("xx");
            expect(slugs).toEqual([]);
        });
    });

    describe("getBlogPostMeta", () => {
        it("returns metadata for en post", () => {
            const meta = getBlogPostMeta("why-we-built-mapping-bitcoin", "en");
            expect(meta).not.toBeNull();
            expect(meta!.title).toBe("Why We Built Mapping Bitcoin");
            expect(meta!.slugs).toBeDefined();
        });

        it("returns metadata for es post", () => {
            const meta = getBlogPostMeta("por-que-construimos-mapping-bitcoin", "es");
            expect(meta).not.toBeNull();
            expect(meta!.slugs).toBeDefined();
        });

        it("returns null for nonexistent post", () => {
            const meta = getBlogPostMeta("nonexistent", "en");
            expect(meta).toBeNull();
        });
    });

    describe("getBlogPost", () => {
        it("parses slugs from frontmatter", () => {
            const post = getBlogPost("why-we-built-mapping-bitcoin", "en");
            expect(post).not.toBeNull();
            expect(post!.slugs).toEqual({
                en: "why-we-built-mapping-bitcoin",
                es: "por-que-construimos-mapping-bitcoin",
                pt: "por-que-construimos-mapping-bitcoin",
            });
        });
    });

    describe("getBlogSlugForLocale", () => {
        it("returns same slug for same locale", () => {
            const result = getBlogSlugForLocale("why-we-built-mapping-bitcoin", "en", "en");
            expect(result).toBe("why-we-built-mapping-bitcoin");
        });

        it("returns es slug from en post", () => {
            const result = getBlogSlugForLocale("why-we-built-mapping-bitcoin", "en", "es");
            expect(result).toBe("por-que-construimos-mapping-bitcoin");
        });

        it("returns pt slug from en post", () => {
            const result = getBlogSlugForLocale("why-we-built-mapping-bitcoin", "en", "pt");
            expect(result).toBe("por-que-construimos-mapping-bitcoin");
        });

        it("returns null for nonexistent post", () => {
            const result = getBlogSlugForLocale("nonexistent", "en", "es");
            expect(result).toBeNull();
        });
    });

    describe("getPostAvailableLocales", () => {
        it("returns locale+slug pairs for en post", () => {
            const locales = getPostAvailableLocales("why-we-built-mapping-bitcoin", "en");
            expect(locales.length).toBeGreaterThanOrEqual(1);
            expect(locales).toContainEqual({ locale: "en", slug: "why-we-built-mapping-bitcoin" });
        });

        it("includes es and pt when they exist", () => {
            const locales = getPostAvailableLocales("why-we-built-mapping-bitcoin", "en");
            const localeNames = locales.map(l => l.locale);
            expect(localeNames).toContain("es");
            expect(localeNames).toContain("pt");
        });

        it("uses correct slugs per locale", () => {
            const locales = getPostAvailableLocales("why-we-built-mapping-bitcoin", "en");
            const esEntry = locales.find(l => l.locale === "es");
            const ptEntry = locales.find(l => l.locale === "pt");
            expect(esEntry?.slug).toBe("por-que-construimos-mapping-bitcoin");
            expect(ptEntry?.slug).toBe("por-que-construimos-mapping-bitcoin");
        });
    });

    describe("getAvailableBlogLocales", () => {
        it("returns en, es, pt", () => {
            const locales = getAvailableBlogLocales();
            expect(locales).toContain("en");
            expect(locales).toContain("es");
            expect(locales).toContain("pt");
        });
    });

    describe("formatBlogDate", () => {
        it("formats date in English", () => {
            const result = formatBlogDate("2026-02-19", "en");
            expect(result).toContain("2026");
            expect(result).toContain("19");
        });

        it("formats date in Spanish", () => {
            const result = formatBlogDate("2026-02-19", "es");
            expect(result).toContain("2026");
        });

        it("formats date in Portuguese", () => {
            const result = formatBlogDate("2026-02-19", "pt");
            expect(result).toContain("2026");
        });
    });

    describe("LOCALE_NAMES", () => {
        it("has en, es, pt entries", () => {
            expect(LOCALE_NAMES.en).toBe("English");
            expect(LOCALE_NAMES.es).toBe("Español");
            expect(LOCALE_NAMES.pt).toBe("Português");
        });
    });
});

import { describe, it, expect } from "vitest";
import seoContent from "@/i18n/seo";
import { generateCanonical } from "@/i18n/seo";

describe("SEO Modules", () => {
    describe("generateCanonical", () => {
        it("generates correct canonical for en (no prefix)", () => {
            expect(generateCanonical("map", "en")).toMatch(/\/map$/);
        });

        it("generates correct canonical for es", () => {
            expect(generateCanonical("map", "es")).toMatch(/\/es\/map$/);
        });

        it("generates correct canonical for pt", () => {
            expect(generateCanonical("map", "pt")).toMatch(/\/pt\/map$/);
        });

        it("generates root URL for empty path and en", () => {
            const result = generateCanonical("", "en");
            expect(result).toMatch(/\/$/);
        });
    });

    describe("seoContent", () => {
        it("has home page SEO", () => {
            expect(seoContent.home).toBeDefined();
            expect(seoContent.home.en).toBeDefined();
        });

        it("has es entries for home", () => {
            expect(seoContent.home.es).toBeDefined();
            expect(seoContent.home.es!.title).toBeTruthy();
        });

        it("has pt entries for home", () => {
            expect(seoContent.home.pt).toBeDefined();
            expect(seoContent.home.pt!.title).toBeTruthy();
        });

        it("has es entries for map", () => {
            expect(seoContent.map.es).toBeDefined();
        });

        it("has pt entries for map", () => {
            expect(seoContent.map.pt).toBeDefined();
        });

        it("has es entries for blog", () => {
            expect(seoContent.blog.es).toBeDefined();
        });

        it("has pt entries for blog", () => {
            expect(seoContent.blog.pt).toBeDefined();
        });

        // Verify all page keys have at least en
        const pageKeys = Object.keys(seoContent);
        for (const key of pageKeys) {
            it(`${key} has en entry`, () => {
                expect((seoContent as any)[key].en).toBeDefined();
            });
        }
    });
});

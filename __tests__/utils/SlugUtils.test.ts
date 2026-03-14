import { describe, it, expect } from "vitest";
import {
    getLocalizedCountrySlug,
    getLocalizedCitySlug,
    getLocalizedCountryCategorySlug,
    getLocalizedCityCategorySlug,
    getSubcategoryFromSlug,
    SUBCATEGORY_SLUGS_BY_LOCALE,
} from "@/utils/SlugUtils";

describe("SlugUtils", () => {
    describe("getLocalizedCountrySlug", () => {
        it("generates English slug", () => {
            expect(getLocalizedCountrySlug("Argentina", "en")).toBe("bitcoin-shops-in-argentina");
        });

        it("generates Spanish slug", () => {
            expect(getLocalizedCountrySlug("Argentina", "es")).toBe("lugares-bitcoin-en-argentina");
        });

        it("generates Portuguese slug", () => {
            expect(getLocalizedCountrySlug("Argentina", "pt")).toBe("locais-bitcoin-em-argentina");
        });
    });

    describe("getLocalizedCitySlug", () => {
        it("generates English slug", () => {
            expect(getLocalizedCitySlug("Argentina", "Buenos Aires", "en")).toBe("bitcoin-shops-in-buenos-aires-argentina");
        });

        it("generates Spanish slug", () => {
            expect(getLocalizedCitySlug("Argentina", "Buenos Aires", "es")).toBe("comercios-bitcoin-en-buenos-aires-argentina");
        });

        it("generates Portuguese slug", () => {
            expect(getLocalizedCitySlug("Argentina", "Buenos Aires", "pt")).toBe("comercios-bitcoin-em-buenos-aires-argentina");
        });
    });

    describe("getLocalizedCountryCategorySlug", () => {
        it("generates English slug", () => {
            const result = getLocalizedCountryCategorySlug("Argentina", "restaurant", "en");
            expect(result).toBe("bitcoin-restaurants-in-argentina");
        });

        it("generates Spanish slug", () => {
            const result = getLocalizedCountryCategorySlug("Argentina", "restaurant", "es");
            expect(result).toBe("restaurantes-bitcoin-en-argentina");
        });

        it("generates Portuguese slug", () => {
            const result = getLocalizedCountryCategorySlug("Argentina", "restaurant", "pt");
            expect(result).toBe("restaurantes-bitcoin-em-argentina");
        });
    });

    describe("getLocalizedCityCategorySlug", () => {
        it("generates Portuguese slug", () => {
            const result = getLocalizedCityCategorySlug("Argentina", "Buenos Aires", "cafe", "pt");
            expect(result).toBe("cafes-bitcoin-em-buenos-aires-argentina");
        });
    });

    describe("getSubcategoryFromSlug", () => {
        it("resolves English slug", () => {
            expect(getSubcategoryFromSlug("restaurants", "en")).toBe("restaurant");
        });

        it("resolves Spanish slug", () => {
            expect(getSubcategoryFromSlug("restaurantes", "es")).toBe("restaurant");
        });

        it("resolves Portuguese slug", () => {
            expect(getSubcategoryFromSlug("restaurantes", "pt")).toBe("restaurant");
        });

        it("returns null for unknown slug", () => {
            expect(getSubcategoryFromSlug("unknown-slug", "en")).toBeNull();
        });
    });

    describe("SUBCATEGORY_SLUGS_BY_LOCALE", () => {
        it("has en locale", () => {
            expect(SUBCATEGORY_SLUGS_BY_LOCALE.en).toBeDefined();
        });

        it("has es locale", () => {
            expect(SUBCATEGORY_SLUGS_BY_LOCALE.es).toBeDefined();
        });

        it("has pt locale", () => {
            expect(SUBCATEGORY_SLUGS_BY_LOCALE.pt).toBeDefined();
        });

        it("all locale maps have the same number of entries", () => {
            const enCount = Object.keys(SUBCATEGORY_SLUGS_BY_LOCALE.en!).length;
            const esCount = Object.keys(SUBCATEGORY_SLUGS_BY_LOCALE.es!).length;
            const ptCount = Object.keys(SUBCATEGORY_SLUGS_BY_LOCALE.pt!).length;
            expect(enCount).toBe(esCount);
            expect(enCount).toBe(ptCount);
        });

        it("all locale maps have the same keys", () => {
            const enKeys = Object.keys(SUBCATEGORY_SLUGS_BY_LOCALE.en!).sort();
            const esKeys = Object.keys(SUBCATEGORY_SLUGS_BY_LOCALE.es!).sort();
            const ptKeys = Object.keys(SUBCATEGORY_SLUGS_BY_LOCALE.pt!).sort();
            expect(enKeys).toEqual(esKeys);
            expect(enKeys).toEqual(ptKeys);
        });
    });
});

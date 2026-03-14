import { describe, it, expect } from "vitest";
import { routing } from "@/i18n/routing";

describe("i18n routing", () => {
    it("includes en, es, pt locales", () => {
        expect(routing.locales).toContain("en");
        expect(routing.locales).toContain("es");
        expect(routing.locales).toContain("pt");
    });

    it("has exactly 3 locales", () => {
        expect(routing.locales).toHaveLength(3);
    });

    it("has en as default locale", () => {
        expect(routing.defaultLocale).toBe("en");
    });

    it("uses as-needed locale prefix", () => {
        expect(routing.localePrefix).toBe("as-needed");
    });
});

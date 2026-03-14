import { describe, it, expect } from "vitest";

describe("Translation Files", () => {
    const locales = ["en", "es", "pt"];

    for (const locale of locales) {
        it(`${locale}/index.ts exports messages`, async () => {
            const messages = (await import(`@/public/locales/${locale}/index`)).default;
            expect(messages).toBeDefined();
            expect(messages.home).toBeDefined();
            expect(messages.contact).toBeDefined();
            expect(messages.map).toBeDefined();
        });
    }

    it("es and pt have same top-level keys as en", async () => {
        const en = (await import("@/public/locales/en/index")).default;
        const es = (await import("@/public/locales/es/index")).default;
        const pt = (await import("@/public/locales/pt/index")).default;

        const enKeys = Object.keys(en).sort();
        const esKeys = Object.keys(es).sort();
        const ptKeys = Object.keys(pt).sort();

        expect(esKeys).toEqual(enKeys);
        expect(ptKeys).toEqual(enKeys);
    });
});

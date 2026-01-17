import { CURRENCY_COUNTRY_MAP } from "@/data/CurrencyCountryMap";

export function getCurrencyOptions(): { code: string; label: string }[] {
    return Object.entries(CURRENCY_COUNTRY_MAP)
        .map(([code, country]) => ({
            code,
            label: `${code} (${country})`,
        }))
        .sort((a, b) => a.code.localeCompare(b.code));
}

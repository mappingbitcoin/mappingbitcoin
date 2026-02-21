import countries from "i18n-iso-countries";
import es from "i18n-iso-countries/langs/es.json";
import en from "i18n-iso-countries/langs/en.json";
import {Locale} from "@/i18n/types";
import slugify from "slugify";

countries.registerLocale(es);
countries.registerLocale(en);

export const getLocalizedCountryName = (locale: Locale, countryCode: string) => countries.getName(countryCode, locale, {select: 'official'})

// Simplified country name mappings for slug matching
const SLUG_TO_COUNTRY_OVERRIDES: Record<string, string> = {
    'united-states': 'US',
    'united-kingdom': 'GB',
    'south-korea': 'KR',
    'north-korea': 'KP',
    'russia': 'RU',
    'iran': 'IR',
    'venezuela': 'VE',
    'vietnam': 'VN',
    'syria': 'SY',
    'bolivia': 'BO',
    'tanzania': 'TZ',
    'moldova': 'MD',
    'north-macedonia': 'MK',
    'laos': 'LA',
    'palestine': 'PS',
    'brunei': 'BN',
    'czechia': 'CZ',
    'burma': 'MM',
};

/**
 * Get country code from a country slug (e.g., "germany" -> "DE", "united-states" -> "US")
 * Returns null if the country is not valid
 */
export function getCountryCodeFromSlug(countrySlug: string): string | null {
    const slug = countrySlug.toLowerCase();

    // Check overrides first
    if (SLUG_TO_COUNTRY_OVERRIDES[slug]) {
        return SLUG_TO_COUNTRY_OVERRIDES[slug];
    }

    // Try to find the country by matching against all country names
    const allCodes = countries.getAlpha2Codes();

    for (const code of Object.keys(allCodes)) {
        const enName = countries.getName(code, 'en', {select: 'official'});
        const esName = countries.getName(code, 'es', {select: 'official'});

        if (enName && slugify(enName, { lower: true, strict: true }) === slug) {
            return code;
        }
        if (esName && slugify(esName, { lower: true, strict: true }) === slug) {
            return code;
        }
    }

    return null;
}

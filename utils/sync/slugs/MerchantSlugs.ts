import fs from 'fs/promises';
import path from 'path';
import slugify from 'slugify';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import esLocale from 'i18n-iso-countries/langs/es.json';
import { getSimplifiedCountrySlug, SUBCATEGORY_SLUGS_BY_LOCALE } from "@/utils/SlugUtils";
import { PlaceSubcategory } from "@/constants/PlaceCategories";
import { EnrichedVenue } from "@/models/Overpass";
import { Locale } from "@/i18n/types";
import { VenueSlugEntrySEO } from "@/models/VenueSlug";

countries.registerLocale(enLocale);
countries.registerLocale(esLocale);

const VENUES_FILE = path.resolve('data', 'EnrichedVenues.json');
const MERCHANT_OUTPUT_FILE = path.resolve('data', 'merchant-slugs.json');
const MERCHANT_SLUG_MAP = path.resolve('data', 'venue_slug_map.json');

export async function generateMerchantSlugs() {
    const venues = JSON.parse(await fs.readFile(VENUES_FILE, 'utf8'));
    const combinations = new Map<string, VenueSlugEntrySEO>();

    function createEntry(slugKey: string, base: any, countryCode: string, category?: string, subcategory?: string) {
        const alternates_i18n = (base.alternates_i18n || {}) as Record<string, string>;
        const canonical = base.canonical;
        const alternates: Record<string, string> = {
            en: canonical,
            ...Object.fromEntries(
                Object.entries(alternates_i18n).map(([locale, slugs]) => [
                    locale,
                    `${locale}/${slugs[0]}`
                ])
            )
        };

        combinations.set(slugKey, {
            ...base,
            country: countryCode,
            type: subcategory ? 'category' : base.location ? 'city' : 'country',
            canonical,
            alternates,
            ...(category && subcategory ? { categoryAndSubcategory: { category, subcategory } } : {})
        });
    }

    venues.forEach((venue: EnrichedVenue) => {
        const { category, subcategory } = venue;
        const countryCode = venue.country || venue?.tags?.['addr:country'];
        const state = venue.state || venue?.tags?.['addr:state'];
        const city = venue.city || venue?.tags?.['addr:city'];

        if (!countryCode) return;

        const countryEnglish = countries.getName(countryCode, 'en', { select: 'official' });
        const countrySpanish = countries.getName(countryCode, 'es', { select: 'official' });
        if (!countryEnglish || !countrySpanish) return;

        const simplifiedSlugEnglish = getSimplifiedCountrySlug(countryEnglish);
        const simplifiedSlugSpanish = getSimplifiedCountrySlug(countrySpanish);

        const citySlug = city ? slugify(city, { lower: true, strict: true }) : null;
        const stateSlug = state ? slugify(state, { lower: true, strict: true }) : null;
        const cityEqualsState = city && state && city.toLowerCase() === state.toLowerCase();

        const keyCountryOnly = `c:${countryCode}`;
        if (!combinations.has(keyCountryOnly)) {
            createEntry(keyCountryOnly, {
                canonical: `bitcoin-shops-in-${simplifiedSlugEnglish}`,
                alternates_i18n: {
                    es: [`lugares-bitcoin-en-${simplifiedSlugSpanish}`]
                }
            }, countryCode);
        }

        if (category && subcategory) {
            const subcatSlugKey = slugify(subcategory, { lower: true, strict: true });
            const categorySlugEn = SUBCATEGORY_SLUGS_BY_LOCALE['en'][subcategory as PlaceSubcategory] || `${subcatSlugKey}s`;
            const categorySlugEs = SUBCATEGORY_SLUGS_BY_LOCALE['es'][subcategory as PlaceSubcategory] || `${subcatSlugKey}s`;

            const keyCountryCat = `c:${countryCode}|cat:${subcategory}`;
            if (!combinations.has(keyCountryCat)) {
                createEntry(keyCountryCat, {
                    canonical: `bitcoin-${categorySlugEn}-in-${simplifiedSlugEnglish}`,
                    alternates_i18n: {
                        es: [`${categorySlugEs}-bitcoin-en-${simplifiedSlugSpanish}`]
                    }
                }, countryCode, category, subcategory);
            }

            if (citySlug) {
                const keyCityCat = `c:${countryCode}|loc:${citySlug}|cat:${subcategory}`;
                if (!combinations.has(keyCityCat)) {
                    createEntry(keyCityCat, {
                        location: citySlug,
                        canonical: `bitcoin-${categorySlugEn}-in-${citySlug}-${simplifiedSlugEnglish}`,
                        alternates_i18n: {
                            es: [`${categorySlugEs}-bitcoin-en-${citySlug}-${simplifiedSlugSpanish}`]
                        }
                    }, countryCode, category, subcategory);
                }
            }

            if (stateSlug && !cityEqualsState) {
                const keyStateCat = `c:${countryCode}|loc:${stateSlug}|cat:${subcategory}`;
                if (!combinations.has(keyStateCat)) {
                    createEntry(keyStateCat, {
                        location: stateSlug,
                        canonical: `bitcoin-${categorySlugEn}-in-${stateSlug}-${simplifiedSlugEnglish}`,
                        alternates_i18n: {
                            es: [`${categorySlugEs}-bitcoin-en-${stateSlug}-${simplifiedSlugSpanish}`]
                        }
                    }, countryCode, category, subcategory);
                }
            }
        }

        if (citySlug) {
            const keyCity = `c:${countryCode}|loc:${citySlug}`;
            if (!combinations.has(keyCity)) {
                createEntry(keyCity, {
                    location: citySlug,
                    canonical: `bitcoin-shops-in-${citySlug}-${simplifiedSlugEnglish}`,
                    alternates_i18n: {
                        es: [`lugares-bitcoin-en-${citySlug}-${simplifiedSlugSpanish}`]
                    }
                }, countryCode);
            }
        }

        if (stateSlug && !cityEqualsState) {
            const keyState = `c:${countryCode}|loc:${stateSlug}`;
            if (!combinations.has(keyState)) {
                createEntry(keyState, {
                    location: stateSlug,
                    canonical: `bitcoin-shops-in-${stateSlug}-${simplifiedSlugEnglish}`,
                    alternates_i18n: {
                        es: [`lugares-bitcoin-en-${stateSlug}-${simplifiedSlugSpanish}`]
                    }
                }, countryCode);
            }
        }
    });

    const result = Array.from(combinations.values());
    await fs.writeFile(MERCHANT_OUTPUT_FILE, JSON.stringify(result.map((el) => ({
        type: el.type,
        canonical: el.canonical,
        alternates: el.alternates
    })), null, 2));
    console.log(`✅ Generated ${result.length} slug entries with full canonical and alternates.`);

    const slugMap: Record<string, VenueSlugEntrySEO> = {};
    for (const entry of result) {
        slugMap[entry.canonical] = {
            locale: 'en',
            type: entry.type,
            country: entry.country,
            location: entry.location,
            categoryAndSubcategory: entry.categoryAndSubcategory,
            canonical: entry.canonical,
            alternates: entry.alternates,
        };

        if (entry.alternates_i18n) {
            for (const locale in entry.alternates_i18n) {
                for (const alt of entry.alternates_i18n[locale as Locale]!) {
                    slugMap[alt] = {
                        locale: locale as Locale,
                        type: entry.type,
                        country: entry.country,
                        location: entry.location,
                        categoryAndSubcategory: entry.categoryAndSubcategory,
                        canonical: entry.canonical,
                        alternates: entry.alternates,
                    };
                }
            }
        }
    }

    await fs.writeFile(MERCHANT_SLUG_MAP, JSON.stringify(slugMap, null, 2));
    console.log(`✅ Created ${Object.keys(slugMap).length} slug map entries.`);
}

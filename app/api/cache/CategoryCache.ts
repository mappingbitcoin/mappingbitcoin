import fs from 'fs/promises';
import path from 'path';
import { EnrichedVenue } from "@/models/Overpass";
import { PlaceSubcategory } from "@/constants/PlaceCategories";
import { getLocalizedCountryCategorySlug, getLocalizedCityCategorySlug, SUBCATEGORY_SLUGS_BY_LOCALE } from "@/utils/SlugUtils";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";

countries.registerLocale(en);

export type CityData = {
    name: string;
    count: number;
    slug: string;
};

export type CountryData = {
    name: string;
    code: string; // ISO country code for flag
    count: number;
    slug: string;
    cities: CityData[];
};

export type SubcategoryData = {
    subcategory: string;
    category: string;
    pluralSlug: string; // Plural slug for display (e.g., "cafes", "restaurants")
    totalCount: number;
    countries: CountryData[];
};

type CategoryCache = {
    subcategories: Record<string, SubcategoryData>;
};

let _categoryCache: CategoryCache | null = null;

function getCountryName(code: string): string {
    // Try to get the full name from the ISO code
    const name = countries.getName(code, "en", { select: "official" });
    return name || code;
}

export async function getCategoryCache(): Promise<CategoryCache> {
    if (_categoryCache) return _categoryCache;

    const file = path.join(process.cwd(), 'data', 'EnrichedVenues.json');
    const txt = await fs.readFile(file, 'utf8');
    const venues = JSON.parse(txt) as EnrichedVenue[];

    // Aggregate: subcategory -> country -> city
    const subcategoryMap: Record<string, {
        category: string;
        countries: Record<string, {
            code: string;
            name: string;
            count: number;
            cities: Record<string, { name: string; count: number }>;
        }>;
    }> = {};

    for (const v of venues) {
        if (!v.subcategory || !v.country) continue;

        const subcatKey = v.subcategory;
        const countryCode = v.country.toUpperCase();
        const countryName = getCountryName(countryCode);
        const countryKey = countryCode.toLowerCase();
        const cityKey = v.city?.toLowerCase() || 'unknown';

        if (!subcategoryMap[subcatKey]) {
            subcategoryMap[subcatKey] = {
                category: v.category || 'other',
                countries: {},
            };
        }

        if (!subcategoryMap[subcatKey].countries[countryKey]) {
            subcategoryMap[subcatKey].countries[countryKey] = {
                code: countryCode,
                name: countryName,
                count: 0,
                cities: {},
            };
        }

        subcategoryMap[subcatKey].countries[countryKey].count += 1;

        if (v.city) {
            if (!subcategoryMap[subcatKey].countries[countryKey].cities[cityKey]) {
                subcategoryMap[subcatKey].countries[countryKey].cities[cityKey] = {
                    name: v.city,
                    count: 0,
                };
            }
            subcategoryMap[subcatKey].countries[countryKey].cities[cityKey].count += 1;
        }
    }

    // Convert to final structure
    const subcategories: Record<string, SubcategoryData> = {};

    for (const [subcatKey, data] of Object.entries(subcategoryMap)) {
        // Get the plural slug from the slug map
        const pluralSlug = SUBCATEGORY_SLUGS_BY_LOCALE['en'][subcatKey as PlaceSubcategory] || subcatKey.replace(/_/g, '-');

        const countriesList: CountryData[] = Object.entries(data.countries)
            .map(([, countryData]) => ({
                name: countryData.name,
                code: countryData.code,
                count: countryData.count,
                slug: getLocalizedCountryCategorySlug(countryData.name, subcatKey as PlaceSubcategory, 'en'),
                cities: Object.values(countryData.cities)
                    .map(city => ({
                        name: city.name,
                        count: city.count,
                        slug: getLocalizedCityCategorySlug(countryData.name, city.name, subcatKey as PlaceSubcategory, 'en'),
                    }))
                    .sort((a, b) => b.count - a.count),
            }))
            // Sort alphabetically by country name
            .sort((a, b) => a.name.localeCompare(b.name));

        const totalCount = countriesList.reduce((sum, c) => sum + c.count, 0);

        subcategories[subcatKey] = {
            subcategory: subcatKey,
            category: data.category,
            pluralSlug,
            totalCount,
            countries: countriesList,
        };
    }

    _categoryCache = { subcategories };
    return _categoryCache;
}

export async function getSubcategoryData(subcategory: string): Promise<SubcategoryData | null> {
    const cache = await getCategoryCache();
    return cache.subcategories[subcategory] || null;
}

export async function refreshCategoryCache(): Promise<void> {
    _categoryCache = null;
    await getCategoryCache();
}

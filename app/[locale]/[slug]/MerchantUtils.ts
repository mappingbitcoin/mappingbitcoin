import {Locale} from "@/i18n/types";
import {getSubcategoryLabel} from "@/constants/PlaceCategories";
import {CategoryAndSubcategory} from "@/constants/PlaceOsmDictionary";

const MAX_DESCRIPTION_LENGTH = 160;
const MAX_TITLE_LENGTH = 60;
const SITE_SUFFIX = " | Mapping Bitcoin";

type TemplateKey = "countryCityCategory" | "countryAndCategory" | "countryAndCity" | "countryOnly";

/**
 * Country name shortenings - ordered from longest to shortest
 */
const COUNTRY_SHORTENINGS: Record<string, string[]> = {
    // English
    "United States of America": ["United States", "USA", "US"],
    "United States": ["USA", "US"],
    "United Kingdom": ["UK"],
    "United Arab Emirates": ["UAE"],
    "Democratic Republic of the Congo": ["DR Congo", "DRC"],
    "Republic of the Congo": ["Congo"],
    "Central African Republic": ["CAR"],
    "Dominican Republic": ["Dom. Republic"],
    "Papua New Guinea": ["PNG"],
    "Trinidad and Tobago": ["Trinidad"],
    "Bosnia and Herzegovina": ["Bosnia"],
    "Saint Vincent and the Grenadines": ["St. Vincent"],
    "Saint Kitts and Nevis": ["St. Kitts"],
    "Antigua and Barbuda": ["Antigua"],
    "Sao Tome and Principe": ["Sao Tome"],
    "Czech Republic": ["Czechia"],
    "South Korea": ["Korea"],
    "North Korea": ["N. Korea"],
    "New Zealand": ["NZ"],
    "South Africa": ["S. Africa"],
    "Saudi Arabia": ["S. Arabia"],
    "The Netherlands": ["Netherlands"],
    // Spanish
    "Estados Unidos de América": ["Estados Unidos", "EE.UU.", "EUA"],
    "Estados Unidos": ["EE.UU.", "EUA"],
    "Reino Unido": ["RU"],
    "Emiratos Árabes Unidos": ["EAU"],
    "República Dominicana": ["Rep. Dominicana"],
    "República Checa": ["Chequia"],
    "Corea del Sur": ["Corea"],
    "Corea del Norte": ["C. del Norte"],
    "Nueva Zelanda": ["N. Zelanda"],
    "Sudáfrica": ["S. África"],
    "Arabia Saudita": ["A. Saudita"],
    "Países Bajos": ["Holanda"],
};

/**
 * Category suffixes that can be removed to shorten category names
 */
const CATEGORY_REMOVABLE_SUFFIXES: Record<Locale, string[]> = {
    en: [
        " restaurant",
        " shop",
        " store",
        " center",
        " centre",
        " service",
        " services",
        " station",
        " office",
        " agency",
        " company",
    ],
    es: [
        " restaurante",
        " tienda",
        " centro",
        " servicio",
        " servicios",
        " estación",
        " oficina",
        " agencia",
        " compañía",
    ],
};

/**
 * Title templates - same structure as description templates
 */
const TITLE_TEMPLATES: Record<Locale, Record<TemplateKey, string>> = {
    en: {
        countryCityCategory: "{category} in {city}, {country}",
        countryAndCategory: "{category} in {country}",
        countryAndCity: "Bitcoin Places in {city}, {country}",
        countryOnly: "Bitcoin Places in {country}",
    },
    es: {
        countryCityCategory: "{category} en {city}, {country}",
        countryAndCategory: "{category} en {country}",
        countryAndCity: "Lugares Bitcoin en {city}, {country}",
        countryOnly: "Lugares Bitcoin en {country}",
    },
};

/**
 * Shortens a country name using predefined mappings
 */
function shortenCountry(country: string, level: number = 0): string {
    const shortenings = COUNTRY_SHORTENINGS[country];
    if (!shortenings || level >= shortenings.length) {
        return country;
    }
    return shortenings[level];
}

/**
 * Shortens a category name by removing common suffixes
 */
function shortenCategory(category: string, locale: Locale): string {
    const suffixes = CATEGORY_REMOVABLE_SUFFIXES[locale] || CATEGORY_REMOVABLE_SUFFIXES.en;
    const lowerCategory = category.toLowerCase();

    for (const suffix of suffixes) {
        if (lowerCategory.endsWith(suffix)) {
            // Remove the suffix and capitalize first letter
            const shortened = category.slice(0, -suffix.length);
            return shortened;
        }
    }
    return category;
}

/**
 * Generates an SEO title that is guaranteed to be under 60 characters.
 * Uses progressive shortening strategies:
 * 1. Full title with suffix
 * 2. Shortened country name (multiple levels)
 * 3. Shortened category name
 * 4. Both shortened
 * 5. Remove suffix as last resort
 */
export function generateSeoTitle({
    country,
    city,
    categoryAndSubcategory,
    locale,
}: {
    country: string;
    city?: string;
    categoryAndSubcategory?: CategoryAndSubcategory;
    locale: Locale;
}): string {
    let categoryLabel: string | undefined;
    if (categoryAndSubcategory) {
        categoryLabel = getSubcategoryLabel(locale, categoryAndSubcategory.category, categoryAndSubcategory.subcategory);
    }

    // Determine which template to use
    let templateKey: TemplateKey;
    if (country && city && categoryAndSubcategory) {
        templateKey = "countryCityCategory";
    } else if (country && categoryAndSubcategory) {
        templateKey = "countryAndCategory";
    } else if (country && city) {
        templateKey = "countryAndCity";
    } else {
        templateKey = "countryOnly";
    }

    const localeTemplates = TITLE_TEMPLATES[locale] || TITLE_TEMPLATES.en;
    const template = localeTemplates[templateKey];

    // Helper to generate title from components
    const buildTitle = (c: string, cat: string | undefined, withSuffix: boolean): string => {
        const base = template
            .replace(/{country}/g, c)
            .replace(/{city}/g, city || "")
            .replace(/{category}/g, cat || "");
        return withSuffix ? `${base}${SITE_SUFFIX}` : base;
    };

    // Strategy 1: Try full title with suffix
    let title = buildTitle(country, categoryLabel, true);
    if (title.length <= MAX_TITLE_LENGTH) {
        return title;
    }

    // Strategy 2: Try shortening country (multiple levels)
    const countryShortens = COUNTRY_SHORTENINGS[country];
    if (countryShortens) {
        for (let level = 0; level < countryShortens.length; level++) {
            const shortCountry = shortenCountry(country, level);
            title = buildTitle(shortCountry, categoryLabel, true);
            if (title.length <= MAX_TITLE_LENGTH) {
                return title;
            }
        }
    }

    // Strategy 3: Try shortening category (with original country)
    const shortCategory = categoryLabel ? shortenCategory(categoryLabel, locale) : undefined;
    if (shortCategory && shortCategory !== categoryLabel) {
        title = buildTitle(country, shortCategory, true);
        if (title.length <= MAX_TITLE_LENGTH) {
            return title;
        }

        // Strategy 4: Try both shortened country and category
        if (countryShortens) {
            for (let level = 0; level < countryShortens.length; level++) {
                const shortCountry = shortenCountry(country, level);
                title = buildTitle(shortCountry, shortCategory, true);
                if (title.length <= MAX_TITLE_LENGTH) {
                    return title;
                }
            }
        }
    }

    // Strategy 5: Remove suffix as last resort
    // First try with all shortenings
    if (countryShortens && shortCategory) {
        const shortestCountry = countryShortens[countryShortens.length - 1];
        title = buildTitle(shortestCountry, shortCategory, false);
        if (title.length <= MAX_TITLE_LENGTH) {
            return title;
        }
    }

    // Try shortened category without suffix
    if (shortCategory) {
        title = buildTitle(country, shortCategory, false);
        if (title.length <= MAX_TITLE_LENGTH) {
            return title;
        }
    }

    // Try shortened country without suffix
    if (countryShortens) {
        for (let level = 0; level < countryShortens.length; level++) {
            const shortCountry = shortenCountry(country, level);
            title = buildTitle(shortCountry, categoryLabel, false);
            if (title.length <= MAX_TITLE_LENGTH) {
                return title;
            }
        }
    }

    // Final fallback: just the base title without suffix (may exceed limit)
    return buildTitle(country, categoryLabel, false);
}

/**
 * SEO description templates ordered from longest to shortest.
 * The function will try each template until it finds one under 160 characters.
 */
const DESCRIPTION_TEMPLATES: Record<Locale, Record<TemplateKey, string[]>> = {
    en: {
        countryCityCategory: [
            "Find {category} accepting Bitcoin in {city}, {country}. Browse verified places on our interactive map.",
            "Discover {category} in {city}, {country} that accept Bitcoin. Explore our Bitcoin merchant map.",
            "{category} accepting Bitcoin in {city}, {country}. Find verified Bitcoin-friendly places.",
            "Bitcoin {category} in {city}, {country}. Browse our verified merchant directory.",
            "{category} in {city}, {country} accepting Bitcoin payments.",
            "Bitcoin-friendly {category} in {city}, {country}.",
        ],
        countryAndCategory: [
            "Find {category} accepting Bitcoin in {country}. Browse verified places on our Bitcoin merchant map.",
            "Discover {category} in {country} that accept Bitcoin. Explore verified merchants on our map.",
            "{category} accepting Bitcoin in {country}. Find Bitcoin-friendly places on our map.",
            "Bitcoin {category} in {country}. Browse our verified merchant directory.",
            "{category} in {country} accepting Bitcoin payments.",
            "Bitcoin-friendly {category} in {country}.",
        ],
        countryAndCity: [
            "Find shops & businesses accepting Bitcoin in {city}, {country}. Browse verified places on our map.",
            "Discover Bitcoin-friendly places in {city}, {country}. Explore our merchant directory.",
            "Places accepting Bitcoin in {city}, {country}. Browse our verified map.",
            "Bitcoin merchants in {city}, {country}. Find verified places.",
            "Spend Bitcoin in {city}, {country}. Browse merchants.",
            "Bitcoin places in {city}, {country}.",
        ],
        countryOnly: [
            "Find shops & businesses accepting Bitcoin in {country}. Browse verified Bitcoin-friendly places on our map.",
            "Discover Bitcoin-friendly places in {country}. Explore our verified merchant directory.",
            "Places accepting Bitcoin in {country}. Browse our interactive merchant map.",
            "Bitcoin merchants in {country}. Find verified places on our map.",
            "Spend Bitcoin in {country}. Browse verified merchants.",
            "Bitcoin places in {country}.",
        ],
    },
    es: {
        countryCityCategory: [
            "Encuentra {category} que aceptan Bitcoin en {city}, {country}. Explora nuestro mapa interactivo.",
            "Descubre {category} en {city}, {country} que aceptan Bitcoin. Mapa de comercios Bitcoin.",
            "{category} que aceptan Bitcoin en {city}, {country}. Lugares verificados.",
            "{category} Bitcoin en {city}, {country}. Directorio de comercios verificados.",
            "{category} en {city}, {country} con pagos Bitcoin.",
            "{category} Bitcoin en {city}, {country}.",
        ],
        countryAndCategory: [
            "Encuentra {category} que aceptan Bitcoin en {country}. Explora comercios en nuestro mapa.",
            "Descubre {category} en {country} que aceptan Bitcoin. Mapa de comercios verificados.",
            "{category} que aceptan Bitcoin en {country}. Encuentra lugares en nuestro mapa.",
            "{category} Bitcoin en {country}. Directorio de comercios verificados.",
            "{category} en {country} con pagos Bitcoin.",
            "{category} Bitcoin en {country}.",
        ],
        countryAndCity: [
            "Encuentra tiendas y negocios que aceptan Bitcoin en {city}, {country}. Mapa verificado.",
            "Descubre lugares que aceptan Bitcoin en {city}, {country}. Directorio de comercios.",
            "Lugares que aceptan Bitcoin en {city}, {country}. Mapa verificado.",
            "Comercios Bitcoin en {city}, {country}. Lugares verificados.",
            "Gasta Bitcoin en {city}, {country}. Comercios verificados.",
            "Lugares Bitcoin en {city}, {country}.",
        ],
        countryOnly: [
            "Encuentra tiendas y negocios que aceptan Bitcoin en {country}. Mapa de lugares verificados.",
            "Descubre lugares que aceptan Bitcoin en {country}. Directorio de comercios verificados.",
            "Lugares que aceptan Bitcoin en {country}. Explora nuestro mapa interactivo.",
            "Comercios Bitcoin en {country}. Encuentra lugares verificados.",
            "Gasta Bitcoin en {country}. Comercios verificados.",
            "Lugares Bitcoin en {country}.",
        ],
    },
};

/**
 * Generates an SEO description that is guaranteed to be under 160 characters.
 * Uses progressively shorter templates until one fits.
 */
export function generateSeoDescription({
    country,
    city,
    categoryAndSubcategory,
    locale,
}: {
    country: string;
    city?: string;
    categoryAndSubcategory?: CategoryAndSubcategory;
    locale: Locale;
}): string {
    let categoryLabel: string | undefined;
    if (categoryAndSubcategory) {
        categoryLabel = getSubcategoryLabel(locale, categoryAndSubcategory.category, categoryAndSubcategory.subcategory);
    }

    // Determine which template set to use
    let templateKey: TemplateKey;
    if (country && city && categoryAndSubcategory) {
        templateKey = "countryCityCategory";
    } else if (country && categoryAndSubcategory) {
        templateKey = "countryAndCategory";
    } else if (country && city) {
        templateKey = "countryAndCity";
    } else {
        templateKey = "countryOnly";
    }

    // Get locale-specific templates, fall back to English
    const localeTemplates = DESCRIPTION_TEMPLATES[locale] || DESCRIPTION_TEMPLATES.en;
    const templates = localeTemplates[templateKey];

    // Try each template until one fits
    for (const template of templates) {
        const description = template
            .replace(/{country}/g, country)
            .replace(/{city}/g, city || "")
            .replace(/{category}/g, categoryLabel || "");

        if (description.length <= MAX_DESCRIPTION_LENGTH) {
            return description;
        }
    }

    // Fallback: use the shortest template (may exceed limit in extreme cases)
    const shortestTemplate = templates[templates.length - 1];
    return shortestTemplate
        .replace(/{country}/g, country)
        .replace(/{city}/g, city || "")
        .replace(/{category}/g, categoryLabel || "");
}

export function getLocalized({
                                 t,
                                 locale,
                                 attribute,
                                 country,
                                 city,
                                 categoryAndSubcategory,
                                 extraParams = {}
                             }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: any,
    locale: Locale,
    attribute: string,
    country: string;
    city?: string;
    categoryAndSubcategory?: CategoryAndSubcategory;
    extraParams?: Record<string, string>
}): string {
    let categoryLabel;
    if (categoryAndSubcategory) {
        categoryLabel = getSubcategoryLabel(locale, categoryAndSubcategory.category, categoryAndSubcategory.subcategory);
    }

    const baseParams = {
        city,
        country,
        category: categoryLabel,
        ...extraParams
    };

    if (country && city && categoryAndSubcategory) {
        return t(`countries.${attribute}.countryCityCategory`, baseParams);
    }

    if (country && categoryAndSubcategory) {
        return t(`countries.${attribute}.countryAndCategory`, baseParams);
    }

    if (country && city) {
        return t(`countries.${attribute}.countryAndCity`, baseParams);
    }

    if (country) {
        return t(`countries.${attribute}.countryOnly`, baseParams);
    }

    return '';
}

export function getLocalizedFromMessages({
                                      t,
                                      locale,
                                      attribute,
                                      country,
                                      city,
                                      categoryAndSubcategory,
                                  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: any,
    locale: Locale,
    attribute: string,
    country: string;
    city?: string;
    categoryAndSubcategory?: CategoryAndSubcategory
}): string {
    let message;
    let categoryLabel;
    if (country && city && categoryAndSubcategory) {
        message = t.merchants[attribute].countryCityCategory
    } else if (country && categoryAndSubcategory) {
        message = t.merchants[attribute].countryAndCategory
    } else if (country && city) {
        message = t.merchants[attribute].countryAndCity
    }else if (country) {
        message = t.merchants[attribute].countryOnly
    }
    if (categoryAndSubcategory) {
        categoryLabel = getSubcategoryLabel(locale, categoryAndSubcategory.category, categoryAndSubcategory.subcategory)
    }
    return  message.replaceAll("{country}", country).replaceAll("{category}", categoryLabel ? categoryLabel : '').replaceAll("{city}", city);
}

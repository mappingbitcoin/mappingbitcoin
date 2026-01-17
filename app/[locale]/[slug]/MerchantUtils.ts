import {Locale} from "@/i18n/types";
import {getSubcategoryLabel} from "@/constants/PlaceCategories";
import {CategoryAndSubcategory} from "@/constants/PlaceOsmDictionary";

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

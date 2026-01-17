"use client";

import {useLocale, useTranslations} from "next-intl";
import { FAQSection } from "@/components/common";
import {getLocalizedCountrySlug} from "@/utils/SlugUtils";
import {Locale} from "@/i18n/types";

type MapFAQProps = {
    country: string;
    city?: string;
    subcategory: string | null;
    lat: number;
    lon: number;
    zoom: number;
    otherCities?: string[];
    otherCategories?: string[];
};

export default function MapFAQ({
                                   country,
                                   city,
                                   subcategory,
                                   lat,
                                   lon,
                                   zoom,
                                   otherCities = [],
                                   otherCategories = []
                               }: MapFAQProps) {
    const locale = useLocale() as Locale;
    const t = useTranslations('countries.faq');

    const MAX_LIST = 10;

    const isGenericCategory = !subcategory || subcategory.toLowerCase() === 'bitcoin-friendly';
    const hasMoreCities = (otherCities?.length || 0) > MAX_LIST;
    const hasMoreCategories = (otherCategories?.length || 0) > MAX_LIST;

    const citiesToShow = otherCities?.slice(0, MAX_LIST).join(", ") ?? "";
    const categoriesToShow = otherCategories?.slice(0, MAX_LIST).join(", ") ?? "";

    const locationWithCountry = city && city.toLowerCase() !== country.toLowerCase()
        ? `${city}, ${country}`
        : country;

    const substitutions = {
        locationWithCountry,
        country,
        countrySlug: getLocalizedCountrySlug(country, locale),
        category: subcategory ?? "Bitcoin-friendly",
        otherCities: citiesToShow,
        otherCategories: categoriesToShow,
        moreCities: hasMoreCities ? " " + t("moreCities") : "",
        moreCategories: hasMoreCategories ? " " + t("moreCategories") : "",
        lat: lat.toFixed(5),
        lon: lon.toFixed(5),
        zoom: String(zoom),
    };

    // 🧠 Apply the filtering logic here before passing to FAQSection
    const filteredFaqs = t.raw('questions') as { question: string; answer: string; showIfCategory: boolean; showIfCity: boolean; }[];

    const relevantFaqs = filteredFaqs.filter((q) => {
        if (q.showIfCategory && isGenericCategory) return false;
        return locationWithCountry === country || (locationWithCountry !== country && q.showIfCity)
    });

    return (
        <FAQSection
            translationKey="countries.faq"
            substitutions={substitutions}
            faqs={relevantFaqs} // override questions to display only filtered ones
        />
    );
}

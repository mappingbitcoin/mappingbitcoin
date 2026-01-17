import countries from "i18n-iso-countries";
import es from "i18n-iso-countries/langs/es.json";
import en from "i18n-iso-countries/langs/en.json";
import {Locale} from "@/i18n/types";

countries.registerLocale(es);
countries.registerLocale(en);

export const getLocalizedCountryName = (locale: Locale, countryCode: string) => countries.getName(countryCode, locale, {select: 'official'})

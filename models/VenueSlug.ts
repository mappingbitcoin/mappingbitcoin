import {CategoryAndSubcategory} from "@/constants/PlaceOsmDictionary";
import {Locale} from "@/i18n/types";

export interface RegionQuery {
    country: string;
    location?: string;
    categoryAndSubcategory?: CategoryAndSubcategory;
}
export interface SEOUrls {
    type: 'city' | 'category' | 'country';
    locale: Locale;
    canonical: string;
    alternates?: Record<Locale, string>;
    alternates_i18n?: Partial<Record<Locale, string[]>>;
}

export type VenueSlugEntrySEO = SEOUrls & RegionQuery

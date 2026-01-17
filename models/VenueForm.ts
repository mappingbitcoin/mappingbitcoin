import {PLACE_SUBTYPE_MAP, PlaceCategory} from "@/constants/PlaceCategories";
import {CommonTag} from "@/constants/CommonOsmTags";

export interface VenueForm {
    name: string;
    placeId?: string;
    category: PlaceCategory | '';
    subcategory: (typeof PLACE_SUBTYPE_MAP)[PlaceCategory][number] | '';
    additionalTags: Partial<Record<CommonTag, string>>;
    type?: string;
    about: string;
    lat: string;
    lon: string;
    address: {
        street: string;
        housenumber: string;
        district: string;
        state: string;
        postcode: string;
        city: string;
        country: string;
    };
    payment: {
        onchain: boolean;
        lightning: boolean;
        lightning_contactless: boolean;
        [key: string]: boolean;
    };
    contact: {
        website: string;
        phone: string;
        email: string;
        [key: string]: string;
    };
    opening_hours: string;
    notes: string;
    role: string;
}

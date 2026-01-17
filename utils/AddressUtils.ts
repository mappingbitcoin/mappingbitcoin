import {EnrichedVenue} from "@/models/Overpass";
import addressFormatter from "@fragaria/address-formatter";
import {Locale} from "@/i18n/types";
import {getLocalizedCountryName} from "@/utils/CountryUtils";

export const getFormattedAddress = (locale: Locale, v: EnrichedVenue) => {
    const address = {
        street: v.tags["addr:street"],
        housenumber: v.tags["addr:housenumber"],
        district: v.tags["addr:district"],
        subdistrict: v.tags["addr:subdistrict"],
        city: v.tags["addr:city"],
        state: v.tags["addr:state"],
        province: v.tags["addr:province"],
        postcode: v.tags["addr:postcode"],
        country: v.tags["addr:country"]
    };
    return addressFormatter
                .format({ ...address, city: v.city, state: v.state, country: getLocalizedCountryName(locale, v.country), countryCode: v.country }, { output: "array" })
                .join(", ")
}

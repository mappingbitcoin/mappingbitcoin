import CountriesPage from "@/app/[locale]/countries/CountriesPage";
import {getLocationCache} from "@/app/api/cache/LocationCache";
import {buildGeneratePageMetadata} from "@/utils/SEOUtils";

export const generateMetadata = buildGeneratePageMetadata('countries')

export default async function CountriesRoute() {
    const locationCache = await getLocationCache();

    return (
        <CountriesPage countries={locationCache.countries}/>
    );
}

import {useMemo} from "react";
import { CategoryChip } from "@/components/ui";
import {useLocale, useTranslations} from "next-intl";
import {parseVenue} from "@/utils/OsmHelpers";
import {EnrichedVenue} from "@/models/Overpass";
import {getSubcategoryLabel} from "@/constants/PlaceCategories";
import {Locale} from "@/i18n/types";

type Props = {
    venue: EnrichedVenue
};

export default function VenueTooltip({ venue }: Props) {
    const t = useTranslations("map.venue-tooltip");
    const locale = useLocale() as Locale

    const {name, formattedAddress} = useMemo(() => {
        return parseVenue(locale, venue);
    }, [locale, venue]);

    return (
        <div className="cursor-pointer max-w-[450px] min-w-[250px] bg-surface border border-border-light rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.3)] py-2 px-4 pointer-events-none hover:pointer-events-auto transition-all duration-200 z-[1000]">
            <div className="flex flex-col gap-2 items-start">
                <div className="flex flex-row flex-wrap gap-2">
                    <CategoryChip as={"div"} category={venue.category || 'other'}>
                        {venue.category && venue.subcategory ? getSubcategoryLabel(locale, venue.category, venue.subcategory) : t("defaultCategory")}
                    </CategoryChip>
                </div>
                <h3 className="text-base max-w-[250px] font-bold text-white">{name}</h3>
                {formattedAddress && <p className="text-[15px] max-w-[250px] text-text-light">{formattedAddress}</p>}
            </div>
        </div>
    );
}

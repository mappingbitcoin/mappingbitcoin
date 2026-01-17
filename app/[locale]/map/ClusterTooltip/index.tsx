import React from "react";
import VenueTooltip from "@/app/[locale]/map/VenueTooltip";
import {EnrichedVenue} from "@/models/Overpass";
import {useLocale, useTranslations} from "next-intl";
import {Locale} from "@/i18n/types";
import {PlaceSubcategory} from "@/constants/PlaceCategories";
import {SUBCATEGORY_SLUGS_BY_LOCALE} from "@/utils/SlugUtils";

type Props = {
    content: EnrichedVenue[] | Record<string, number>;
};

function deslugify(slug: string): string {
    return slug
        .replace(/[-_]/g, " ")           // Replace - or _ with space
        .replace(/\b\w/g, c => c.toUpperCase()); // Capitalize first letter of each word
}

const ClusterTooltip = ({ content }: Props) => {
    const locale = useLocale() as Locale
    const t = useTranslations('map.venue-information')

    return content ? content.length === 1 ?
        ((content as EnrichedVenue[]).map((v, index) => (
                    <VenueTooltip key={index} venue={v}/>
                ))
            ) : (
                <div className="pointer-events-none hover:pointer-events-auto cursor-pointer transition-transform duration-150 ease-in-out bg-surface border border-border-light rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.3)] max-md:hidden">
                    <div className="bg-surface text-white py-2 px-3 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.3)] max-w-[280px]">
                        {Object.entries(content).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([cat, count]) => {
                            const match = SUBCATEGORY_SLUGS_BY_LOCALE[locale][cat as PlaceSubcategory];
                            return match ? (
                                <div key={cat}>
                                    <strong>{deslugify(match)}</strong>: <span className="text-text-light">{count}</span>
                                </div>
                            ) : (
                                <div key={cat}>
                                    <strong>{t('various')}</strong>: <span className="text-text-light">{count}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )
     : null;
}

export default ClusterTooltip

"use client";

import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Locale } from "@/i18n/types";
import { useState } from "react";
import { EnrichedVenue } from "@/models/Overpass";
import { PAYMENT_METHODS } from "@/constants/PaymentMethods";
import { PaymentIcon } from "@/constants/PaymentIcons";
import { parseTags, formatOpeningHours } from "@/utils/OsmHelpers";
import { getSubcategoryLabel } from "@/constants/PlaceCategories";
import { getFormattedAddress } from "@/utils/AddressUtils";
import { StarIcon, ClockIcon, GlobeIcon, DocumentIcon } from "@/assets/icons/ui";
import { PhoneIcon } from "@/assets/icons/contact";

interface PlaceListItemProps {
    place: EnrichedVenue;
    isNew: boolean;
    isHovered: boolean;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

export default function PlaceListItem({
    place,
    isNew,
    isHovered,
    onMouseEnter,
    onMouseLeave,
}: PlaceListItemProps) {
    const t = useTranslations();
    const locale = useLocale() as Locale;
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const { name, paymentMethods, openingHours, contact, description } = parseTags(place.tags);
    const formattedHours = formatOpeningHours(openingHours);
    const categoryLabel = place.subcategory && place.category
        ? getSubcategoryLabel(locale, place.category, place.subcategory)
        : null;

    const enabledPayments = paymentMethods
        ? Object.entries(paymentMethods).filter(([, v]) => v === "yes").map(([type]) => type)
        : [];

    const handleMouseMove = (e: React.MouseEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    return (
        <div
            className="relative group"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onMouseMove={handleMouseMove}
        >
            <Link
                href={`/places/${place.slug || place.id}`}
                className="relative grid grid-cols-[1fr_auto] gap-2 md:gap-3 items-center bg-surface rounded-btn border border-border-light transition-all duration-200 py-2 px-3 text-inherit no-underline hover:border-accent/50 hover:bg-surface-light"
            >
                {/* Name, Category & Address */}
                <div className="min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-white m-0 truncate max-w-[200px] md:max-w-none">
                            {name}
                        </h2>
                        {categoryLabel && (
                            <span className="hidden md:inline font-normal text-text-light text-sm truncate"> - {categoryLabel}</span>
                        )}
                        {isNew && (
                            <span className="hidden md:inline-flex items-center bg-green-500/20 text-green-400 text-[11px] font-medium px-1.5 py-0.5 rounded-full shrink-0">
                                {t("countries.stats.new")}
                            </span>
                        )}
                        {place.rating && (
                            <span className="hidden md:inline-flex items-center gap-0.5 text-[11px] text-amber-500 shrink-0">
                                <StarIcon className="w-3 h-3" />
                                {place.rating.toFixed(1)}
                            </span>
                        )}
                    </div>
                    {categoryLabel && (
                        <span className="md:hidden text-xs text-text-light truncate block">{categoryLabel}</span>
                    )}
                    <span className="text-xs text-text-light block truncate">{getFormattedAddress(locale, place)}</span>
                </div>

                {/* Payment Methods */}
                <div className="flex items-center justify-end shrink-0">
                    {enabledPayments.length > 0 ? (
                        <div className="flex items-center" style={{ marginRight: `${Math.max(0, (enabledPayments.length - 1) * 4)}px` }}>
                            {enabledPayments.map((type, idx) => {
                                const info = PAYMENT_METHODS[type];
                                if (!info) return null;
                                return (
                                    <span
                                        key={type}
                                        className="flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full bg-accent/10 text-accent border border-surface"
                                        style={{ marginLeft: idx > 0 ? "-6px" : 0, zIndex: enabledPayments.length - idx }}
                                        title={info.label}
                                    >
                                        <PaymentIcon type={type} className="w-3.5 h-3.5" />
                                    </span>
                                );
                            })}
                        </div>
                    ) : (
                        <span className="text-text-light text-xs">—</span>
                    )}
                </div>
            </Link>

            {/* Floating Tooltip - follows mouse pointer */}
            {isHovered && (formattedHours || contact?.phone || contact?.website || description) && (
                <div
                    className="hidden md:block fixed z-50 pointer-events-none"
                    style={{
                        left: mousePos.x + 16,
                        top: mousePos.y + 16,
                    }}
                >
                    <div className="bg-surface border border-border-light rounded-lg shadow-lg p-3 text-xs w-64">
                        <h4 className="text-white font-semibold mb-2 truncate">{name}</h4>
                        <div className="grid gap-1.5">
                            {formattedHours && (
                                <div className="flex items-start gap-2">
                                    <ClockIcon className="w-3.5 h-3.5 shrink-0 text-text-light" />
                                    <span className="text-text-light">{formattedHours}</span>
                                </div>
                            )}
                            {contact?.phone && (
                                <div className="flex items-center gap-2">
                                    <PhoneIcon className="w-3.5 h-3.5 shrink-0 text-text-light" />
                                    <span className="text-text-light">{contact.phone}</span>
                                </div>
                            )}
                            {contact?.website && (
                                <div className="flex items-center gap-2">
                                    <GlobeIcon className="w-3.5 h-3.5 shrink-0 text-text-light" />
                                    <span className="text-accent truncate">{contact.website.replace(/^https?:\/\//, "")}</span>
                                </div>
                            )}
                            {description && (
                                <div className="flex items-start gap-2 pt-1.5 mt-1.5 border-t border-border-light">
                                    <DocumentIcon className="w-3.5 h-3.5 shrink-0 text-text-light" />
                                    <span className="text-text-light line-clamp-2">{description}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

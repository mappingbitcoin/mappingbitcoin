"use client";

import React from "react";
import { useLocale } from "next-intl";
import { Locale } from "@/i18n/types";
import { VenueForm } from "@/models/VenueForm";
import { PAYMENT_METHODS } from "@/constants/PaymentMethods";
import { getSubcategoryLabel, PLACE_CATEGORIES, PlaceCategory } from "@/constants/PlaceCategories";
import OpeningHoursDisplay from "./OpeningHoursDisplay";
import { PinIcon, GlobeIcon, ClockIcon } from "@/assets/icons/ui";
import { PhoneIcon } from "@/assets/icons/contact";
import { BuildingIcon } from "@/assets/icons/location";

interface PlacePreviewProps {
    form: VenueForm;
}

export default function PlacePreview({ form }: PlacePreviewProps) {
    const locale = useLocale() as Locale;

    const hasBasicInfo = form.name || form.category;
    const hasLocation = form.address.street || form.address.city || form.address.country;
    const hasPayment = form.payment.onchain || form.payment.lightning || form.payment.lightning_contactless;

    // Format address
    const addressParts = [
        form.address.street,
        form.address.housenumber,
        form.address.city,
        form.address.state,
        form.address.postcode,
        form.address.country
    ].filter(Boolean);
    const formattedAddress = addressParts.join(", ");

    // Get category label
    const getCategoryDisplay = () => {
        if (form.subcategory && form.category) {
            return getSubcategoryLabel(locale, form.category as PlaceCategory, form.subcategory);
        }
        if (form.category) {
            return PLACE_CATEGORIES[locale]?.[form.category as PlaceCategory]?.label || form.category;
        }
        return null;
    };

    if (!hasBasicInfo && !hasLocation) {
        return (
            <div className="h-full min-h-[300px] flex items-center justify-center text-center p-6">
                <div className="text-text-light">
                    <BuildingIcon className="w-12 h-12 mx-auto mb-3 text-border" />
                    <p className="text-sm font-medium">Place Preview</p>
                    <p className="text-xs mt-1">Fill in the form to see a preview</p>
                </div>
            </div>
        );
    }

    const categoryLabel = getCategoryDisplay();

    return (
        <div className="p-4">
            {/* Header */}
            <div className="mb-4">
                <h3 className="text-lg font-bold text-white leading-tight">
                    {form.name || "Place Name"}
                </h3>
                {categoryLabel && (
                    <p className="text-sm text-text-light mt-1">{categoryLabel}</p>
                )}
            </div>

            {/* About */}
            {form.about && (
                <p className="text-sm text-text-light mb-4 leading-relaxed">{form.about}</p>
            )}

            {/* Info Items */}
            <div className="space-y-3">
                {/* Location */}
                {hasLocation && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center shrink-0">
                            <PinIcon className="w-4 h-4 text-text-light" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-text-light uppercase tracking-wide mb-0.5">Address</p>
                            <p className="text-sm text-white leading-snug">{formattedAddress}</p>
                        </div>
                    </div>
                )}

                {/* Website */}
                {form.contact.website && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center shrink-0">
                            <GlobeIcon className="w-4 h-4 text-text-light" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-text-light uppercase tracking-wide mb-0.5">Website</p>
                            <p className="text-sm text-accent truncate">{form.contact.website.replace(/^https?:\/\//, '')}</p>
                        </div>
                    </div>
                )}

                {/* Phone */}
                {form.contact.phone && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center shrink-0">
                            <PhoneIcon className="w-4 h-4 text-text-light" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-text-light uppercase tracking-wide mb-0.5">Phone</p>
                            <p className="text-sm text-white">{form.contact.phone}</p>
                        </div>
                    </div>
                )}

                {/* Opening Hours */}
                {form.opening_hours && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center shrink-0">
                            <ClockIcon className="w-4 h-4 text-text-light" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-text-light uppercase tracking-wide mb-0.5">Hours</p>
                            <div className="text-sm">
                                <OpeningHoursDisplay openingHours={form.opening_hours} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Payment Methods */}
            {hasPayment && (
                <div className="mt-4 pt-4 border-t border-border-light">
                    <p className="text-[10px] text-text-light uppercase tracking-wide mb-2">Payment Methods</p>
                    <div className="flex flex-wrap gap-1.5">
                        {Object.entries(form.payment).map(([key, enabled]) => {
                            if (!enabled) return null;
                            const info = PAYMENT_METHODS[key];
                            if (!info) return null;
                            return (
                                <span
                                    key={key}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-surface-light rounded text-xs text-white"
                                >
                                    <span>{info.icon}</span>
                                    {info.label}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Notes */}
            {form.notes && (
                <div className="mt-4 pt-4 border-t border-border-light">
                    <p className="text-[10px] text-text-light uppercase tracking-wide mb-1">Notes</p>
                    <p className="text-sm text-text-light leading-relaxed">{form.notes}</p>
                </div>
            )}
        </div>
    );
}

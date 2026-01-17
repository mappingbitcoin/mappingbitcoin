"use client";

import React from "react";
import { useLocale } from "next-intl";
import { Locale } from "@/i18n/types";
import { VenueForm } from "@/models/VenueForm";
import { PAYMENT_METHODS } from "@/constants/PaymentMethods";
import { getSubcategoryLabel, PLACE_CATEGORIES, PlaceCategory } from "@/constants/PlaceCategories";
import OpeningHoursDisplay from "./OpeningHoursDisplay";

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
                    <svg className="w-12 h-12 mx-auto mb-3 text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
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
                            <svg className="w-4 h-4 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
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
                            <svg className="w-4 h-4 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
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
                            <svg className="w-4 h-4 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
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
                            <svg className="w-4 h-4 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
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

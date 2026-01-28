"use client";

import React, { useMemo, useState, FormEvent } from "react";
import toast from 'react-hot-toast';
import Script from "next/script";
import { useRouter } from '@/i18n/navigation';
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { parseOpeningHours, stringifyOpeningHours } from "@/utils/OpeningHoursParser";
import { Locale } from "@/i18n/types";
import { useOsmUser } from "@/providers/OsmAuth";
import { LoginWithOSM } from "@/components/auth";
import {
    PLACE_SUBTYPE_MAP,
    PlaceCategory,
    matchPlaceSubcategory
} from "@/constants/PlaceCategories";
import { VenueForm } from "@/models/VenueForm";
import { EnrichedVenue } from "@/models/Overpass";
import { parseTags } from "@/utils/OsmHelpers";
import { Link } from "@/i18n/navigation";
import {
    FormSection,
    FormInput,
    FormTextarea,
    PaymentMethodsSelector,
    CategorySelector,
    LocationSection,
} from "@/components/place-form";

// Dynamically import components that may have SSR issues
const OpeningHoursPicker = dynamic(
    () => import("@/components/forms/OpeningHoursPicker"),
    { ssr: false }
);

const SocialLinksEditor = dynamic(
    () => import("@/components/place/SocialLinksEditor"),
    { ssr: false }
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const grecaptcha: any;

function venueToForm(venue: EnrichedVenue): VenueForm {
    const { name, paymentMethods, contact, openingHours, description, note } = parseTags(venue.tags);
    const match = venue.subcategory ? matchPlaceSubcategory(venue.subcategory) : null;

    return {
        name: name || "",
        category: (match?.category || venue.category || "other") as PlaceCategory,
        subcategory: match?.subcategory || venue.subcategory || "",
        additionalTags: {},
        about: description || '',
        lat: String(venue.lat),
        lon: String(venue.lon),
        address: {
            street: venue.tags["addr:street"] || "",
            housenumber: venue.tags["addr:housenumber"] || "",
            district: venue.tags["addr:district"] || "",
            state: venue.state || "",
            postcode: venue.tags["addr:postcode"] || "",
            city: venue.city || "",
            country: venue.country || "",
        },
        payment: {
            onchain: paymentMethods?.onchain === "yes",
            lightning: paymentMethods?.lightning === "yes",
            lightning_contactless: paymentMethods?.lightning_contactless === "yes",
        },
        contact: {
            website: contact?.website || "",
            phone: contact?.phone || "",
            email: contact?.email || "",
        },
        opening_hours: openingHours || "",
        notes: note || "",
        role: "",
    };
}

export default function VenueEditForm({ venue }: { venue: EnrichedVenue }) {
    const { user } = useOsmUser();
    const t = useTranslations('venues.form');
    const locale = useLocale() as Locale;
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState<VenueForm>(() => venueToForm(venue));

    const { name: venueName } = parseTags(venue.tags);

    const parsedHours = useMemo(() => {
        return parseOpeningHours(form.opening_hours || "");
    }, [form.opening_hours]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error("Please log in with OpenStreetMap first");
            return;
        }

        setIsSubmitting(true);

        try {
            const token = await grecaptcha.execute(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY, { action: "submit" });

            const res = await fetch(`/api/places/${venue.slug || venue.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ venue: form, captcha: token }),
            });

            const json = await res.json();
            if (res.ok && json.ok) {
                toast.success("Changes submitted to OpenStreetMap!");
                router.push(`/places/${venue.slug || venue.id}`);
            } else {
                toast.error(json.error || "Failed to submit changes");
            }
        } catch (err) {
            toast.error("Failed to submit changes");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Script
                src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
                strategy="lazyOnload"
            />

            {/* Hero Section */}
            <section className="w-full bg-gradient-primary pt-20 pb-10 px-8 max-md:px-4">
                <div className="max-w-3xl mx-auto">
                    {/* Breadcrumb */}
                    <nav aria-label="Breadcrumb" className="mb-6">
                        <ol className="flex flex-wrap list-none gap-2 text-sm [&_li]:after:content-['/'] [&_li]:after:ml-2 [&_li]:after:text-white/50 [&_li:last-child]:after:content-[''] [&_li:last-child]:after:m-0 [&_a]:text-white/80 [&_a]:no-underline [&_a]:transition-colors [&_a:hover]:text-white [&_span]:text-white">
                            <li>
                                <Link href="/countries">Countries</Link>
                            </li>
                            <li>
                                <Link href={`/places/${venue.slug || venue.id}`}>{venueName}</Link>
                            </li>
                            <li>
                                <span>Edit</span>
                            </li>
                        </ol>
                    </nav>

                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                                Edit Venue
                            </h1>
                            <p className="text-white/70 text-lg">
                                Suggest changes to <strong className="text-white font-medium">{venueName}</strong>
                            </p>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-white/80 text-sm">Changes go to OpenStreetMap</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Form Section */}
            <section className="w-full bg-primary py-10 px-8 max-md:px-4 min-h-[60vh]">
                <div className="max-w-3xl mx-auto">
                    {!user ? (
                        <FormSection title="Login Required" className="text-center py-8">
                            <div className="max-w-md mx-auto">
                                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <p className="text-text-light mb-6">
                                    To suggest edits, you need to log in with your OpenStreetMap account.
                                    Your changes will be attributed to your OSM profile.
                                </p>
                                <LoginWithOSM />
                            </div>
                        </FormSection>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Information */}
                            <FormSection
                                title={t('basicInformation')}
                                description="Core details about the venue"
                            >
                                <div className="space-y-5">
                                    <FormInput
                                        label={t('fields.name')}
                                        name="name"
                                        value={form.name}
                                        onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                        required
                                        placeholder="Enter venue name"
                                    />

                                    <CategorySelector
                                        category={form.category as PlaceCategory}
                                        subcategory={form.subcategory}
                                        onCategoryChange={(cat) => {
                                            const validSubcats = PLACE_SUBTYPE_MAP[cat] as readonly string[] || [];
                                            setForm(prev => ({
                                                ...prev,
                                                category: cat,
                                                subcategory: validSubcats.includes(prev.subcategory)
                                                    ? prev.subcategory
                                                    : '',
                                            }));
                                        }}
                                        onSubcategoryChange={(sub) => setForm(prev => ({ ...prev, subcategory: sub as typeof prev.subcategory }))}
                                        required
                                    />

                                    <FormTextarea
                                        label={t('fields.about')}
                                        name="about"
                                        value={form.about}
                                        onChange={(e) => setForm(prev => ({ ...prev, about: e.target.value }))}
                                        rows={3}
                                        placeholder="Brief description of the venue..."
                                    />
                                </div>
                            </FormSection>

                            {/* Location */}
                            <FormSection
                                title="Location"
                                description="Adjust the marker to set the exact position"
                            >
                                <LocationSection
                                    lat={form.lat}
                                    lon={form.lon}
                                    address={{
                                        street: form.address.street,
                                        housenumber: form.address.housenumber,
                                        city: form.address.city,
                                        state: form.address.state,
                                        postcode: form.address.postcode,
                                        country: form.address.country,
                                    }}
                                    onMapMove={(lat, lon) => {
                                        setForm(prev => ({ ...prev, lat: String(lat), lon: String(lon) }));
                                    }}
                                    onAddressChange={(field, value) => {
                                        setForm(prev => ({
                                            ...prev,
                                            address: { ...prev.address, [field]: value },
                                        }));
                                    }}
                                />
                            </FormSection>

                            {/* Payment Methods */}
                            <FormSection
                                title={t('fields.paymentMethods')}
                                description="Select all Bitcoin payment methods accepted"
                            >
                                <PaymentMethodsSelector
                                    value={form.payment}
                                    onChange={(key, checked) => {
                                        setForm(prev => ({
                                            ...prev,
                                            payment: { ...prev.payment, [key]: checked },
                                        }));
                                    }}
                                />
                            </FormSection>

                            {/* Opening Hours */}
                            <FormSection
                                title={t('fields.openingHours')}
                                description="Set the regular operating hours"
                            >
                                <OpeningHoursPicker
                                    value={parsedHours}
                                    onChange={(hours) => {
                                        setForm(prev => ({ ...prev, opening_hours: stringifyOpeningHours(hours) }));
                                    }}
                                />
                            </FormSection>

                            {/* Contact Information */}
                            <FormSection
                                title={t('fields.contact')}
                                description="How customers can reach this venue"
                            >
                                <SocialLinksEditor
                                    contact={form.contact}
                                    onChange={(contact: Record<string, string>) => {
                                        setForm(prev => ({ ...prev, contact: { ...prev.contact, ...contact } }));
                                    }}
                                />
                            </FormSection>

                            {/* Notes */}
                            <FormSection
                                title={t('fields.notes')}
                                description="Any additional notes about your changes"
                            >
                                <FormTextarea
                                    name="notes"
                                    value={form.notes}
                                    onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                                    rows={3}
                                    placeholder="Describe why you're making these changes..."
                                />
                            </FormSection>

                            {/* Submit Section */}
                            <div className="bg-surface rounded-2xl border border-border-light shadow-sm p-6">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="text-center sm:text-left">
                                        <p className="text-sm text-text-light">
                                            Your changes will be submitted to OpenStreetMap and will be publicly visible.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Link
                                            href={`/places/${venue.slug || venue.id}`}
                                            className="px-5 py-2.5 text-sm font-medium text-text-light hover:text-white transition-colors no-underline"
                                        >
                                            Cancel
                                        </Link>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="bg-accent hover:bg-accent-dark text-white py-2.5 px-6 rounded-xl font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-md"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Submit Changes
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </section>
        </>
    );
}

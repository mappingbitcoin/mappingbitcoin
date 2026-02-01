"use client";

import React, { useEffect, useMemo, useState, FormEvent, useRef } from "react";
import toast from 'react-hot-toast';
import { useRouter } from '@/i18n/navigation';
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import {
    parseOpeningHours,
    stringifyOpeningHours,
    DayHours,
} from "@/utils/OpeningHoursParser";
import { Locale } from "@/i18n/types";
import addressFormatter from "@fragaria/address-formatter";
import { findOne } from "country-codes-list";
import { useOsmUser } from "@/providers/OsmAuth";
import { LoginWithOSM } from "@/components/auth";
import { COMMON_TAG_TRANSLATIONS, CommonTag } from "@/constants/CommonOsmTags";
import {
    PlaceCategory,
    matchPlaceSubcategory,
} from "@/constants/PlaceCategories";
import {
    COMMON_TAG_INPUT_TYPES,
    COMMON_TAG_SUGGESTIONS,
    CommonTagCustomization,
    PLACE_CUSTOMIZATION_META
} from "@/constants/PlaceOsmDictionary";
import { VenueForm } from "@/models/VenueForm";
import { EnrichedVenue } from "@/models/Overpass";
import { parseTags } from "@/utils/OsmHelpers";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import {
    FormTextarea,
    PaymentMethodsSelector,
    CategorySelector,
    LocationSection,
    PlacePreview,
} from "@/components/place-form";
import { useAddressAutocomplete, reverseGeocode } from "@/hooks/useAddressAutocomplete";
import { useVenueSearch, fetchVenueDetails } from "@/hooks/useVenueSearch";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import {
    CheckmarkIcon,
    SpinnerIcon,
    SearchIcon,
    DirectionsIcon,
    CloseIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    SendIcon,
} from "@/assets/icons";
import Button, { TagRemoveButton } from "@/components/ui/Button";

interface VenueSubmissionFormProps {
    venue?: EnrichedVenue; // If provided, form is in edit mode
}

function venueToForm(venue: EnrichedVenue): VenueForm {
    const { name, paymentMethods, contact, openingHours, description, note } = parseTags(venue.tags);
    const match = venue.subcategory ? matchPlaceSubcategory(venue.subcategory) : null;

    return {
        name: name || "",
        category: (match?.category || venue.category || "other") as PlaceCategory,
        subcategory: (match?.subcategory || venue.subcategory || "") as VenueForm["subcategory"],
        additionalTags: {},
        about: description || '',
        image: venue.tags?.image || undefined,
        lat: String(venue.lat),
        lon: String(venue.lon),
        address: {
            street: venue.tags?.["addr:street"] || "",
            housenumber: venue.tags?.["addr:housenumber"] || "",
            district: venue.tags?.["addr:district"] || "",
            state: venue.state || "",
            postcode: venue.tags?.["addr:postcode"] || "",
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
            instagram: contact?.instagram || "",
            facebook: contact?.facebook || "",
            twitter: contact?.twitter || "",
            telegram: contact?.telegram || "",
            linkedin: contact?.linkedin || "",
            youtube: contact?.youtube || "",
            tiktok: contact?.tiktok || "",
            whatsapp: contact?.whatsapp || "",
        },
        opening_hours: openingHours || "",
        notes: note || "",
        role: "",
    };
}

const OpeningHoursPicker = dynamic(
    () => import("@/components/forms/OpeningHoursPicker"),
    { ssr: false }
);

const SocialLinksEditor = dynamic(
    () => import("@/components/place/SocialLinksEditor"),
    { ssr: false }
);

const VenueImageUploader = dynamic(
    () => import("@/components/place/VenueImageUploader"),
    { ssr: false }
);

const EMPTY_FORM: VenueForm = {
    name: "",
    category: "",
    subcategory: "",
    additionalTags: {},
    about: '',
    image: undefined,
    lat: "",
    lon: "",
    address: {
        street: "",
        housenumber: "",
        district: "",
        state: "",
        postcode: "",
        city: "",
        country: "",
    },
    payment: {
        onchain: false,
        lightning: false,
        lightning_contactless: false,
    },
    contact: {
        website: "",
        phone: "",
        email: "",
    },
    opening_hours: "",
    notes: "",
    role: "",
};

const STORAGE_KEY = "venue_form_data";

const STEPS = [
    { key: 1, label: 'About', desc: 'Basic info' },
    { key: 2, label: 'Location', desc: 'Address' },
    { key: 3, label: 'Details', desc: 'Hours & pay' }
];

export default function VenueSubmissionForm({ venue }: VenueSubmissionFormProps) {
    const { user } = useOsmUser();
    const t = useTranslations('venues.form');
    const locale = useLocale() as Locale;
    const router = useRouter();
    const [step, setStep] = useState<number>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const [suggestedSubcategories, setSuggestedSubcategories] = useState<string[]>([]);

    const isEditMode = Boolean(venue);

    const [form, setForm] = useState<VenueForm>(() => {
        // In edit mode, initialize from venue
        if (venue) {
            return venueToForm(venue);
        }
        // In create mode, try to restore from session storage
        if (typeof window !== "undefined") {
            const stored = sessionStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : EMPTY_FORM;
        }
        return EMPTY_FORM;
    });

    const venueSelectorRef = useRef<HTMLDivElement>(null);
    const addressSelectorRef = useRef<HTMLUListElement>(null);

    // Address autocomplete using Photon (free, OpenStreetMap-based)
    const {
        value: addressValue,
        setValue: setAddressValue,
        suggestions: addressSuggestions,
        isLoading: addressLoading,
        clearSuggestions: clearAddressSuggestions,
        selectSuggestion: selectAddressSuggestion,
    } = useAddressAutocomplete({ debounceMs: 300, limit: 5 });

    // Venue search using Photon (free, OpenStreetMap-based)
    const {
        value: venueValue,
        setValue: setVenueValue,
        suggestions: venueSuggestions,
        isLoading: venueLoading,
        clearSuggestions: clearVenueSuggestions,
    } = useVenueSearch({ debounceMs: 300, limit: 6 });

    // reCAPTCHA - loads lazily when getToken is called
    const { getToken: getRecaptchaToken, preload: preloadRecaptcha } = useRecaptcha({ action: "submit" });

    useOnClickOutside([venueSelectorRef], () => clearVenueSuggestions());
    useOnClickOutside([addressSelectorRef], () => clearAddressSuggestions());

    // Only save to session storage in create mode
    useEffect(() => {
        if (!isEditMode) {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form));
        }
    }, [form, isEditMode]);

    const parsedOpeningHours: DayHours[] = useMemo(() => parseOpeningHours(form.opening_hours), [form.opening_hours]);

    function changeStep(newStep: number) {
        setStep(newStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Handle address selection from autocomplete (using Photon/OSM)
    function handleSelectAddress(suggestion: typeof addressSuggestions[0]) {
        selectAddressSuggestion(suggestion);
        setForm((prev) => ({
            ...prev,
            lat: suggestion.lat.toString(),
            lon: suggestion.lon.toString(),
            address: {
                street: suggestion.address.street || "",
                city: suggestion.address.city || "",
                country: suggestion.address.country || "",
                housenumber: suggestion.address.housenumber || "",
                district: suggestion.address.district || "",
                state: suggestion.address.state || "",
                postcode: suggestion.address.postcode || "",
            },
        }));
    }

    // Handle venue selection from search (using Photon/OSM)
    async function handleSelectVenue(suggestion: typeof venueSuggestions[0]) {
        clearVenueSuggestions();
        setVenueValue(suggestion.name, false);

        // Update form with basic venue info from suggestion
        setForm((prev) => ({
            ...prev,
            name: suggestion.name,
            lat: suggestion.lat.toString(),
            lon: suggestion.lon.toString(),
            address: {
                street: suggestion.address.street || prev.address.street,
                city: suggestion.address.city || prev.address.city,
                country: suggestion.address.country || prev.address.country,
                housenumber: suggestion.address.housenumber || prev.address.housenumber,
                district: suggestion.address.district || prev.address.district,
                state: suggestion.address.state || prev.address.state,
                postcode: suggestion.address.postcode || prev.address.postcode,
            },
        }));

        // Update address search field with formatted address
        setAddressValue(suggestion.label, false);

        // Fetch additional details from OSM (opening hours, website, socials, etc.)
        try {
            const details = await fetchVenueDetails(suggestion.osmType, suggestion.osmId);
            if (details) {
                setForm((prev) => {
                    const updatedContact = { ...prev.contact };

                    // Contact info
                    if (details.website || details["contact:website"]) {
                        updatedContact.website = details.website || details["contact:website"];
                    }
                    if (details.phone || details["contact:phone"]) {
                        updatedContact.phone = details.phone || details["contact:phone"];
                    }
                    if (details.email || details["contact:email"]) {
                        updatedContact.email = details.email || details["contact:email"];
                    }
                    // Social links
                    if (details["contact:instagram"]) updatedContact.instagram = details["contact:instagram"];
                    if (details["contact:facebook"]) updatedContact.facebook = details["contact:facebook"];
                    if (details["contact:twitter"]) updatedContact.twitter = details["contact:twitter"];
                    if (details["contact:telegram"]) updatedContact.telegram = details["contact:telegram"];
                    if (details["contact:linkedin"]) updatedContact.linkedin = details["contact:linkedin"];
                    if (details["contact:youtube"]) updatedContact.youtube = details["contact:youtube"];
                    if (details["contact:tiktok"]) updatedContact.tiktok = details["contact:tiktok"];
                    if (details["contact:whatsapp"]) updatedContact.whatsapp = details["contact:whatsapp"];

                    return {
                        ...prev,
                        contact: updatedContact,
                        opening_hours: details.opening_hours || prev.opening_hours,
                        about: details.description || prev.about,
                    };
                });
            }
        } catch (err) {
            console.warn("Could not fetch venue details:", err);
        }
    }

    // Handle map marker drag - reverse geocode to get address
    async function handleMapMove(lat: number, lon: number) {
        setForm((prev) => ({ ...prev, lat: String(lat), lon: String(lon) }));

        // Reverse geocode to update address
        const address = await reverseGeocode(lat, lon);
        if (address) {
            setForm((prev) => ({
                ...prev,
                address: {
                    street: address.street || prev.address.street,
                    city: address.city || prev.address.city,
                    country: address.country || prev.address.country,
                    housenumber: address.housenumber || prev.address.housenumber,
                    district: address.district || prev.address.district,
                    state: address.state || prev.address.state,
                    postcode: address.postcode || prev.address.postcode,
                },
            }));
        }
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!user) {
            toast.error("Please login with OpenStreetMap first.");
            return;
        }
        if (!form.category || !form.subcategory) {
            toast.error("Please select a category and subcategory.");
            return;
        }
        setIsSubmitting(true);
        try {
            const token = await getRecaptchaToken();

            if (isEditMode && venue) {
                // Edit mode - PUT to update existing venue
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
            } else {
                // Create mode - POST to create new venue
                const res = await fetch("/api/places", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        venue: form,
                        captcha: token,
                        suggestedSubcategories: suggestedSubcategories.length > 0 ? suggestedSubcategories : undefined,
                    }),
                });
                const json = await res.json();
                if (res.ok && json.changesetId) {
                    sessionStorage.removeItem(STORAGE_KEY);
                    toast.success("Venue submitted!");
                    router.push(`/places/${json.changesetId}?preview=true`);
                } else {
                    toast.error(json.error || "Submission failed");
                }
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Submission failed");
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleReset = () => {
        setForm(EMPTY_FORM);
        setAddressValue("", false);
        setVenueValue("", false);
        setSuggestedSubcategories([]);
        sessionStorage.removeItem(STORAGE_KEY);
        toast.success("Form reset");
    };

    const handleSuggestSubcategory = (suggestion: string) => {
        if (!suggestedSubcategories.includes(suggestion)) {
            setSuggestedSubcategories([...suggestedSubcategories, suggestion]);
            toast.success(`"${suggestion}" added as suggestion`);
        }
    };

    const venueName = venue ? parseTags(venue.tags).name : null;

    return (
        <>
            {/* Hero Section */}
            <div className="w-full bg-gradient-primary pt-24 pb-10 px-8 max-md:px-4">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        {isEditMode ? "Edit Venue" : "Add a New Venue"}
                    </h1>
                    <p className="text-white/70 text-lg">
                        {isEditMode
                            ? <>Suggest changes to <strong className="text-white font-medium">{venueName}</strong></>
                            : "Help grow the Bitcoin merchant network by adding a new location"
                        }
                    </p>
                </div>
            </div>

            <section className="w-full bg-primary min-h-screen py-8">
                <div className="max-w-6xl mx-auto px-4 md:px-8">
                    {/* Two-column layout */}
                    <div className="flex gap-6 items-start">
                        {/* Main Form Card */}
                        <div className="flex-1 bg-surface rounded-2xl border border-border-light shadow-sm overflow-hidden">
                            {/* Step Tabs */}
                            <div className="flex border-b border-border-light">
                                {STEPS.map((s) => (
                                    <button
                                        key={s.key}
                                        type="button"
                                        onClick={() => changeStep(s.key)}
                                        className={`flex-1 py-3 px-2 transition-all relative ${step === s.key ? 'bg-accent/10' : 'hover:bg-surface-light'}`}
                                    >
                                        <div className="flex flex-col items-center gap-0.5">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                                                step === s.key ? 'bg-accent text-white' :
                                                step > s.key ? 'bg-green-500 text-white' : 'bg-surface-light text-text-light'
                                            }`}>
                                                {step > s.key ? (
                                                    <CheckmarkIcon className="w-3.5 h-3.5" />
                                                ) : s.key}
                                            </div>
                                            <span className={`text-xs font-medium ${step === s.key ? 'text-accent' : 'text-white'}`}>{s.label}</span>
                                            <span className="text-[10px] text-text-light hidden sm:block">{s.desc}</span>
                                        </div>
                                        {step === s.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
                                    </button>
                                ))}
                            </div>

                            {/* Form Content */}
                            <form onSubmit={handleSubmit}>
                                <div className="p-5 space-y-5">
                                    {/* Step 1 */}
                                    {step === 1 && (
                                        <>
                                            {/* Top row: Image on left, Name/Category on right - 50/50 */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                {/* Left column: Image uploader */}
                                                <div>
                                                    <VenueImageUploader
                                                        value={form.image}
                                                        onChange={(url) => setForm(prev => ({ ...prev, image: url }))}
                                                        onUploadingChange={setIsImageUploading}
                                                    />
                                                </div>

                                                {/* Right column: Name and Category */}
                                                <div className="space-y-4">
                                                    {/* Venue Name Search */}
                                                    <div ref={venueSelectorRef} className="relative">
                                                        <label className="text-sm font-medium text-white block mb-1">
                                                            {t('fields.name')} <span className="text-red-500">*</span>
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                placeholder={t('searchVenueName')}
                                                                value={form.name}
                                                                onChange={(e) => {
                                                                    const newValue = e.target.value;
                                                                    setForm(prev => ({ ...prev, name: newValue }));
                                                                    // Trigger venue search for suggestions
                                                                    setVenueValue(newValue);
                                                                }}
                                                                autoComplete="off"
                                                                className="w-full py-2.5 px-3 pr-9 border border-border-light rounded-xl text-sm text-white bg-surface-light placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                                                            />
                                                            {venueLoading ? (
                                                                <SpinnerIcon className="w-4 h-4 text-accent absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
                                                            ) : (
                                                                <SearchIcon className="w-4 h-4 text-text-light absolute right-3 top-1/2 -translate-y-1/2" />
                                                            )}
                                                        </div>
                                                        {venueSuggestions.length > 0 && (
                                                            <ul className="absolute z-50 w-full mt-1 bg-surface-light border border-border-light rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                                                {venueSuggestions.map((suggestion) => (
                                                                    <li
                                                                        key={suggestion.id}
                                                                        onClick={() => handleSelectVenue(suggestion)}
                                                                        className="px-3 py-2.5 cursor-pointer hover:bg-surface text-sm text-white border-b border-border-light/50 last:border-b-0"
                                                                    >
                                                                        <div className="font-medium">{suggestion.name}</div>
                                                                        <div className="text-xs text-text-light mt-0.5">{suggestion.label}</div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                        <p className="text-xs text-text-light mt-1">Search existing venues or type a new name</p>
                                                    </div>

                                                    {/* Category */}
                                                    <CategorySelector
                                                        category={form.category as PlaceCategory | ''}
                                                        subcategory={form.subcategory}
                                                        onCategoryChange={(cat) => setForm(prev => ({ ...prev, category: cat, subcategory: '' as VenueForm["subcategory"] }))}
                                                        onSubcategoryChange={(sub) => setForm(prev => ({ ...prev, subcategory: sub as VenueForm["subcategory"] }))}
                                                        onSuggestSubcategory={handleSuggestSubcategory}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {/* Suggested subcategories */}
                                            {suggestedSubcategories.length > 0 && (
                                                <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
                                                    <p className="text-xs text-accent font-medium mb-1.5">Suggested (pending review):</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {suggestedSubcategories.map((s) => (
                                                            <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/20 text-accent rounded text-xs">
                                                                {s}
                                                                <TagRemoveButton
                                                                    onClick={() => setSuggestedSubcategories(suggestedSubcategories.filter(x => x !== s))}
                                                                    className="hover:text-white"
                                                                    aria-label={`Remove ${s}`}
                                                                />
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* About */}
                                            <FormTextarea
                                                label={t('fields.about')}
                                                value={form.about}
                                                onChange={(e) => setForm(prev => ({ ...prev, about: e.target.value }))}
                                                rows={2}
                                                placeholder="Brief description..."
                                            />

                                            {/* Additional Tags */}
                                            {form.subcategory && PLACE_CUSTOMIZATION_META[form.subcategory as keyof typeof PLACE_CUSTOMIZATION_META]?.customizable && (
                                                <div className="border-t border-border-light pt-4">
                                                    <h3 className="text-sm font-medium text-white mb-3">{t('additionalDetails')}</h3>
                                                    <div className="grid gap-3">
                                                        {(PLACE_CUSTOMIZATION_META[form.subcategory as keyof typeof PLACE_CUSTOMIZATION_META] as CommonTagCustomization).commonTags.map((tag: CommonTag) => {
                                                            const tagType = COMMON_TAG_INPUT_TYPES[tag] || 'input';
                                                            const rawValue = form.additionalTags?.[tag] || '';
                                                            const valueList = rawValue.split(';').map(v => v.trim()).filter(Boolean);
                                                            const suggestions = COMMON_TAG_SUGGESTIONS[tag] || [];

                                                            if (tagType === 'boolean') {
                                                                return (
                                                                    <label key={tag} className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${rawValue === 'yes' ? 'border-accent bg-accent/10' : 'border-border-light hover:border-accent/40'}`}>
                                                                        <input type="checkbox" checked={rawValue === 'yes'} onChange={(e) => setForm(prev => ({ ...prev, additionalTags: { ...prev.additionalTags, [tag]: e.target.checked ? 'yes' : 'no' } }))} className="sr-only" />
                                                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${rawValue === 'yes' ? 'bg-accent border-accent' : 'border-border-light'}`}>
                                                                            {rawValue === 'yes' && <CheckmarkIcon className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                                                                        </div>
                                                                        <span className="text-sm text-white">{COMMON_TAG_TRANSLATIONS[locale][tag]}</span>
                                                                    </label>
                                                                );
                                                            }
                                                            return (
                                                                <div key={tag}>
                                                                    <label className="text-sm font-medium text-white block mb-1">{COMMON_TAG_TRANSLATIONS[locale][tag]}</label>
                                                                    <div className="flex flex-wrap gap-1.5 p-2 bg-surface-light rounded-lg border border-border-light">
                                                                        {valueList.map((val) => (
                                                                            <span key={val} className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface border border-border-light rounded text-xs text-white">
                                                                                {val}
                                                                                <button type="button" onClick={() => {
                                                                                    const updated = valueList.filter(v => v !== val);
                                                                                    setForm(prev => ({ ...prev, additionalTags: { ...prev.additionalTags, [tag]: updated.join(';') } }));
                                                                                }} className="text-text-light hover:text-red-500">x</button>
                                                                            </span>
                                                                        ))}
                                                                        <input
                                                                            type="text"
                                                                            list={tagType === 'suggestions' ? `suggestions-${tag}` : undefined}
                                                                            placeholder={t('separateWithSemicolon')}
                                                                            className="flex-1 min-w-[100px] bg-transparent text-xs text-white placeholder:text-text-light outline-none"
                                                                            onKeyDown={(e) => {
                                                                                if (['Enter', ',', ';'].includes(e.key) && (e.currentTarget as HTMLInputElement).value.trim()) {
                                                                                    e.preventDefault();
                                                                                    const val = (e.currentTarget as HTMLInputElement).value.replace(/[;,]$/, '').trim();
                                                                                    if (val && /^[a-zA-Z0-9\s_-]+$/.test(val)) {
                                                                                        const updated = [...new Set([...valueList, val])];
                                                                                        setForm(prev => ({ ...prev, additionalTags: { ...prev.additionalTags, [tag]: updated.join(';') } }));
                                                                                    }
                                                                                    (e.currentTarget as HTMLInputElement).value = '';
                                                                                }
                                                                            }}
                                                                        />
                                                                        {tagType === 'suggestions' && (
                                                                            <datalist id={`suggestions-${tag}`}>{suggestions.filter(s => !valueList.includes(s)).map(o => <option key={o} value={o} />)}</datalist>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Contact */}
                                            <div className="border-t border-border-light pt-4">
                                                <h3 className="text-sm font-medium text-white mb-3">{t('contactSection')}</h3>
                                                <SocialLinksEditor contact={form.contact} onChange={(updated: Record<string, string>) => setForm(prev => ({ ...prev, contact: { ...prev.contact, ...updated } }))} />
                                            </div>
                                        </>
                                    )}

                                    {/* Step 2 */}
                                    {step === 2 && (
                                        <>
                                            <div className="relative">
                                                <label className="text-sm font-medium text-white block mb-1">{t('searchAddress')}</label>
                                                <div className="relative">
                                                    <input
                                                        value={addressValue || addressFormatter.format({ ...form.address, country: findOne('countryCode', form.address.country)?.countryNameEn, countryCode: form.address.country }, { output: 'array' }).join(', ')}
                                                        onChange={(e) => {
                                                            setForm(prev => ({ ...prev, address: { street: e.target.value, housenumber: "", district: "", state: "", postcode: "", city: "", country: "" } }));
                                                            setAddressValue(e.target.value);
                                                        }}
                                                        placeholder="Search address..."
                                                        className="w-full py-2.5 px-3 pr-9 border border-border-light rounded-xl text-sm text-white bg-surface-light placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                                                    />
                                                    {addressLoading ? (
                                                        <SpinnerIcon className="w-4 h-4 text-accent absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
                                                    ) : (
                                                        <DirectionsIcon className="w-4 h-4 text-text-light absolute right-3 top-1/2 -translate-y-1/2" />
                                                    )}
                                                </div>
                                                {addressSuggestions.length > 0 && (
                                                    <ul ref={addressSelectorRef} className="absolute z-50 w-full mt-1 bg-surface-light border border-border-light rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                                        {addressSuggestions.map((suggestion) => (
                                                            <li key={suggestion.id} onClick={() => handleSelectAddress(suggestion)} className="px-3 py-2.5 cursor-pointer hover:bg-surface text-sm text-white border-b border-border-light/50 last:border-b-0">{suggestion.label}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                            <LocationSection
                                                lat={form.lat}
                                                lon={form.lon}
                                                address={{ street: form.address.street, housenumber: form.address.housenumber, city: form.address.city, state: form.address.state, postcode: form.address.postcode, country: form.address.country }}
                                                onMapMove={handleMapMove}
                                                onAddressChange={(field, val) => setForm(prev => ({ ...prev, address: { ...prev.address, [field]: val } }))}
                                                showAllFields
                                            />
                                            <div className="border-t border-border-light pt-4">
                                                <FormTextarea label={t('notesSection')} value={form.notes} onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))} rows={2} placeholder={t('notesPlaceholder')} />
                                            </div>
                                        </>
                                    )}

                                    {/* Step 3 */}
                                    {step === 3 && (
                                        <>
                                            <div>
                                                <h3 className="text-sm font-medium text-white mb-3">{t('openingHours')}</h3>
                                                <OpeningHoursPicker value={parsedOpeningHours} onChange={(updated) => setForm(prev => ({ ...prev, opening_hours: stringifyOpeningHours(updated) }))} />
                                            </div>
                                            <div className="border-t border-border-light pt-4">
                                                <h3 className="text-sm font-medium text-white mb-3">{t('paymentMethods')}</h3>
                                                <PaymentMethodsSelector value={form.payment} onChange={(key, checked) => setForm(prev => ({ ...prev, payment: { ...prev.payment, [key]: checked } }))} />
                                            </div>
                                            <div className="border-t border-border-light pt-4">
                                                <h3 className="text-sm font-medium text-white mb-3">{t('roleQuestion')}</h3>
                                                <div className="grid gap-2 sm:grid-cols-3">
                                                    {['owner', 'customer', 'other'].map((role) => (
                                                        <label key={role} className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${form.role === role ? 'border-accent bg-accent/10' : 'border-border-light hover:border-accent/40'}`}>
                                                            <input type="radio" name="role" value={role} checked={form.role === role} onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value }))} className="sr-only" />
                                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${form.role === role ? 'border-accent' : 'border-border-light'}`}>
                                                                {form.role === role && <div className="w-2 h-2 rounded-full bg-accent" />}
                                                            </div>
                                                            <span className="text-sm text-white">{t(`roleOptions.${role}`)}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="border-t border-border-light px-5 py-3 bg-surface-light/50 flex items-center justify-between">
                                    <div>
                                        {step > 1 ? (
                                            <Button type="button" onClick={() => changeStep(step - 1)} variant="ghost" color="neutral" size="sm" leftIcon={<ChevronLeftIcon />}>
                                                {t('backButton')}
                                            </Button>
                                        ) : isEditMode && venue ? (
                                            <Button href={`/places/${venue.slug || venue.id}`} variant="ghost" color="neutral" size="sm">
                                                Cancel
                                            </Button>
                                        ) : (
                                            <Button type="button" onClick={handleReset} variant="ghost" color="danger" size="sm">{t('resetButton')}</Button>
                                        )}
                                    </div>
                                    <div>
                                        {step < 3 ? (
                                            <Button type="button" onClick={() => changeStep(step + 1)} size="sm" rightIcon={<ChevronRightIcon />}>
                                                {t('nextButton')}
                                            </Button>
                                        ) : !user ? (
                                            <LoginWithOSM />
                                        ) : (
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting || isImageUploading}
                                                loading={isSubmitting || isImageUploading}
                                                leftIcon={!isSubmitting && !isImageUploading ? <SendIcon /> : undefined}
                                                size="sm"
                                            >
                                                {isImageUploading ? "Uploading image..." : isSubmitting ? "Submitting..." : isEditMode ? "Submit Changes" : t('submitVenue')}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Preview Panel */}
                        <div className="hidden lg:block w-80 sticky top-24">
                            <div className="bg-surface rounded-2xl border border-border-light shadow-sm overflow-hidden">
                                <div className="px-4 py-3 border-b border-border-light bg-surface-light/50">
                                    <h2 className="text-sm font-semibold text-white">Preview</h2>
                                </div>
                                <PlacePreview form={form} />
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-xs text-text-light mt-4">
                        Submitted venues are publicly visible on OpenStreetMap.
                    </p>
                </div>
            </section>
        </>
    );
}

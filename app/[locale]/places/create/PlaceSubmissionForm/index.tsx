"use client";

import React, { useEffect, useMemo, useState, FormEvent, useRef } from "react";
import toast from 'react-hot-toast';
import Script from "next/script";
import { useRouter } from '@/i18n/navigation';
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import {
    parseOpeningHours,
    stringifyOpeningHours,
    DayHours,
    convertGooglePeriodsToDayHours
} from "@/utils/OpeningHoursParser";
import { Locale } from "@/i18n/types";
import addressFormatter from "@fragaria/address-formatter";
import { findOne } from "country-codes-list";
import { useOsmUser } from "@/providers/OsmAuth";
import { LoginWithOSM } from "@/components/auth";
import { COMMON_TAG_TRANSLATIONS, CommonTag } from "@/constants/CommonOsmTags";
import {
    matchPlaceSubcategory,
    PLACE_SUBTYPE_MAP,
    PlaceCategory
} from "@/constants/PlaceCategories";
import {
    COMMON_TAG_INPUT_TYPES,
    COMMON_TAG_SUGGESTIONS,
    CommonTagCustomization,
    PLACE_CUSTOMIZATION_META
} from "@/constants/PlaceOsmDictionary";
import { VenueForm } from "@/models/VenueForm";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import {
    FormTextarea,
    PaymentMethodsSelector,
    CategorySelector,
    LocationSection,
    PlacePreview,
} from "@/components/place-form";

const OpeningHoursPicker = dynamic(
    () => import("@/components/forms/OpeningHoursPicker"),
    { ssr: false }
);

const SocialLinksEditor = dynamic(
    () => import("@/components/place/SocialLinksEditor"),
    { ssr: false }
);

const EMPTY_FORM: VenueForm = {
    name: "",
    category: "",
    subcategory: "",
    additionalTags: {},
    about: '',
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const grecaptcha: any;

const STEPS = [
    { key: 1, label: 'About', desc: 'Basic info' },
    { key: 2, label: 'Location', desc: 'Address' },
    { key: 3, label: 'Details', desc: 'Hours & pay' }
];

export default function VenueSubmissionForm() {
    const { user } = useOsmUser();
    const t = useTranslations('venues.form');
    const locale = useLocale() as Locale;
    const router = useRouter();
    const [step, setStep] = useState<number>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [suggestedSubcategories, setSuggestedSubcategories] = useState<string[]>([]);
    const [form, setForm] = useState<VenueForm>(() => {
        if (typeof window !== "undefined") {
            const stored = sessionStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : EMPTY_FORM;
        }
        return EMPTY_FORM;
    });

    const venueSelectorRef = useRef<HTMLDivElement>(null);
    const addressSelectorRef = useRef<HTMLUListElement>(null);

    useOnClickOutside([venueSelectorRef], () => clearSuggestionsVenue());
    useOnClickOutside([addressSelectorRef], () => clearSuggestions());

    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    }, [form]);

    const parsedOpeningHours: DayHours[] = useMemo(() => parseOpeningHours(form.opening_hours), [form.opening_hours]);

    const {
        ready,
        value,
        suggestions: { status, data },
        setValue,
        clearSuggestions,
    } = usePlacesAutocomplete();

    const {
        ready: readyVenue,
        value: valueVenue,
        suggestions: { status: statusVenue, data: dataVenue },
        setValue: setValueVenue,
        clearSuggestions: clearSuggestionsVenue,
    } = usePlacesAutocomplete({
        requestOptions: { types: ["establishment"] },
    });

    function changeStep(newStep: number) {
        setStep(newStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function handleSelectAddress(description: string) {
        setValue(description, false);
        clearSuggestions();
        getGeocode({ address: description }).then((results) => {
            const { lat, lng } = getLatLng(results[0]);
            const components = results[0].address_components;
            const get = (type: string): string =>
                components.find((c) => c.types.includes(type))?.long_name || "";
            setForm((prev) => ({
                ...prev,
                lat: lat.toString(),
                lon: lng.toString(),
                address: {
                    street: get("route"),
                    city: get("locality") || get("administrative_area_level_2"),
                    country: get("country"),
                    housenumber: get("street_number"),
                    district: get("sublocality"),
                    state: get("administrative_area_level_1"),
                    postcode: get("postal_code"),
                },
            }));
        });
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
            const token = await grecaptcha.execute(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY, { action: "submit" });
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
                router.push(`/venues/${json.changesetId}?preview=true`);
            } else {
                toast.error(json.error || "Submission failed");
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Submission failed");
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleReset = () => {
        setForm(EMPTY_FORM);
        setValue("", false);
        setValueVenue("", false);
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

    return (
        <>
            <Script src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_MAP_API_KEY}&libraries=places`} strategy="beforeInteractive" />
            <Script src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`} strategy="afterInteractive" />

            {/* Hero Section */}
            <div className="w-full bg-gradient-primary pt-24 pb-10 px-8 max-md:px-4">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Add a New Venue</h1>
                    <p className="text-white/70 text-lg">Help grow the Bitcoin merchant network by adding a new location</p>
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
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                    </svg>
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
                                            {/* Venue Name Search */}
                                            <div ref={venueSelectorRef} className="relative">
                                                <label className="text-sm font-medium text-white block mb-1">
                                                    {t('fields.name')} <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        placeholder={t('searchVenueName')}
                                                        value={valueVenue || form.name}
                                                        onChange={(e) => {
                                                            setForm(prev => ({ ...prev, name: e.target.value }));
                                                            setValueVenue(e.target.value);
                                                        }}
                                                        disabled={!readyVenue}
                                                        autoComplete="off"
                                                        className="w-full py-2.5 px-3 pr-9 border border-border-light rounded-xl text-sm text-white bg-surface-light placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                                                    />
                                                    <svg className="w-4 h-4 text-text-light absolute right-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                </div>
                                                {statusVenue === "OK" && (
                                                    <ul className="absolute z-50 w-full mt-1 bg-surface-light border border-border-light rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                                        {dataVenue.filter(item => item.types.includes("establishment")).map(({ place_id, description }) => (
                                                            <li
                                                                key={place_id}
                                                                onClick={() => {
                                                                    clearSuggestionsVenue();
                                                                    const service = new window.google.maps.places.PlacesService(document.createElement("div"));
                                                                    service.getDetails({ placeId: place_id }, (place, status) => {
                                                                        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                                                                            const { geometry, address_components, name, website, formatted_phone_number } = place;
                                                                            const get = (type: string): string => address_components?.find((c) => c.types.includes(type))?.long_name || "";
                                                                            let category: PlaceCategory | "" = "";
                                                                            let subcategory: (typeof PLACE_SUBTYPE_MAP)[PlaceCategory][number] | '' = "";
                                                                            if (place.types) {
                                                                                for (const currentType of place.types) {
                                                                                    const match = matchPlaceSubcategory(currentType);
                                                                                    if (match) {
                                                                                        category = match.category as PlaceCategory;
                                                                                        subcategory = match.subcategory;
                                                                                        break;
                                                                                    }
                                                                                }
                                                                            }
                                                                            setValue(place.formatted_address ?? '', false);
                                                                            setValueVenue(name || description, false);
                                                                            setForm((prev) => ({
                                                                                ...prev,
                                                                                placeId: place_id,
                                                                                name: name || description,
                                                                                lat: geometry?.location?.lat()?.toString() || "",
                                                                                lon: geometry?.location?.lng()?.toString() || "",
                                                                                category,
                                                                                subcategory,
                                                                                opening_hours: place.opening_hours?.periods ? stringifyOpeningHours(convertGooglePeriodsToDayHours(place.opening_hours.periods)) : "",
                                                                                contact: { ...prev.contact, website: website || "", phone: formatted_phone_number || "" },
                                                                                address: {
                                                                                    street: get("route"),
                                                                                    housenumber: get("street_number"),
                                                                                    city: get("locality") || get("administrative_area_level_2"),
                                                                                    district: get("sublocality"),
                                                                                    state: get("administrative_area_level_1"),
                                                                                    postcode: get("postal_code"),
                                                                                    country: get("country"),
                                                                                },
                                                                            }));
                                                                        }
                                                                    });
                                                                }}
                                                                className="px-3 py-2.5 cursor-pointer hover:bg-surface text-sm text-white border-b border-border-light/50 last:border-b-0"
                                                            >
                                                                {description}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                                <p className="text-xs text-text-light mt-1">Search to auto-fill or type manually</p>
                                            </div>

                                            {/* Category */}
                                            <CategorySelector
                                                category={form.category as PlaceCategory | ''}
                                                subcategory={form.subcategory}
                                                onCategoryChange={(cat) => setForm(prev => ({ ...prev, category: cat, subcategory: '' }))}
                                                onSubcategoryChange={(sub) => setForm(prev => ({ ...prev, subcategory: sub }))}
                                                onSuggestSubcategory={handleSuggestSubcategory}
                                                required
                                            />

                                            {/* Suggested subcategories */}
                                            {suggestedSubcategories.length > 0 && (
                                                <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
                                                    <p className="text-xs text-accent font-medium mb-1.5">Suggested (pending review):</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {suggestedSubcategories.map((s) => (
                                                            <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/20 text-accent rounded text-xs">
                                                                {s}
                                                                <button type="button" onClick={() => setSuggestedSubcategories(suggestedSubcategories.filter(x => x !== s))} className="hover:text-white">
                                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                </button>
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
                                                                            {rawValue === 'yes' && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
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
                                                        value={value || addressFormatter.format({ ...form.address, country: findOne('countryCode', form.address.country)?.countryNameEn, countryCode: form.address.country }, { output: 'array' }).join(', ')}
                                                        onChange={(e) => {
                                                            setForm(prev => ({ ...prev, address: { street: e.target.value, housenumber: "", district: "", state: "", postcode: "", city: "", country: "" } }));
                                                            setValue(e.target.value);
                                                        }}
                                                        placeholder="Search address..."
                                                        disabled={!ready}
                                                        className="w-full py-2.5 px-3 pr-9 border border-border-light rounded-xl text-sm text-white bg-surface-light placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                                                    />
                                                    <svg className="w-4 h-4 text-text-light absolute right-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </div>
                                                {status === "OK" && (
                                                    <ul ref={addressSelectorRef} className="absolute z-50 w-full mt-1 bg-surface-light border border-border-light rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                                        {data.map(({ place_id, description }) => (
                                                            <li key={place_id} onClick={() => handleSelectAddress(description)} className="px-3 py-2.5 cursor-pointer hover:bg-surface text-sm text-white border-b border-border-light/50 last:border-b-0">{description}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                            <LocationSection
                                                lat={form.lat}
                                                lon={form.lon}
                                                address={{ street: form.address.street, housenumber: form.address.housenumber, city: form.address.city, state: form.address.state, postcode: form.address.postcode, country: form.address.country }}
                                                onMapMove={(lat, lon) => setForm(prev => ({ ...prev, lat: String(lat), lon: String(lon) }))}
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
                                            <button type="button" onClick={() => changeStep(step - 1)} className="text-sm text-text-light hover:text-white flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                                {t('backButton')}
                                            </button>
                                        ) : (
                                            <button type="button" onClick={handleReset} className="text-sm text-text-light hover:text-red-500">{t('resetButton')}</button>
                                        )}
                                    </div>
                                    <div>
                                        {step < 3 ? (
                                            <button type="button" onClick={() => changeStep(step + 1)} className="bg-accent hover:bg-accent-dark text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center gap-1">
                                                {t('nextButton')}
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                            </button>
                                        ) : !user ? (
                                            <LoginWithOSM />
                                        ) : (
                                            <button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent-dark text-white py-2 px-4 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1.5">
                                                {isSubmitting ? (
                                                    <>
                                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                                                        Submitting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                                        {t('submitVenue')}
                                                    </>
                                                )}
                                            </button>
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

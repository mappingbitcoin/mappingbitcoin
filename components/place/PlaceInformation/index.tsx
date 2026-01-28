"use client";

import { useState, useMemo} from "react";
import {SOCIAL_ICONS} from "@/constants/SocialIcons";
import {PAYMENT_METHODS} from "@/constants/PaymentMethods";
import {useLocale} from "next-intl";
import {Locale} from "@/i18n/types";
import { CategoryChip, ButtonLink } from "@/components/ui";
import {useGooglePlaceMatch} from "@/hooks/useGooglePlaceMatch";
import OpeningHoursDisplay from "../OpeningHoursDisplay";
import Image from "next/image";
import {getSubcategoryLabel, PLACE_CATEGORIES} from "@/constants/PlaceCategories";
import { useTranslations } from "next-intl";
import {EnrichedVenue, GoogleReview} from "@/models/Overpass";
import {parseTags} from "@/utils/OsmHelpers";
import {getFormattedAddress} from "@/utils/AddressUtils";
import moment from 'moment'
import {deslugify} from "@/utils/StringUtils";
import { VerifyOwnershipButton } from "@/components/verification";

type Props = {
    venue: EnrichedVenue;
    isSideBar?: boolean
};

export default function PlaceInformation({venue, isSideBar = false}: Props) {
    const t = useTranslations("map.venue-information");
    const locale = useLocale() as Locale;
    const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "about">("overview");

    const {place} = useGooglePlaceMatch(venue);

    const score = useMemo(() => place?.rating ?? 0, [place])
    const totalRatings = useMemo(() => place?.userRatingsTotal ?? 0, [place])

    const reviewsList = useMemo(() => place?.reviews && place.reviews.length > 0 ? (
        place.reviews.map((r: GoogleReview, i: number) => {
            return (
                <div key={i} className="bg-surface-light p-3 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] [&_strong]:text-sm [&_strong]:text-text [&_p]:text-[13px] [&_p]:text-text-light [&_p]:mt-1">
                    <strong>{r.author_name || "Anonymous"}</strong>
                    <div className="text-lg">
                        {[...Array(5)].map((_, i) => {
                            const filled = i + 1 <= Math.floor(r.rating);
                            const partial = i < r.rating && i + 1 > r.rating;
                            return (
                                <span
                                    key={i}
                                    className={`${filled ? 'text-[#f5a623]' : partial ? 'bg-gradient-to-r from-[#f5a623] from-50% to-[#949494] to-50% bg-clip-text text-transparent' : 'text-[#949494]'}`}
                                >
                                ★
                              </span>
                            );
                        })}
                    </div>
                    <p>{r.text}</p>
                    <p>{r.relative_time_description}</p>
                </div>
            )
        })
    ) : (
        <p>{t("noReviews")}</p>
    ), [place, t])

    const address = useMemo(() => place?.address ?? getFormattedAddress(locale, venue), [locale, venue, place]);

    const googleMapLink = useMemo(() => {
        if (place?.placeId) {
            return `https://www.google.com/maps/place/?q=place_id:${place.placeId}`;
        }

        const { lat, lon } = venue;
        const query = address && address.length > 0 ? encodeURIComponent(address) : `${lat},${lon}`;
        return `https://www.google.com/maps/search/?api=1&query=${query}`;
    }, [venue, place, address]);

    const {featuredPhoto} = useMemo(() => {
        if (place?.photos && place.photos.length > 0) {
            const photoUrls = place.photos.map((photo: { photo_reference: string; }) => {
                const photoUrl = new URL('https://maps.googleapis.com/maps/api/place/photo');
                photoUrl.searchParams.set('maxheight', '400');
                photoUrl.searchParams.set('photo_reference', photo.photo_reference);
                photoUrl.searchParams.set('key', String(process.env.NEXT_PUBLIC_MAP_API_KEY_PHOTO));
                return photoUrl.toString()
            })

            return {featuredPhoto: photoUrls[0], photos: photoUrls.length > 1 ? photoUrls.slice(1) : null}

        } else return {featuredPhoto: null}
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [address])

    const {paymentMethods, name, contact, openingHours, source, description,
        descriptionsByLocale, note, notesByLocale,specialTags, amenitiesTags} = useMemo(() => {
        return parseTags(venue.tags);
    }, [venue]);

    return (
        <>
            {featuredPhoto && (
                <div className={isSideBar ? "mb-[-5rem] relative h-[300px] w-[360px]" : "relative h-[300px] w-[360px]"}>
                    <Image src={featuredPhoto} className="h-[300px] w-full object-cover"
                           alt={name ?? place.label} width={600} height={400}
                           loading={'lazy'}
                           unoptimized />
                </div>
            )}
            <div className={isSideBar ? "py-20 px-4" : "px-4"}>
                <div>
                    <div className="flex items-start justify-between gap-2">
                        <h2 className="text-xl font-bold m-0 text-white flex-1">{name}</h2>
                        {contact?.email && (
                            <VerifyOwnershipButton
                                venue={venue}
                                venueName={name || 'This venue'}
                                osmEmail={contact.email}
                                compact={true}
                            />
                        )}
                    </div>
                    <div className="flex flex-row flex-wrap gap-2 mt-2">
                        {venue.subcategory && venue.category ? (
                            <CategoryChip as="span" category={venue.category ?? 'other'}>
                                {getSubcategoryLabel(locale, venue.category, venue.subcategory)}
                            </CategoryChip>
                        ) : venue.category ? (
                            <CategoryChip as="span" category={venue.category ?? 'other'}>
                                {PLACE_CATEGORIES[locale][venue.category].label ?? t("map.venue-tooltip.defaultCategory")}
                            </CategoryChip>
                        ) : <></> }
                        {specialTags && Object.entries(specialTags).map((el) => {
                            const splits = el[1].split(/[;,\.]/);
                            return splits.map(split =>( <CategoryChip key={el[0]+split} as="span" category={el[0]}>
                                {deslugify(split.replaceAll('_', '-'))}
                            </CategoryChip>))
                        })}
                    </div>

                    <div className="flex flex-col gap-1 mt-3">
                        <div className="text-lg">
                            {[...Array(5)].map((_, i) => {
                                const filled = i + 1 <= Math.floor(score);
                                const partial = i < score && i + 1 > score;
                                return (
                                    <span
                                        key={i}
                                        className={`${filled ? 'text-accent' : partial ? 'bg-gradient-to-r from-accent from-50% to-text-light to-50% bg-clip-text text-transparent' : 'text-text-light'}`}
                                    >
                    ★
                  </span>
                                );
                            })}
                        </div>
                        <div className="text-[13px] text-text-light">
                            {score.toFixed(1)} · {totalRatings} {t("tabs.reviews")}
                        </div>
                    </div>

                    <div className="relative my-4 flex w-full">
                        <ButtonLink href={googleMapLink} target="_blank" rel="noopener noreferrer">
                            <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {t("getDirections")}
                        </ButtonLink>
                    </div>
                </div>

                <nav className="flex gap-0 mt-4 border-b border-border">
                    <button onClick={() => setActiveTab("overview")}
                            className={`text-sm flex-1 py-3 px-4 bg-transparent border-none cursor-pointer transition-all duration-200 ${activeTab === "overview" ? 'text-accent font-semibold border-b-2 border-accent -mb-px' : 'text-text-light hover:text-white'}`}>{t("tabs.overview")}
                    </button>
                    <button onClick={() => setActiveTab("reviews")}
                            className={`text-sm flex-1 py-3 px-4 bg-transparent border-none cursor-pointer transition-all duration-200 ${activeTab === "reviews" ? 'text-accent font-semibold border-b-2 border-accent -mb-px' : 'text-text-light hover:text-white'}`}>{t("tabs.reviews")}
                    </button>
                    <button onClick={() => setActiveTab("about")}
                            className={`text-sm flex-1 py-3 px-4 bg-transparent border-none cursor-pointer transition-all duration-200 ${activeTab === "about" ? 'text-accent font-semibold border-b-2 border-accent -mb-px' : 'text-text-light hover:text-white'}`}>{t("tabs.about")}
                    </button>
                </nav>

                <div className="mt-4 text-text-light">
                    {activeTab === "overview" && (
                        <>
                            <div className="flex flex-col gap-4">
                                {address && (
                                    <div className="flex justify-start gap-3 items-start flex-row">
                                        <div className="w-6 h-6 rounded-full bg-surface-light flex items-center justify-center shrink-0 mt-0.5">
                                            <svg className="w-3.5 h-3.5 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-text-light">{address}</p>
                                    </div>
                                )}
                                {contact?.website && (
                                    <div className="flex justify-start gap-3 items-start flex-row">
                                        <div className="w-6 h-6 rounded-full bg-surface-light flex items-center justify-center shrink-0 mt-0.5">
                                            <svg className="w-3.5 h-3.5 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                            </svg>
                                        </div>
                                        <p className="mt-0.5">
                                            <a href={contact.website} target="_blank"
                                               rel="noreferrer" className="text-accent hover:text-accent/80 underline break-all">{contact.website}</a>
                                        </p>
                                    </div>
                                )}

                                {(contact?.email) && (
                                    <div className="flex justify-start gap-3 items-start flex-row">
                                        <div className="w-6 h-6 rounded-full bg-surface-light flex items-center justify-center shrink-0 mt-0.5">
                                            <svg className="w-3.5 h-3.5 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <p className="mt-0.5">
                                            <a href={`mailto:${contact.email}`} target="_blank"
                                               rel="noreferrer" className="text-accent hover:text-accent/80 underline">{contact.email}</a>
                                        </p>
                                    </div>
                                )}
                                {(contact?.phone) && (
                                    <div className="flex justify-start gap-3 items-start flex-row">
                                        <div className="w-6 h-6 rounded-full bg-surface-light flex items-center justify-center shrink-0 mt-0.5">
                                            <svg className="w-3.5 h-3.5 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                        <p className="mt-0.5">
                                            <a href={`tel:${contact.phone}`} target="_blank"
                                               rel="noreferrer" className="text-accent hover:text-accent/80 underline">{contact.phone}</a>
                                        </p>
                                    </div>
                                )}
                                {openingHours && (
                                    <div className="flex justify-start gap-3 items-start flex-row">
                                        <div className="w-6 h-6 rounded-full bg-surface-light flex items-center justify-center shrink-0 mt-0.5">
                                            <svg className="w-3.5 h-3.5 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <OpeningHoursDisplay openingHours={openingHours}/>
                                    </div>
                                )}
                            </div>

                            {(description || descriptionsByLocale[0]) &&
                                <div className="mt-6">
                                    <h4 className="text-sm font-semibold mb-2 text-white uppercase tracking-wide">Description</h4>
                                    <p className="text-text-light">{descriptionsByLocale[locale] ?? description}</p>
                                </div>
                            }
                            {(note || notesByLocale[0]) &&
                                <div className="mt-6">
                                    <h4 className="text-sm font-semibold mb-2 text-white uppercase tracking-wide">Notes</h4>
                                    <p className="text-text-light">{notesByLocale[locale] ?? note}</p>
                                </div>
                            }

                            {amenitiesTags && Object.entries(amenitiesTags).length > 0 &&
                                <div className="mt-6">
                                    <h4 className="text-sm font-semibold mb-2 text-white uppercase tracking-wide">{t("amenities")}</h4>
                                    <div className="flex flex-row flex-wrap gap-2">
                                        {Object.entries(amenitiesTags).map((el) => {
                                            return (<CategoryChip key={el[0]} as="span" category={'amenity'}>
                                                {deslugify(el[0].replaceAll('_', '-'))}: {deslugify(el[1].replaceAll('_', '-'))}
                                            </CategoryChip>)
                                        })}
                                    </div>
                                </div>
                            }

                            {paymentMethods && Object.entries(paymentMethods).some(([, v]) => v === "yes") && (
                                <div className="mt-6">
                                    <h4 className="text-sm font-semibold mb-2 text-white uppercase tracking-wide">{t("paymentMethods")}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(paymentMethods).map(([type, enabled]) => {
                                            const info = PAYMENT_METHODS[type];
                                            if (enabled !== "yes" || !info) return null;
                                            return (
                                                <span key={type} className="w-10 h-10 rounded-lg bg-primary-light border border-border-light flex items-center justify-center text-xl no-underline text-white hover:bg-surface-light hover:border-accent/50 transition-colors"
                                                      title={info.label}>{info.icon}</span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {contact && Object.entries(contact).some(([type]) => SOCIAL_ICONS[type]) && (
                                <div className="mt-6">
                                    <h4 className="text-sm font-semibold mb-2 text-white uppercase tracking-wide">{t("socials")}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(contact).map(([type, value]) => {
                                            const info = SOCIAL_ICONS[type];
                                            if (!value || !info) return null;
                                            return (
                                                <a key={type} className="w-10 h-10 rounded-lg bg-primary-light border border-border-light flex items-center justify-center no-underline text-white hover:bg-surface-light hover:border-accent/50 transition-colors" href={value} target="_blank"
                                                   rel="noreferrer" title={info.label}>{info.icon}</a>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === "reviews" && (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-3">
                                {reviewsList}
                            </div>
                        </div>
                    )}

                    {activeTab === "about" && (
                        <div className="w-full">
                            {(description || descriptionsByLocale[0]) &&
                                <div className="flex flex-col border-b border-border pb-4 mb-4">
                                    <h3 className="text-sm font-semibold mb-2 text-white uppercase tracking-wide">Description</h3>
                                    <p className="text-text-light">{descriptionsByLocale[locale] ?? description}</p>
                                </div>
                            }
                            {(note || notesByLocale[0]) &&
                                <div className="flex flex-col border-b border-border pb-4 mb-4">
                                    <h3 className="text-sm font-semibold mb-2 text-white uppercase tracking-wide">Notes</h3>
                                    <p className="text-text-light">{notesByLocale[locale] ?? note}</p>
                                </div>
                            }
                            <div className="flex justify-start gap-3 items-start flex-col mt-4">
                                <p className="text-text-light">
                                    <strong className="text-white">Uploaded in: </strong>
                                    <a href="https://OpenStreetMap.org" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80 underline">
                                        OpenStreetMap.org
                                    </a>
                                </p>
                                {source && <p className="text-text-light">
                                    <strong className="text-white">Uploaded at: </strong>
                                    {source}
                                </p>}
                                {venue.user && <p className="text-text-light">
                                    <strong className="text-white">Uploaded by: </strong>
                                    {venue.user}
                                </p>}
                                {venue.timestamp && <p className="text-text-light">
                                    <strong className="text-white">Last modification: </strong>
                                    {moment(venue.timestamp).format('MMM DD, yyyy [at] HH:mm [hs]')}
                                </p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

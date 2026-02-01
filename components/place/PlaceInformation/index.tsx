"use client";

import { useState, useMemo} from "react";
import {SOCIAL_ICONS} from "@/constants/SocialIcons";
import {PAYMENT_METHODS} from "@/constants/PaymentMethods";
import {useLocale} from "next-intl";
import {Locale} from "@/i18n/types";
import { CategoryChip, Button, TabButton, TextLink } from "@/components/ui";
import OpeningHoursDisplay from "../OpeningHoursDisplay";
import Image from "next/image";
import {getSubcategoryLabel, PLACE_CATEGORIES} from "@/constants/PlaceCategories";
import { useTranslations } from "next-intl";
import {EnrichedVenue} from "@/models/Overpass";
import {parseTags} from "@/utils/OsmHelpers";
import {getFormattedAddress} from "@/utils/AddressUtils";
import moment from 'moment'
import {deslugify} from "@/utils/StringUtils";
import { VerifyOwnershipButton } from "@/components/verification";
import { canVerifyVenue } from "@/lib/verification/domainUtils";
import { PinIcon, GlobeIcon, ClockIcon } from "@/assets/icons/ui";
import { EmailIcon, PhoneIcon } from "@/assets/icons/contact";

type Props = {
    venue: EnrichedVenue;
    isSideBar?: boolean
};

export default function PlaceInformation({venue, isSideBar = false}: Props) {
    const t = useTranslations("map.venue-information");
    const locale = useLocale() as Locale;
    const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "about">("overview");
    const [imageError, setImageError] = useState(false);

    const score = useMemo(() => venue.rating ?? 0, [venue.rating]);

    const address = useMemo(() => getFormattedAddress(locale, venue), [locale, venue]);

    const googleMapLink = useMemo(() => {
        const { lat, lon } = venue;
        const query = address && address.length > 0 ? encodeURIComponent(address) : `${lat},${lon}`;
        return `https://www.google.com/maps/search/?api=1&query=${query}`;
    }, [venue, address]);

    // Featured photo from OSM image tag
    const featuredPhoto = useMemo(() => {
        if (venue.tags?.image) {
            return venue.tags.image;
        }
        return null;
    }, [venue.tags?.image]);

    const {paymentMethods, name, contact, openingHours, source, description,
        descriptionsByLocale, note, notesByLocale, specialTags, amenitiesTags} = useMemo(() => {
        return parseTags(venue.tags);
    }, [venue]);

    return (
        <>
            <div className={isSideBar ? "pt-16 px-4" : "px-4"}>
                {/* Image above name - hidden if error or not available */}
                {featuredPhoto && !imageError && (
                    <div className="relative h-[140px] w-full rounded-lg overflow-hidden mb-3">
                        <Image
                            src={featuredPhoto}
                            className="h-full w-full object-cover"
                            alt={name ?? 'Venue'}
                            fill
                            loading={'lazy'}
                            unoptimized
                            onError={() => setImageError(true)}
                        />
                    </div>
                )}
                <div>
                    <div className="flex items-start justify-between gap-2">
                        <h2 className="text-xl font-bold m-0 text-white flex-1">{name}</h2>
                        {canVerifyVenue(venue.tags) && (
                            <VerifyOwnershipButton
                                venue={venue}
                                venueName={name || 'This venue'}
                                osmEmail={contact?.email}
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

                    {score > 0 && (
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
                                {score.toFixed(1)}
                            </div>
                        </div>
                    )}

                    <div className="relative my-4 flex w-full">
                        <Button href={googleMapLink} external variant="soft" color="accent" size="sm" leftIcon={<PinIcon />}>
                            {t("getDirections")}
                        </Button>
                    </div>
                </div>

                <nav className="flex gap-0 mt-4 border-b border-border">
                    <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>
                        {t("tabs.overview")}
                    </TabButton>
                    <TabButton active={activeTab === "reviews"} onClick={() => setActiveTab("reviews")}>
                        {t("tabs.reviews")}
                    </TabButton>
                    <TabButton active={activeTab === "about"} onClick={() => setActiveTab("about")}>
                        {t("tabs.about")}
                    </TabButton>
                </nav>

                <div className="mt-4 text-text-light">
                    {activeTab === "overview" && (
                        <>
                            <div className="flex flex-col gap-4">
                                {address && (
                                    <div className="flex justify-start gap-3 items-start flex-row">
                                        <div className="w-6 h-6 rounded-full bg-surface-light flex items-center justify-center shrink-0 mt-0.5">
                                            <PinIcon className="w-3.5 h-3.5 text-text-light" />
                                        </div>
                                        <p className="text-text-light">{address}</p>
                                    </div>
                                )}
                                {contact?.website && (
                                    <div className="flex justify-start gap-3 items-start flex-row">
                                        <div className="w-6 h-6 rounded-full bg-surface-light flex items-center justify-center shrink-0 mt-0.5">
                                            <GlobeIcon className="w-3.5 h-3.5 text-text-light" />
                                        </div>
                                        <p className="mt-0.5">
                                            <TextLink href={contact.website} external variant="accent" className="break-all">{contact.website}</TextLink>
                                        </p>
                                    </div>
                                )}

                                {(contact?.email) && (
                                    <div className="flex justify-start gap-3 items-start flex-row">
                                        <div className="w-6 h-6 rounded-full bg-surface-light flex items-center justify-center shrink-0 mt-0.5">
                                            <EmailIcon className="w-3.5 h-3.5 text-text-light" />
                                        </div>
                                        <p className="mt-0.5">
                                            <TextLink href={`mailto:${contact.email}`} external variant="accent">{contact.email}</TextLink>
                                        </p>
                                    </div>
                                )}
                                {(contact?.phone) && (
                                    <div className="flex justify-start gap-3 items-start flex-row">
                                        <div className="w-6 h-6 rounded-full bg-surface-light flex items-center justify-center shrink-0 mt-0.5">
                                            <PhoneIcon className="w-3.5 h-3.5 text-text-light" />
                                        </div>
                                        <p className="mt-0.5">
                                            <TextLink href={`tel:${contact.phone}`} external variant="accent">{contact.phone}</TextLink>
                                        </p>
                                    </div>
                                )}
                                {openingHours && (
                                    <div className="flex justify-start gap-3 items-start flex-row">
                                        <div className="w-6 h-6 rounded-full bg-surface-light flex items-center justify-center shrink-0 mt-0.5">
                                            <ClockIcon className="w-3.5 h-3.5 text-text-light" />
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
                        <div className="text-center py-8">
                            <div className="text-4xl mb-3">💬</div>
                            <h3 className="text-base font-semibold text-white mb-2">Reviews Coming Soon</h3>
                            <p className="text-text-light text-sm">
                                We're working on a community-driven review system.
                            </p>
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
                                    <TextLink href="https://OpenStreetMap.org" external variant="accent">
                                        OpenStreetMap.org
                                    </TextLink>
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

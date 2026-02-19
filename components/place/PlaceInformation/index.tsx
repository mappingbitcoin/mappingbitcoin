"use client";

import React, { useState, useMemo, useRef } from "react";
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
import { PinIcon, GlobeIcon, ClockIcon, ChatIcon, SpinnerIcon, WarningIcon, PhotoIcon, CloseIcon } from "@/assets/icons/ui";
import { EmailIcon, PhoneIcon } from "@/assets/icons/contact";
import { Link } from "@/i18n/navigation";
import { StarRating, WeightedRating } from "@/components/reviews";
import { useReviews } from "@/hooks/useReviews";
import { useBlossomUpload } from "@/hooks/useBlossomUpload";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { LoginModal } from "@/components/auth";

const MAX_SIDEBAR_IMAGES = 3;

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
                            alt={name ? `Photo of ${name}` : 'Venue photo'}
                            fill
                            loading={'lazy'}
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
                        <MapSidebarReviews
                            osmId={`${venue.type}/${venue.id}`}
                            venueSlug={`${venue.type}-${venue.id}`}
                            placeSlug={venue.slug || `${venue.type}-${venue.id}`}
                        />
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

interface UploadedImage {
    id: string;
    url: string;
    previewUrl: string;
}

/**
 * Compact reviews section for the map sidebar
 */
function MapSidebarReviews({
    osmId,
    venueSlug,
    placeSlug,
}: {
    osmId: string;
    venueSlug: string;
    placeSlug: string;
}) {
    const { user } = useNostrAuth();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [rating, setRating] = useState(0);
    const [content, setContent] = useState("");
    const [formError, setFormError] = useState<string | null>(null);

    // Image upload state
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [uploadingCount, setUploadingCount] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { uploadFile, isUploading, error: uploadError, clearError: clearUploadError } = useBlossomUpload();

    const {
        reviews,
        weightedAverageRating,
        simpleAverageRating,
        totalReviews,
        isLoading,
        error,
        submitReview,
        isSubmitting,
        submitError,
    } = useReviews({ osmId, venueSlug });

    const isLoggedIn = !!user;
    const hasWriteAccess = user?.mode === "write";
    const hasNostrExtension = typeof window !== "undefined" && !!window.nostr;
    const canAddMoreImages = images.length < MAX_SIDEBAR_IMAGES && !isUploading;
    const isAnyUploading = isUploading || uploadingCount > 0;

    const handleWriteReviewClick = () => {
        if (!isLoggedIn) {
            setShowLoginModal(true);
            return;
        }
        if (!hasWriteAccess) {
            setFormError("You need write access to submit reviews. Please log in with your nsec or browser extension.");
            setShowReviewForm(true);
            return;
        }
        setShowReviewForm(true);
    };

    const handleSubmitReview = async () => {
        setFormError(null);

        if (rating === 0) {
            setFormError("Please select a rating");
            return;
        }

        const imageUrls = images.map(img => img.url).filter(Boolean);
        const success = await submitReview(rating, content || undefined, imageUrls.length > 0 ? imageUrls : undefined);
        if (success) {
            setRating(0);
            setContent("");
            // Clean up preview URLs
            images.forEach(img => {
                if (img.previewUrl.startsWith("blob:")) {
                    URL.revokeObjectURL(img.previewUrl);
                }
            });
            setImages([]);
            setShowReviewForm(false);
        }
    };

    const handleCancelReview = () => {
        setShowReviewForm(false);
        setRating(0);
        setContent("");
        setFormError(null);
        // Clean up preview URLs
        images.forEach(img => {
            if (img.previewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(img.previewUrl);
            }
        });
        setImages([]);
        clearUploadError();
    };

    const handleLoginSuccess = () => {
        setShowLoginModal(false);
        setShowReviewForm(true);
    };

    // Handle file selection
    const handleFileSelect = async (files: FileList) => {
        setFormError(null);
        clearUploadError();

        const filesToUpload = Array.from(files).slice(0, MAX_SIDEBAR_IMAGES - images.length);
        if (filesToUpload.length === 0) {
            setFormError(`Maximum ${MAX_SIDEBAR_IMAGES} images allowed`);
            return;
        }

        setUploadingCount(filesToUpload.length);

        for (const file of filesToUpload) {
            const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
            if (!allowedTypes.includes(file.type)) {
                setFormError("Invalid file type. Allowed: JPEG, PNG, GIF, WebP");
                continue;
            }
            if (file.size > 5 * 1024 * 1024) {
                setFormError("File too large. Maximum size is 5MB");
                continue;
            }

            const previewUrl = URL.createObjectURL(file);
            const tempId = `temp-${Date.now()}-${Math.random()}`;
            setImages(prev => [...prev, { id: tempId, url: "", previewUrl }]);

            const url = await uploadFile(file);
            if (url) {
                setImages(prev => prev.map(img => img.id === tempId ? { ...img, url } : img));
            } else {
                setImages(prev => prev.filter(img => img.id !== tempId));
                URL.revokeObjectURL(previewUrl);
            }
            setUploadingCount(prev => prev - 1);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files);
        }
        e.target.value = "";
    };

    const handleRemoveImage = (imageId: string) => {
        setImages(prev => {
            const img = prev.find(i => i.id === imageId);
            if (img?.previewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(img.previewUrl);
            }
            return prev.filter(i => i.id !== imageId);
        });
    };

    const handleAddImageClick = () => {
        if (!canAddMoreImages || isSubmitting) return;
        if (!hasNostrExtension) {
            setFormError("To upload images, please install a Nostr browser extension like Alby or nos2x.");
            return;
        }
        fileInputRef.current?.click();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <SpinnerIcon className="w-6 h-6 text-accent animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-400 text-sm">{error}</p>
            </div>
        );
    }

    const displayError = formError || submitError || uploadError;

    // Inline review form
    if (showReviewForm) {
        return (
            <div className="py-4 space-y-4">
                <h3 className="text-base font-semibold text-white">Write a Review</h3>

                {/* Rating */}
                <div>
                    <label className="block text-sm text-text-light mb-2">
                        Your Rating <span className="text-red-400">*</span>
                    </label>
                    <StarRating value={rating} onChange={setRating} size="lg" />
                </div>

                {/* Content */}
                <div>
                    <label className="block text-sm text-text-light mb-2">
                        Your Review <span className="text-text-light/60">(optional)</span>
                    </label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Share your experience..."
                        rows={3}
                        maxLength={1000}
                        disabled={isSubmitting || isAnyUploading || !hasWriteAccess}
                        className="w-full px-3 py-2 bg-surface border border-border-light rounded-lg text-white placeholder-text-light/50 focus:outline-none focus:ring-2 focus:ring-accent resize-none text-sm disabled:opacity-50"
                    />
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm text-text-light mb-2">
                        Add Photos <span className="text-text-light/60">(optional)</span>
                    </label>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleFileInputChange}
                        disabled={!canAddMoreImages || isSubmitting || !hasNostrExtension}
                        multiple
                        className="hidden"
                    />

                    <div className="flex flex-wrap gap-2">
                        {images.map((image) => (
                            <div
                                key={image.id}
                                className="relative rounded-lg overflow-hidden border border-border-light bg-surface h-16 w-16"
                            >
                                <img
                                    src={image.previewUrl}
                                    alt="Review"
                                    className="w-full h-full object-cover"
                                />
                                {!image.url && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <SpinnerIcon className="w-4 h-4 text-white animate-spin" />
                                    </div>
                                )}
                                {image.url && !isSubmitting && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(image.id)}
                                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 hover:bg-red-500 flex items-center justify-center transition-colors"
                                        aria-label="Remove image"
                                    >
                                        <CloseIcon className="w-2.5 h-2.5 text-white" />
                                    </button>
                                )}
                            </div>
                        ))}

                        {canAddMoreImages && (
                            <button
                                type="button"
                                onClick={handleAddImageClick}
                                disabled={isAnyUploading || isSubmitting}
                                className="flex flex-col items-center justify-center h-16 w-16 border border-dashed border-border-light rounded-lg hover:border-accent/50 hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <PhotoIcon className="w-4 h-4 text-text-light" />
                                <span className="text-[10px] text-text-light mt-0.5">
                                    {images.length === 0 ? "Add" : "+"}
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Error */}
                {displayError && (
                    <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                        <WarningIcon className="w-4 h-4 flex-shrink-0" />
                        <span>{displayError}</span>
                    </div>
                )}

                {/* Buttons */}
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleCancelReview}
                        disabled={isSubmitting || isAnyUploading}
                        className="flex-1 px-3 py-2 text-sm text-text-light hover:text-white transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmitReview}
                        disabled={isSubmitting || isAnyUploading || !hasWriteAccess}
                        className="flex-1 px-3 py-2 bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <SpinnerIcon className="w-4 h-4 animate-spin" />
                                Submitting...
                            </>
                        ) : isAnyUploading ? (
                            <>
                                <SpinnerIcon className="w-4 h-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            "Submit"
                        )}
                    </button>
                </div>

                <LoginModal
                    isOpen={showLoginModal}
                    onClose={() => setShowLoginModal(false)}
                    titleKey="title"
                    descriptionKey="default"
                    onSuccess={handleLoginSuccess}
                />
            </div>
        );
    }

    if (totalReviews === 0) {
        return (
            <div className="text-center py-8">
                <ChatIcon className="w-10 h-10 mx-auto text-text-light mb-3" />
                <h3 className="text-base font-semibold text-white mb-2">No Reviews Yet</h3>
                <p className="text-text-light text-sm mb-4">
                    Be the first to share your experience!
                </p>
                <button
                    type="button"
                    onClick={handleWriteReviewClick}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-lg transition-colors"
                >
                    Write a Review
                </button>

                <LoginModal
                    isOpen={showLoginModal}
                    onClose={() => setShowLoginModal(false)}
                    titleKey="title"
                    descriptionKey="default"
                    onSuccess={handleLoginSuccess}
                />
            </div>
        );
    }

    // Show summary with reviews
    return (
        <div className="py-4 space-y-4">
            {/* Rating Summary */}
            <div className="text-center">
                <WeightedRating
                    weightedRating={weightedAverageRating}
                    simpleRating={simpleAverageRating}
                    totalReviews={totalReviews}
                />
            </div>

            {/* Preview of top reviews */}
            <div className="space-y-3">
                {reviews.slice(0, 2).map((review) => (
                    <div
                        key={review.eventId}
                        className="bg-surface rounded-lg p-3 border border-border-light"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            {review.rating !== null && (
                                <StarRating value={review.rating} readOnly size="sm" />
                            )}
                            <span className="text-xs text-text-light">
                                {review.author.name || review.authorPubkey.slice(0, 8) + "..."}
                            </span>
                        </div>
                        {review.content && (
                            <p className="text-sm text-text-light line-clamp-2">
                                {review.content}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
                <button
                    type="button"
                    onClick={handleWriteReviewClick}
                    className="block w-full text-center px-4 py-2 bg-accent hover:bg-accent-light text-white text-sm font-medium rounded-lg transition-colors"
                >
                    Write a Review
                </button>
                {totalReviews > 2 && (
                    <Link
                        href={`/places/${placeSlug}?tab=reviews`}
                        className="block text-center px-4 py-2 text-accent hover:text-accent-light text-sm font-medium transition-colors"
                    >
                        View All {totalReviews} Reviews
                    </Link>
                )}
            </div>

            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                titleKey="title"
                descriptionKey="default"
                onSuccess={handleLoginSuccess}
            />
        </div>
    );
}

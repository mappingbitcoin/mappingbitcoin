"use client";

import { useState, useEffect, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { PageSection } from "@/components/layout";
import Button from "@/components/ui/Button";
import {
    VerifiedBadgeIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    SpinnerIcon,
    LocationPinIcon,
} from "@/assets/icons/ui";

interface VerifiedPlace {
    id: string;
    osmId: string;
    verifiedAt: string | null;
    method: string;
    domainVerified: string | null;
    verifier: {
        pubkey: string;
        npub: string;
        displayName: string | null;
        picture: string | null;
    };
    venue: {
        name: string;
        slug: string;
        category: string | null;
        subcategory: string | null;
        city: string | null;
        country: string | null;
        lat: number | null;
        lon: number | null;
    };
}

interface PaginationInfo {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

const METHOD_LABELS: Record<string, string> = {
    EMAIL: "Email",
    DOMAIN: "Domain",
    PHONE: "Phone",
    MANUAL: "Manual Review",
    GOOGLE: "Google",
    PHYSICAL: "Physical",
};

export default function VerifiedPlacesClient() {
    const t = useTranslations();
    const [places, setPlaces] = useState<VerifiedPlace[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchPlaces = useCallback(async (page: number) => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/verified-places?page=${page}&limit=20`);
            const data = await res.json();

            if (!data.success) {
                throw new Error(data.error || "Failed to fetch verified places");
            }

            setPlaces(data.data);
            setPagination(data.pagination);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load verified places");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPlaces(currentPage);
    }, [currentPage, fetchPlaces]);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Unknown";
        return new Date(dateString).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const truncateNpub = (npub: string) => {
        if (npub.length <= 20) return npub;
        return `${npub.slice(0, 12)}...${npub.slice(-8)}`;
    };

    return (
        <PageSection padding="large" background="gradient" className="min-h-screen">
            <div className="max-w-container mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                            <VerifiedBadgeIcon className="w-6 h-6 text-green-400" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white">
                            Verified Places
                        </h1>
                    </div>
                    <p className="text-lg text-text-light max-w-2xl">
                        Browse all verified Bitcoin-accepting businesses. Each place has been
                        verified by its owner through email or domain verification, ensuring
                        authenticity and trust.
                    </p>
                    {pagination && (
                        <p className="text-sm text-text-light mt-2">
                            {pagination.totalCount.toLocaleString()} verified places
                        </p>
                    )}
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <SpinnerIcon className="w-8 h-8 text-accent animate-spin" />
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                        <p className="text-red-400 mb-4">{error}</p>
                        <Button onClick={() => fetchPlaces(currentPage)} variant="outline" color="danger">
                            Try Again
                        </Button>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && places.length === 0 && (
                    <div className="text-center py-20">
                        <VerifiedBadgeIcon className="w-16 h-16 text-text-light mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-white mb-2">No Verified Places Yet</h2>
                        <p className="text-text-light">
                            Be the first to verify your business!
                        </p>
                    </div>
                )}

                {/* Places Grid */}
                {!loading && !error && places.length > 0 && (
                    <>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {places.map((place) => (
                                <Link
                                    key={place.id}
                                    href={`/places/${place.venue.slug}`}
                                    className="group bg-surface rounded-xl border border-border-light p-5 hover:border-accent/50 hover:bg-surface-light transition-all duration-200 no-underline"
                                >
                                    {/* Venue Name & Badge */}
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <h3 className="text-lg font-semibold text-white group-hover:text-accent transition-colors line-clamp-2">
                                            {place.venue.name}
                                        </h3>
                                        <VerifiedBadgeIcon className="w-5 h-5 text-green-400 shrink-0" />
                                    </div>

                                    {/* Location */}
                                    {(place.venue.city || place.venue.country) && (
                                        <div className="flex items-center gap-1.5 text-sm text-text-light mb-3">
                                            <LocationPinIcon className="w-4 h-4" />
                                            <span>
                                                {[place.venue.city, place.venue.country]
                                                    .filter(Boolean)
                                                    .join(", ")}
                                            </span>
                                        </div>
                                    )}

                                    {/* Verification Info */}
                                    <div className="pt-3 border-t border-border-light space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-text-light">Verified via</span>
                                            <span className="text-white font-medium">
                                                {METHOD_LABELS[place.method] || place.method}
                                                {place.domainVerified && (
                                                    <span className="text-text-light ml-1">
                                                        ({place.domainVerified})
                                                    </span>
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-text-light">Date</span>
                                            <span className="text-white">
                                                {formatDate(place.verifiedAt)}
                                            </span>
                                        </div>

                                        {/* Verifier */}
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-text-light">Verifier</span>
                                            <div className="flex items-center gap-2">
                                                {place.verifier.picture ? (
                                                    <Image
                                                        src={place.verifier.picture}
                                                        alt=""
                                                        width={20}
                                                        height={20}
                                                        className="rounded-full"
                                                    />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-accent/20" />
                                                )}
                                                <span className="text-white font-mono text-xs">
                                                    {place.verifier.displayName || truncateNpub(place.verifier.npub)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-10">
                                <Button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={!pagination.hasPrevPage}
                                    variant="ghost"
                                    color="neutral"
                                    size="sm"
                                    leftIcon={<ChevronLeftIcon className="w-4 h-4" />}
                                >
                                    Previous
                                </Button>

                                <div className="flex items-center gap-1 mx-4">
                                    {generatePageNumbers(currentPage, pagination.totalPages).map((pageNum, idx) => (
                                        pageNum === "..." ? (
                                            <span key={`ellipsis-${idx}`} className="px-2 text-text-light">
                                                ...
                                            </span>
                                        ) : (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum as number)}
                                                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                                                    currentPage === pageNum
                                                        ? "bg-accent text-white"
                                                        : "bg-surface text-text-light hover:bg-surface-light hover:text-white"
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        )
                                    ))}
                                </div>

                                <Button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={!pagination.hasNextPage}
                                    variant="ghost"
                                    color="neutral"
                                    size="sm"
                                    rightIcon={<ChevronRightIcon className="w-4 h-4" />}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </PageSection>
    );
}

function generatePageNumbers(current: number, total: number): (number | "...")[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | "...")[] = [];

    // Always show first page
    pages.push(1);

    if (current > 3) {
        pages.push("...");
    }

    // Show pages around current
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    if (current < total - 2) {
        pages.push("...");
    }

    // Always show last page
    if (total > 1) {
        pages.push(total);
    }

    return pages;
}

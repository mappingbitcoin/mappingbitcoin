"use client";

import { useState, useEffect, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { PageSection } from "@/components/layout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import {
    VerifiedBadgeIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    SpinnerIcon,
    LocationPinIcon,
    SearchIcon,
    CloseIcon,
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
    const [places, setPlaces] = useState<VerifiedPlace[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");

    const fetchPlaces = useCallback(async (page: number, searchQuery: string) => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "20",
            });
            if (searchQuery) {
                params.set("search", searchQuery);
            }

            const res = await fetch(`/api/verified-places?${params}`);
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
        fetchPlaces(currentPage, search);
    }, [currentPage, search, fetchPlaces]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        setSearch(searchInput);
    };

    const clearSearch = () => {
        setSearchInput("");
        setSearch("");
        setCurrentPage(1);
    };

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
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
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
                        verified by its owner through email or domain verification.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search by name, city, country, or category..."
                                className="pl-10"
                            />
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light pointer-events-none" />
                            {searchInput && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-white transition-colors"
                                >
                                    <CloseIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <Button type="submit" disabled={loading}>
                            Search
                        </Button>
                    </form>
                    {search && pagination && (
                        <p className="text-sm text-text-light mt-2">
                            Found {pagination.totalCount.toLocaleString()} result{pagination.totalCount !== 1 ? "s" : ""} for "{search}"
                        </p>
                    )}
                </div>

                {/* Stats */}
                {!search && pagination && (
                    <div className="mb-6 text-sm text-text-light">
                        {pagination.totalCount.toLocaleString()} verified places
                    </div>
                )}

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
                        <Button onClick={() => fetchPlaces(currentPage, search)} variant="outline" color="danger">
                            Try Again
                        </Button>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && places.length === 0 && (
                    <div className="text-center py-20">
                        <VerifiedBadgeIcon className="w-16 h-16 text-text-light mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-white mb-2">
                            {search ? "No Results Found" : "No Verified Places Yet"}
                        </h2>
                        <p className="text-text-light">
                            {search
                                ? `No verified places match "${search}". Try a different search term.`
                                : "Be the first to verify your business!"
                            }
                        </p>
                        {search && (
                            <Button onClick={clearSearch} variant="ghost" className="mt-4">
                                Clear Search
                            </Button>
                        )}
                    </div>
                )}

                {/* Places List */}
                {!loading && !error && places.length > 0 && (
                    <>
                        <div className="space-y-3">
                            {places.map((place) => (
                                <Link
                                    key={place.id}
                                    href={`/places/${place.venue.slug}`}
                                    className="group flex items-center gap-4 bg-surface rounded-xl border border-border-light p-4 hover:border-accent/50 hover:bg-surface-light transition-all duration-200 no-underline"
                                >
                                    {/* Verified Badge */}
                                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                        <VerifiedBadgeIcon className="w-5 h-5 text-green-400" />
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-white font-semibold group-hover:text-accent transition-colors truncate">
                                                {place.venue.name}
                                            </h3>
                                            {place.venue.category && (
                                                <span className="text-xs bg-surface-light text-text-light px-2 py-0.5 rounded-full shrink-0">
                                                    {place.venue.category}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-text-light">
                                            {(place.venue.city || place.venue.country) && (
                                                <span className="flex items-center gap-1">
                                                    <LocationPinIcon className="w-3.5 h-3.5" />
                                                    {[place.venue.city, place.venue.country]
                                                        .filter(Boolean)
                                                        .join(", ")}
                                                </span>
                                            )}
                                            <span className="hidden sm:inline">
                                                Verified {formatDate(place.verifiedAt)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Verification Method & Verifier */}
                                    <div className="hidden md:flex items-center gap-4 shrink-0">
                                        <div className="text-right">
                                            <p className="text-xs text-text-light">Via</p>
                                            <p className="text-sm text-white font-medium">
                                                {METHOD_LABELS[place.method] || place.method}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {place.verifier.picture ? (
                                                <Image
                                                    src={place.verifier.picture}
                                                    alt=""
                                                    width={32}
                                                    height={32}
                                                    className="rounded-full"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                                                    <span className="text-xs text-accent font-medium">
                                                        {(place.verifier.displayName || "?")[0].toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <ChevronRightIcon className="w-5 h-5 text-text-light group-hover:text-accent transition-colors shrink-0" />
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

"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { Link } from "@/i18n/navigation";
import Modal from "@/components/ui/Modal";
import Button, { IconButton } from "@/components/ui/Button";
import ToggleButton from "@/components/ui/ToggleButton";
import DropdownItem from "@/components/ui/DropdownItem";
import { SearchIcon, ShieldCheckIcon, CloseIcon, PlusIcon, SpinnerIcon } from "@/assets/icons/ui";

interface VerifiedPlace {
    claimId: string;
    venueId: number;
    osmId: string;
    name: string;
    city: string;
    state?: string;
    country: string;
    countryCode: string;
    category?: string;
    subcategory?: string;
    slug?: string;
    lat: number;
    lon: number;
    verificationMethod: string;
    verifierPubkey: string;
    verifierName?: string;
    verifiedAt: string;
    verifiedEmailHash?: string;
    domainVerified?: string;
}

interface PlacesResponse {
    places: VerifiedPlace[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface PlaceSearchResult {
    id: number;
    osmId: string;
    name: string;
    city: string;
    state?: string;
    country: string;
    countryCode: string;
    category?: string;
    subcategory?: string;
    slug?: string;
    lat: number;
    lon: number;
    isVerified: boolean;
}

type VerificationMethod = "PHYSICAL" | "PHONE" | "EMAIL" | "DOMAIN";

export default function PlacesPage() {
    const { authToken } = useNostrAuth();
    const [places, setPlaces] = useState<VerifiedPlace[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Revoke modal state
    const [revokeModalOpen, setRevokeModalOpen] = useState(false);
    const [revokeTarget, setRevokeTarget] = useState<VerifiedPlace | null>(null);
    const [revokeReason, setRevokeReason] = useState("");
    const [revoking, setRevoking] = useState(false);
    const [revokeError, setRevokeError] = useState<string | null>(null);

    // Add verification modal state
    const [verifyModalOpen, setVerifyModalOpen] = useState(false);
    const [placeSearchQuery, setPlaceSearchQuery] = useState("");
    const [placeSearchResults, setPlaceSearchResults] = useState<PlaceSearchResult[]>([]);
    const [placeSearchLoading, setPlaceSearchLoading] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(null);
    const [verifyPubkey, setVerifyPubkey] = useState("");
    const [verifyMethod, setVerifyMethod] = useState<VerificationMethod>("PHYSICAL");
    const [verifying, setVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState<string | null>(null);
    const placeSearchRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
            setPage(1); // Reset to first page on new search
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Debounce place search
    useEffect(() => {
        if (!verifyModalOpen) return;
        if (placeSearchQuery.length < 2) {
            setPlaceSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            if (!authToken) return;

            // Cancel previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            setPlaceSearchLoading(true);
            try {
                const params = new URLSearchParams({
                    q: placeSearchQuery,
                    filter: "unverified",
                    limit: "10",
                });
                const response = await fetch(`/api/admin/nostr-bot/places?${params}`, {
                    headers: { Authorization: `Bearer ${authToken}` },
                    signal: abortControllerRef.current.signal,
                });

                if (response.ok) {
                    const data = await response.json();
                    setPlaceSearchResults(data.places || []);
                }
            } catch (err) {
                if ((err as Error).name !== "AbortError") {
                    console.error("Place search error:", err);
                }
            } finally {
                setPlaceSearchLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [placeSearchQuery, authToken, verifyModalOpen]);

    // Close place search dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (placeSearchRef.current && !placeSearchRef.current.contains(e.target as Node)) {
                setPlaceSearchResults([]);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchPlaces = useCallback(async () => {
        if (!authToken) return;

        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "20",
            });
            if (debouncedQuery) {
                params.set("q", debouncedQuery);
            }

            const response = await fetch(`/api/admin/places?${params}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch verified places");
            }

            const data: PlacesResponse = await response.json();
            setPlaces(data.places);
            setTotal(data.total);
            setTotalPages(data.totalPages);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load places");
        } finally {
            setLoading(false);
        }
    }, [authToken, page, debouncedQuery]);

    useEffect(() => {
        fetchPlaces();
    }, [fetchPlaces]);

    const openRevokeModal = (place: VerifiedPlace) => {
        setRevokeTarget(place);
        setRevokeReason("");
        setRevokeError(null);
        setRevokeModalOpen(true);
    };

    const closeRevokeModal = () => {
        setRevokeModalOpen(false);
        setRevokeTarget(null);
        setRevokeReason("");
        setRevokeError(null);
    };

    const openVerifyModal = () => {
        setSelectedPlace(null);
        setPlaceSearchQuery("");
        setPlaceSearchResults([]);
        setVerifyPubkey("");
        setVerifyMethod("PHYSICAL");
        setVerifyError(null);
        setVerifyModalOpen(true);
    };

    const closeVerifyModal = () => {
        setVerifyModalOpen(false);
        setSelectedPlace(null);
        setPlaceSearchQuery("");
        setPlaceSearchResults([]);
        setVerifyPubkey("");
        setVerifyMethod("PHYSICAL");
        setVerifyError(null);
    };

    const selectPlace = (place: PlaceSearchResult) => {
        setSelectedPlace(place);
        setPlaceSearchQuery("");
        setPlaceSearchResults([]);
    };

    const handleRevoke = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!revokeTarget || !authToken) return;

        setRevoking(true);
        setRevokeError(null);

        try {
            const response = await fetch(`/api/admin/places/${revokeTarget.claimId}/revoke`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ reason: revokeReason || "Revoked by admin" }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to revoke verification");
            }

            closeRevokeModal();
            fetchPlaces();
        } catch (err) {
            setRevokeError(err instanceof Error ? err.message : "Failed to revoke");
        } finally {
            setRevoking(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPlace || !authToken) return;

        if (!verifyPubkey.trim()) {
            setVerifyError("Owner pubkey is required");
            return;
        }

        setVerifying(true);
        setVerifyError(null);

        try {
            const response = await fetch("/api/admin/places/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    venueId: selectedPlace.id,
                    pubkey: verifyPubkey.trim(),
                    method: verifyMethod,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to create verification");
            }

            closeVerifyModal();
            fetchPlaces();
        } catch (err) {
            setVerifyError(err instanceof Error ? err.message : "Failed to verify");
        } finally {
            setVerifying(false);
        }
    };

    const formatMethod = (method: string) => {
        switch (method) {
            case "EMAIL":
                return "Email";
            case "DOMAIN":
                return "Domain";
            case "MANUAL":
                return "Manual";
            case "PHYSICAL":
                return "Physical";
            case "PHONE":
                return "Phone";
            default:
                return method;
        }
    };

    const getMethodBadgeClass = (method: string) => {
        switch (method) {
            case "EMAIL":
                return "bg-blue-500/10 text-blue-400";
            case "DOMAIN":
                return "bg-purple-500/10 text-purple-400";
            case "MANUAL":
                return "bg-amber-500/10 text-amber-400";
            case "PHYSICAL":
                return "bg-green-500/10 text-green-400";
            case "PHONE":
                return "bg-cyan-500/10 text-cyan-400";
            default:
                return "bg-gray-500/10 text-gray-400";
        }
    };

    if (error && !loading) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Verified Places</h1>
                    <p className="text-text-light mt-1">
                        Manage verified venue ownership claims
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-full text-sm">
                        <ShieldCheckIcon className="w-4 h-4" />
                        <span>{total} verified</span>
                    </div>
                    <Button
                        onClick={openVerifyModal}
                        leftIcon={<PlusIcon />}
                    >
                        Add Verification
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by venue name, city, or country..."
                    className="w-full pl-10 pr-10 py-2.5 bg-surface border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary"
                />
                {searchQuery && (
                    <IconButton
                        onClick={() => setSearchQuery("")}
                        icon={<CloseIcon className="w-4 h-4" />}
                        aria-label="Clear search"
                        variant="ghost"
                        color="neutral"
                        size="xs"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                    />
                )}
            </div>

            {/* Places Table */}
            <div className="bg-surface rounded-xl border border-border-light overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
                    </div>
                ) : places.length === 0 ? (
                    <div className="p-8 text-center text-text-light">
                        {debouncedQuery ? (
                            <p>No verified places found matching &quot;{debouncedQuery}&quot;</p>
                        ) : (
                            <p>No verified places yet.</p>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-surface-light">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Venue</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Location</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Method</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Verified</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Owner</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-text-light">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                                {places.map((place) => (
                                    <tr key={place.claimId} className="hover:bg-surface-light/50">
                                        <td className="px-4 py-3">
                                            <div>
                                                {place.slug ? (
                                                    <Link
                                                        href={`/places/${place.slug}`}
                                                        className="text-white hover:text-accent transition-colors font-medium"
                                                    >
                                                        {place.name}
                                                    </Link>
                                                ) : (
                                                    <span className="text-white font-medium">{place.name}</span>
                                                )}
                                                {place.category && (
                                                    <p className="text-xs text-text-light mt-0.5">
                                                        {place.category}
                                                        {place.subcategory && ` / ${place.subcategory}`}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm">
                                                <span className="text-white">{place.city}</span>
                                                {place.state && (
                                                    <span className="text-text-light">, {place.state}</span>
                                                )}
                                                <p className="text-text-light text-xs">{place.country}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMethodBadgeClass(
                                                    place.verificationMethod
                                                )}`}
                                            >
                                                {formatMethod(place.verificationMethod)}
                                            </span>
                                            {place.domainVerified && (
                                                <p className="text-xs text-text-light mt-0.5 truncate max-w-[120px]">
                                                    {place.domainVerified}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-text-light text-sm">
                                            {new Date(place.verifiedAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm">
                                                {place.verifierName ? (
                                                    <span className="text-white">{place.verifierName}</span>
                                                ) : (
                                                    <code className="text-xs text-text-light bg-surface-light px-1.5 py-0.5 rounded">
                                                        {place.verifierPubkey.slice(0, 8)}...
                                                    </code>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                onClick={() => openRevokeModal(place)}
                                                variant="ghost"
                                                color="danger"
                                                size="sm"
                                            >
                                                Revoke
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-text-light">
                        Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} of {total}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            variant="soft"
                            color="neutral"
                            size="sm"
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-text-light px-3">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            variant="soft"
                            color="neutral"
                            size="sm"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Revoke Modal */}
            <Modal
                isOpen={revokeModalOpen}
                onClose={closeRevokeModal}
                title="Revoke Verification"
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleRevoke} className="p-6 space-y-4">
                    {revokeError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                            {revokeError}
                        </div>
                    )}

                    <div className="bg-surface-light rounded-lg p-4">
                        <p className="text-white font-medium">{revokeTarget?.name}</p>
                        <p className="text-text-light text-sm">
                            {revokeTarget?.city}, {revokeTarget?.country}
                        </p>
                        <p className="text-xs text-text-light mt-2">
                            Verified via {formatMethod(revokeTarget?.verificationMethod || "")} on{" "}
                            {revokeTarget?.verifiedAt
                                ? new Date(revokeTarget.verifiedAt).toLocaleDateString()
                                : ""}
                        </p>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-400 text-sm">
                        This action will remove the verified status from this venue. The owner
                        will need to re-verify ownership to regain verified status.
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-light mb-1">
                            Reason for revocation
                        </label>
                        <textarea
                            value={revokeReason}
                            onChange={(e) => setRevokeReason(e.target.value)}
                            placeholder="e.g., Business closed, ownership changed, fraudulent claim..."
                            rows={3}
                            className="w-full px-4 py-2 bg-surface-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-primary resize-none"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            onClick={closeRevokeModal}
                            variant="ghost"
                            color="neutral"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={revoking}
                            loading={revoking}
                            color="danger"
                        >
                            {revoking ? "Revoking..." : "Revoke Verification"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Add Verification Modal */}
            <Modal
                isOpen={verifyModalOpen}
                onClose={closeVerifyModal}
                title="Add Manual Verification"
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleVerify} className="p-6 space-y-4">
                    {verifyError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                            {verifyError}
                        </div>
                    )}

                    {/* Place Search */}
                    <div ref={placeSearchRef}>
                        <label className="block text-sm font-medium text-white mb-2">
                            Select Venue
                        </label>
                        {selectedPlace ? (
                            <div className="flex items-center justify-between bg-green-500/10 rounded-lg p-3 border border-green-500/30">
                                <div>
                                    <p className="text-white font-medium">{selectedPlace.name}</p>
                                    <p className="text-gray-300 text-sm">
                                        {selectedPlace.city}, {selectedPlace.country}
                                    </p>
                                </div>
                                <IconButton
                                    onClick={() => setSelectedPlace(null)}
                                    icon={<CloseIcon className="w-4 h-4" />}
                                    aria-label="Clear selection"
                                    variant="ghost"
                                    color="neutral"
                                    size="xs"
                                />
                            </div>
                        ) : (
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={placeSearchQuery}
                                    onChange={(e) => setPlaceSearchQuery(e.target.value)}
                                    placeholder="Search for a venue..."
                                    className="w-full pl-9 pr-9 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent"
                                />
                                {placeSearchLoading && (
                                    <SpinnerIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                                )}

                                {/* Search Results Dropdown */}
                                {placeSearchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                        {placeSearchResults.map((place) => (
                                            <DropdownItem
                                                key={place.id}
                                                onClick={() => selectPlace(place)}
                                                className="py-2.5 border-b border-gray-700 last:border-b-0"
                                            >
                                                <div>
                                                    <p className="text-white font-medium text-sm">{place.name}</p>
                                                    <p className="text-gray-400 text-xs">
                                                        {place.city}, {place.country}
                                                        {place.category && ` • ${place.category}`}
                                                    </p>
                                                </div>
                                            </DropdownItem>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Owner Pubkey */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Owner Pubkey / npub
                        </label>
                        <input
                            type="text"
                            value={verifyPubkey}
                            onChange={(e) => setVerifyPubkey(e.target.value)}
                            placeholder="npub1... or 64-char hex pubkey"
                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-accent font-mono text-sm"
                        />
                        <p className="text-xs text-gray-400 mt-1.5">
                            The Nostr public key of the venue owner
                        </p>
                    </div>

                    {/* Verification Method */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">
                            Verification Method
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {(["PHYSICAL", "PHONE", "EMAIL", "DOMAIN"] as VerificationMethod[]).map((method) => (
                                <ToggleButton
                                    key={method}
                                    selected={verifyMethod === method}
                                    onClick={() => setVerifyMethod(method)}
                                    size="md"
                                >
                                    {formatMethod(method)}
                                </ToggleButton>
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            {verifyMethod === "PHYSICAL" && "Verified in person at the physical location"}
                            {verifyMethod === "PHONE" && "Verified via phone call to the business"}
                            {verifyMethod === "EMAIL" && "Verified via email correspondence"}
                            {verifyMethod === "DOMAIN" && "Verified via domain ownership proof"}
                        </p>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700 mt-2">
                        <Button
                            type="button"
                            onClick={closeVerifyModal}
                            variant="ghost"
                            color="neutral"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={verifying || !selectedPlace}
                            loading={verifying}
                        >
                            {verifying ? "Verifying..." : "Add Verification"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

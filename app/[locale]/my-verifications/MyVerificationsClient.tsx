"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useNostrAuth } from "@/contexts/NostrAuthContext";

interface Claim {
    id: string;
    osmId: string;
    status: string;
    method: string;
    createdAt: string;
    expiresAt: string | null;
    verifiedAt: string | null;
    domainToVerify: string | null;
    txtRecordValue: string | null;
    nextCheckAt: string | null;
    checkCount: number;
    venueName: string;
    venueSlug?: string;
    venueCity?: string;
    venueCountry?: string;
}

export default function MyVerificationsClient() {
    const { user, getAuthToken } = useNostrAuth();
    const [claims, setClaims] = useState<Claim[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [checkingClaim, setCheckingClaim] = useState<string | null>(null);
    const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

    const fetchClaims = useCallback(async () => {
        if (!user) return;

        try {
            const token = await getAuthToken();
            const response = await fetch("/api/verify/my-claims", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch claims");
            }

            const data = await response.json();
            setClaims(data.claims);

            // Initialize cooldowns for pending domain claims
            const newCooldowns: Record<string, number> = {};
            data.claims.forEach((claim: Claim) => {
                if (claim.nextCheckAt && claim.status === "PENDING") {
                    const remaining = Math.max(0, Math.ceil((new Date(claim.nextCheckAt).getTime() - Date.now()) / 1000));
                    if (remaining > 0) {
                        newCooldowns[claim.id] = remaining;
                    }
                }
            });
            setCooldowns(newCooldowns);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [user, getAuthToken]);

    useEffect(() => {
        fetchClaims();
    }, [fetchClaims]);

    // Countdown timer for cooldowns
    useEffect(() => {
        const interval = setInterval(() => {
            setCooldowns(prev => {
                const updated: Record<string, number> = {};
                let hasChanges = false;
                Object.entries(prev).forEach(([id, seconds]) => {
                    if (seconds > 1) {
                        updated[id] = seconds - 1;
                        hasChanges = true;
                    } else if (seconds === 1) {
                        hasChanges = true;
                    }
                });
                return hasChanges ? updated : prev;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleCheckDomain = async (claimId: string) => {
        if (cooldowns[claimId]) return;

        setCheckingClaim(claimId);
        try {
            const token = await getAuthToken();
            const response = await fetch("/api/verify/domain/check", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ claimId }),
            });

            const data = await response.json();

            if (response.status === 429) {
                // Rate limited
                setCooldowns(prev => ({
                    ...prev,
                    [claimId]: data.cooldownSeconds || 30,
                }));
            } else if (data.verified) {
                // Refresh claims to show updated status
                fetchClaims();
            } else if (data.cooldownSeconds) {
                setCooldowns(prev => ({
                    ...prev,
                    [claimId]: data.cooldownSeconds,
                }));
            }
        } catch (err) {
            console.error("Failed to check domain:", err);
        } finally {
            setCheckingClaim(null);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: "bg-amber-500/20 text-amber-400",
            VERIFIED: "bg-green-500/20 text-green-400",
            EXPIRED: "bg-red-500/20 text-red-400",
            REJECTED: "bg-red-500/20 text-red-400",
        };
        return styles[status] || "bg-gray-500/20 text-gray-400";
    };

    const getMethodLabel = (method: string) => {
        const labels: Record<string, string> = {
            EMAIL: "Email",
            DOMAIN: "Domain TXT",
            PHONE: "Phone",
            MANUAL: "Manual",
        };
        return labels[method] || method;
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-primary pt-24 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-surface rounded-2xl border border-border-light p-8 text-center">
                        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-white mb-2">Login Required</h1>
                        <p className="text-text-light mb-6">
                            Please log in with Nostr to view your venue verifications.
                        </p>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors no-underline"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            Log In
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-primary pt-24 px-4 pb-12">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <h1 className="text-3xl font-bold text-white mb-2">My Verifications</h1>
                    <p className="text-text-light mb-8">
                        Manage your venue ownership verification requests.
                    </p>

                    {loading ? (
                        <div className="bg-surface rounded-2xl border border-border-light p-8">
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                                <span className="text-text-light">Loading your verifications...</span>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="bg-surface rounded-2xl border border-red-500/30 p-8">
                            <p className="text-red-400 text-center">{error}</p>
                        </div>
                    ) : claims.length === 0 ? (
                        <div className="bg-surface rounded-2xl border border-border-light p-8 text-center">
                            <div className="w-16 h-16 bg-surface-light rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-semibold text-white mb-2">No Verifications Yet</h2>
                            <p className="text-text-light mb-4">
                                You haven&apos;t verified any venues yet. Find a venue and claim ownership to get started.
                            </p>
                            <Link
                                href="/map"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors no-underline"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                </svg>
                                Explore Map
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {claims.map((claim) => (
                                <motion.div
                                    key={claim.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-surface rounded-2xl border border-border-light p-6"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-white">
                                                    {claim.venueSlug ? (
                                                        <Link
                                                            href={`/places/${claim.venueSlug}`}
                                                            className="hover:text-accent transition-colors no-underline text-white"
                                                        >
                                                            {claim.venueName}
                                                        </Link>
                                                    ) : (
                                                        claim.venueName
                                                    )}
                                                </h3>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(claim.status)}`}>
                                                    {claim.status}
                                                </span>
                                            </div>

                                            {(claim.venueCity || claim.venueCountry) && (
                                                <p className="text-sm text-text-light mb-2">
                                                    {[claim.venueCity, claim.venueCountry].filter(Boolean).join(", ")}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap gap-4 text-sm text-text-light">
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                    </svg>
                                                    {getMethodLabel(claim.method)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {formatDate(claim.createdAt)}
                                                </span>
                                                {claim.verifiedAt && (
                                                    <span className="flex items-center gap-1 text-green-400">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Verified {formatDate(claim.verifiedAt)}
                                                    </span>
                                                )}
                                                {claim.expiresAt && claim.status === "PENDING" && (
                                                    <span className="flex items-center gap-1 text-amber-400">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                        </svg>
                                                        Expires {formatDate(claim.expiresAt)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Domain verification details */}
                                    {claim.method === "DOMAIN" && claim.status === "PENDING" && claim.txtRecordValue && (
                                        <div className="mt-4 pt-4 border-t border-border-light">
                                            <p className="text-sm text-text-light mb-2">
                                                Add this TXT record to <strong className="text-white">{claim.domainToVerify}</strong>:
                                            </p>
                                            <div className="flex items-center gap-2 bg-surface-light rounded-lg p-3">
                                                <code className="flex-1 text-sm text-accent font-mono break-all">
                                                    {claim.txtRecordValue}
                                                </code>
                                                <button
                                                    onClick={() => copyToClipboard(claim.txtRecordValue!)}
                                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                                    title="Copy to clipboard"
                                                >
                                                    <svg className="w-4 h-4 text-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="mt-3 flex items-center gap-3">
                                                <button
                                                    onClick={() => handleCheckDomain(claim.id)}
                                                    disabled={checkingClaim === claim.id || !!cooldowns[claim.id]}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {checkingClaim === claim.id ? (
                                                        <>
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                            Checking...
                                                        </>
                                                    ) : cooldowns[claim.id] ? (
                                                        <>
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Wait {cooldowns[claim.id]}s
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                            </svg>
                                                            Check Now
                                                        </>
                                                    )}
                                                </button>
                                                <span className="text-xs text-text-light">
                                                    Checks: {claim.checkCount}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

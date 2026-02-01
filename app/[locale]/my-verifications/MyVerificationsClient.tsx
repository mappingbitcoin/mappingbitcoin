"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { LoginModal } from "@/components/auth";
import {
    UserIcon,
    LoginIcon,
    ShieldCheckIcon,
    MapIcon,
    ClockIcon,
    CheckmarkIcon,
    WarningIcon,
    CopyIcon,
    RefreshIcon,
} from "@/assets/icons";
import Button, { IconButton } from "@/components/ui/Button";

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
    const t = useTranslations("login.myVerifications");
    const tMenu = useTranslations("menu");
    const { authToken } = useNostrAuth();
    const [claims, setClaims] = useState<Claim[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [checkingClaim, setCheckingClaim] = useState<string | null>(null);
    const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
    const [showLoginModal, setShowLoginModal] = useState(false);

    const fetchClaims = useCallback(async () => {
        if (!authToken) return;

        try {
            const response = await fetch("/api/verify/my-claims", {
                headers: {
                    Authorization: `Bearer ${authToken}`,
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
    }, [authToken]);

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
        if (cooldowns[claimId] || !authToken) return;

        setCheckingClaim(claimId);
        try {
            const response = await fetch("/api/verify/domain/check", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
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

    if (!authToken) {
        return (
            <div className="min-h-screen bg-primary pt-24 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-surface rounded-2xl border border-border-light p-8 text-center">
                        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <UserIcon className="w-8 h-8 text-accent" />
                        </div>
                        <h1 className="text-xl font-bold text-white mb-2">{t("loginRequired")}</h1>
                        <p className="text-text-light mb-6">
                            {t("pleaseLogin")}
                        </p>
                        <Button
                            onClick={() => setShowLoginModal(true)}
                            leftIcon={<LoginIcon className="w-5 h-5" />}
                        >
                            {tMenu("login")}
                        </Button>
                    </div>
                    <LoginModal
                        isOpen={showLoginModal}
                        onClose={() => setShowLoginModal(false)}
                    />
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
                                <ShieldCheckIcon className="w-8 h-8 text-text-light" />
                            </div>
                            <h2 className="text-lg font-semibold text-white mb-2">No Verifications Yet</h2>
                            <p className="text-text-light mb-4">
                                You haven&apos;t verified any venues yet. Find a venue and claim ownership to get started.
                            </p>
                            <Link
                                href="/map"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors no-underline"
                            >
                                <MapIcon className="w-4 h-4" />
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
                                                    <ShieldCheckIcon className="w-4 h-4" />
                                                    {getMethodLabel(claim.method)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <ClockIcon className="w-4 h-4" />
                                                    {formatDate(claim.createdAt)}
                                                </span>
                                                {claim.verifiedAt && (
                                                    <span className="flex items-center gap-1 text-green-400">
                                                        <CheckmarkIcon className="w-4 h-4" />
                                                        Verified {formatDate(claim.verifiedAt)}
                                                    </span>
                                                )}
                                                {claim.expiresAt && claim.status === "PENDING" && (
                                                    <span className="flex items-center gap-1 text-amber-400">
                                                        <WarningIcon className="w-4 h-4" />
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
                                                    <CopyIcon className="w-4 h-4 text-text-light" />
                                                </button>
                                            </div>
                                            <div className="mt-3 flex items-center gap-3">
                                                <Button
                                                    onClick={() => handleCheckDomain(claim.id)}
                                                    disabled={checkingClaim === claim.id || !!cooldowns[claim.id]}
                                                    loading={checkingClaim === claim.id}
                                                    size="sm"
                                                    leftIcon={cooldowns[claim.id] ? <ClockIcon className="w-4 h-4" /> : <RefreshIcon className="w-4 h-4" />}
                                                >
                                                    {checkingClaim === claim.id
                                                        ? "Checking..."
                                                        : cooldowns[claim.id]
                                                            ? `Wait ${cooldowns[claim.id]}s`
                                                            : "Check Now"
                                                    }
                                                </Button>
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

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { EnrichedVenue } from "@/models/Overpass";
import { VerificationState, VerificationMethod } from "./index";

interface VerificationStepProps {
    venue: EnrichedVenue;
    venueName: string;
    osmEmail?: string;
    method: VerificationMethod;
    selectedDomain?: string | null;
    step: VerificationState;
    setStep: (step: VerificationState) => void;
    onError: (error: string | null) => void;
    onSuccess: () => void;
}

export default function VerificationStep({
    venue,
    venueName,
    selectedDomain,
    step,
    setStep,
    onError,
    onSuccess,
}: VerificationStepProps) {
    const { authenticate, authToken } = useNostrAuth();
    const [claimId, setClaimId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Domain verification state
    const [domain, setDomain] = useState<string | null>(null);
    const [txtRecordValue, setTxtRecordValue] = useState<string | null>(null);
    const [checkCooldown, setCheckCooldown] = useState(0);

    // Check cooldown timer
    useEffect(() => {
        if (checkCooldown > 0) {
            const timer = setTimeout(() => setCheckCooldown(checkCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [checkCooldown]);

    const handleInitiateDomainVerification = async () => {
        setIsLoading(true);
        onError(null);

        try {
            let token = authToken;
            if (!token) {
                token = await authenticate();
            }

            const response = await fetch("/api/verify/domain/initiate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    osmId: `${venue.type}/${venue.id}`,
                    selectedDomain: selectedDomain || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to initiate domain verification");
            }

            setClaimId(data.claimId);
            setDomain(data.domain);
            setTxtRecordValue(data.txtRecordValue);
            setStep("domain-pending");
        } catch (err) {
            onError(err instanceof Error ? err.message : "Failed to initiate domain verification");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckDomain = async () => {
        if (checkCooldown > 0 || !claimId) return;

        setIsLoading(true);
        onError(null);

        try {
            let token = authToken;
            if (!token) {
                token = await authenticate();
            }

            const response = await fetch("/api/verify/domain/check", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ claimId }),
            });

            const data = await response.json();

            if (response.status === 429) {
                setCheckCooldown(data.cooldownSeconds || 30);
                onError(data.error || "Please wait before checking again");
            } else if (data.verified) {
                setStep("success");
            } else {
                if (data.cooldownSeconds) {
                    setCheckCooldown(data.cooldownSeconds);
                }
                onError(data.message || "TXT record not found yet. Make sure DNS has propagated.");
            }
        } catch (err) {
            onError(err instanceof Error ? err.message : "Failed to check domain verification");
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    // Domain: Verifying step - initiate domain verification
    if (step === "verifying") {
        return (
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
            >
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-300">
                        To verify ownership, you&apos;ll need to add a TXT record to your domain&apos;s DNS settings.
                    </p>
                </div>

                <div className="p-4 bg-surface-light rounded-lg">
                    <p className="text-sm text-text-light mb-2">
                        <strong className="text-white">Domain to verify:</strong>
                    </p>
                    <p className="text-accent font-mono text-lg">{selectedDomain}</p>
                </div>

                <button
                    onClick={handleInitiateDomainVerification}
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-accent hover:bg-accent-dark text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            Generate TXT Record
                        </>
                    )}
                </button>
            </motion.div>
        );
    }

    // Domain: Pending step - show TXT record and check button
    if (step === "domain-pending") {
        return (
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
            >
                <div className="text-center">
                    <p className="text-text-light text-sm">
                        Add this TXT record to <span className="text-white font-medium">{domain}</span>
                    </p>
                </div>

                <div className="bg-surface-light rounded-lg p-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs text-text-light uppercase">TXT Record Value</span>
                        <button
                            onClick={() => txtRecordValue && copyToClipboard(txtRecordValue)}
                            className="text-xs text-accent hover:text-accent-dark transition-colors flex items-center gap-1"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                        </button>
                    </div>
                    <code className="block text-sm text-accent font-mono break-all bg-primary-light p-2 rounded">
                        {txtRecordValue}
                    </code>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-sm text-amber-300">
                        DNS changes can take up to 24-48 hours to propagate. You can check back anytime within 24 hours.
                    </p>
                </div>

                <button
                    onClick={handleCheckDomain}
                    disabled={isLoading || checkCooldown > 0}
                    className="w-full py-3 px-4 bg-accent hover:bg-accent-dark text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Checking...
                        </>
                    ) : checkCooldown > 0 ? (
                        <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Wait {checkCooldown}s
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Check TXT Record
                        </>
                    )}
                </button>

                <p className="text-xs text-text-light text-center">
                    You can also check later from the &quot;My Verifications&quot; page in your profile menu.
                </p>
            </motion.div>
        );
    }

    // Success step
    if (step === "success") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center space-y-4"
            >
                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-white">Verification Complete!</h3>
                    <p className="text-text-light text-sm mt-1">
                        You are now the verified owner of <span className="text-white font-medium">{venueName}</span>
                    </p>
                </div>

                <div className="p-4 bg-surface-light rounded-lg">
                    <p className="text-sm text-text-light">
                        Your venue now displays a &quot;Verified Owner&quot; badge. This verification is linked to your Nostr identity.
                    </p>
                </div>

                <button
                    onClick={onSuccess}
                    className="w-full py-3 px-4 bg-accent hover:bg-accent-dark text-white rounded-lg font-medium transition-colors"
                >
                    Done
                </button>
            </motion.div>
        );
    }

    return null;
}

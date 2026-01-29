"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/ui/Modal";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { EnrichedVenue } from "@/models/Overpass";
import LoginStep from "./LoginStep";
import VerificationStep from "./VerificationStep";
import { getVerifiableDomains } from "@/lib/verification/domainUtils";
import { parseTags } from "@/utils/OsmHelpers";

interface VerifyOwnershipModalProps {
    isOpen: boolean;
    onClose: () => void;
    venue: EnrichedVenue;
    venueName: string;
    osmEmail?: string;
}

export type VerificationState = "login" | "method-select" | "domain-select" | "verifying" | "domain-pending" | "email-pending" | "success" | "error";
export type VerificationMethod = "domain" | "email";

export default function VerifyOwnershipModal({
    isOpen,
    onClose,
    venue,
    venueName,
}: VerifyOwnershipModalProps) {
    const { user } = useNostrAuth();
    const [step, setStep] = useState<VerificationState>("login");
    const [method, setMethod] = useState<VerificationMethod | null>(null);
    const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Extract contact info from venue
    const { contact } = useMemo(() => parseTags(venue.tags), [venue.tags]);
    const venueEmail = contact?.email;

    // Extract available domains from website and/or email (excluding common providers)
    const availableDomains = useMemo(() => {
        return getVerifiableDomains(venue.tags);
    }, [venue.tags]);

    const hasDomainOptions = availableDomains.length > 0;
    const hasEmailOption = !!venueEmail;
    const hasMultipleMethods = hasDomainOptions && hasEmailOption;
    const hasMultipleDomains = availableDomains.length > 1;

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setMethod(null);
            setSelectedDomain(null);
            if (step !== "error") setError(null);

            if (user) {
                if (hasMultipleMethods) {
                    // Both email and domain options - let user choose method
                    setStep("method-select");
                } else if (hasEmailOption) {
                    // Only email option
                    setMethod("email");
                    setStep("verifying");
                } else if (hasDomainOptions) {
                    // Only domain option(s)
                    setMethod("domain");
                    if (hasMultipleDomains) {
                        setStep("domain-select");
                    } else {
                        setSelectedDomain(availableDomains[0]?.domain || null);
                        setStep("verifying");
                    }
                } else {
                    // No options available
                    setStep("error");
                    setError("No email or domain found for this venue.");
                }
            } else {
                setStep("login");
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, user]);

    // Update step when user logs in
    useEffect(() => {
        if (user && step === "login") {
            if (hasMultipleMethods) {
                setStep("method-select");
            } else if (hasEmailOption) {
                setMethod("email");
                setStep("verifying");
            } else if (hasDomainOptions) {
                setMethod("domain");
                if (hasMultipleDomains) {
                    setStep("domain-select");
                } else {
                    setSelectedDomain(availableDomains[0]?.domain || null);
                    setStep("verifying");
                }
            } else {
                setStep("error");
                setError("No email or domain found for this venue.");
            }
        }
    }, [user, step, hasMultipleMethods, hasEmailOption, hasDomainOptions, hasMultipleDomains, availableDomains]);

    const handleClose = () => {
        setStep("login");
        setMethod(null);
        setSelectedDomain(null);
        setError(null);
        onClose();
    };

    const handleSelectMethod = (selectedMethod: VerificationMethod) => {
        setMethod(selectedMethod);
        if (selectedMethod === "email") {
            setStep("verifying");
        } else if (selectedMethod === "domain") {
            if (hasMultipleDomains) {
                setStep("domain-select");
            } else {
                setSelectedDomain(availableDomains[0]?.domain || null);
                setStep("verifying");
            }
        }
    };

    const handleSelectDomain = (domain: string) => {
        setSelectedDomain(domain);
        setStep("verifying");
    };

    const handleBackToMethodSelect = () => {
        setMethod(null);
        setSelectedDomain(null);
        setError(null);
        setStep("method-select");
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-lg">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Verify Ownership</h2>
                        <p className="text-sm text-text-light">{venueName}</p>
                    </div>
                </div>

                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-6">
                    <StepIndicator number={1} label="Login" active={step === "login"} completed={!!user} />
                    <div className="flex-1 h-px bg-border-light" />
                    <StepIndicator number={2} label="Verify" active={["method-select", "domain-select", "verifying", "domain-pending", "email-pending"].includes(step)} completed={step === "success"} />
                    <div className="flex-1 h-px bg-border-light" />
                    <StepIndicator number={3} label="Done" active={step === "success"} completed={step === "success"} />
                </div>

                {/* Error display */}
                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {step === "login" && (
                        <LoginStep key="login" onError={setError} />
                    )}

                    {step === "method-select" && user && (
                        <motion.div
                            key="method-select"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            <p className="text-text-light text-sm text-center mb-4">
                                Choose how you want to verify ownership:
                            </p>

                            <div className="space-y-3">
                                {/* Email verification option */}
                                {hasEmailOption && (
                                    <button
                                        onClick={() => handleSelectMethod("email")}
                                        className="w-full p-4 bg-surface-light hover:bg-surface-light/80 border border-border-light hover:border-accent/50 rounded-lg transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-white font-medium group-hover:text-accent transition-colors">Email Verification</h3>
                                                <p className="text-text-light text-sm">
                                                    We&apos;ll send a code to the venue&apos;s registered email
                                                </p>
                                            </div>
                                            <svg className="w-5 h-5 text-text-light group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </button>
                                )}

                                {/* Domain verification option */}
                                {hasDomainOptions && (
                                    <button
                                        onClick={() => handleSelectMethod("domain")}
                                        className="w-full p-4 bg-surface-light hover:bg-surface-light/80 border border-border-light hover:border-accent/50 rounded-lg transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-white font-medium group-hover:text-accent transition-colors">Domain Verification</h3>
                                                <p className="text-text-light text-sm">
                                                    Add a DNS TXT record to your domain
                                                </p>
                                            </div>
                                            <svg className="w-5 h-5 text-text-light group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {step === "domain-select" && user && (
                        <motion.div
                            key="domain-select"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4"
                        >
                            {hasMultipleMethods && (
                                <button
                                    onClick={handleBackToMethodSelect}
                                    className="text-sm text-text-light hover:text-white flex items-center gap-1 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Back to methods
                                </button>
                            )}

                            <p className="text-text-light text-sm text-center mb-4">
                                Choose which domain you want to use for verification:
                            </p>

                            <div className="space-y-3">
                                {availableDomains.map(({ domain, source }) => (
                                    <button
                                        key={domain}
                                        onClick={() => handleSelectDomain(domain)}
                                        className="w-full p-4 bg-surface-light hover:bg-surface-light/80 border border-border-light hover:border-accent/50 rounded-lg transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-white font-medium group-hover:text-accent transition-colors">{domain}</h3>
                                                <p className="text-text-light text-sm">
                                                    From {source === 'website' ? 'website URL' : 'email address'}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <p className="text-text-light text-xs text-center">
                                You&apos;ll need to add a DNS TXT record to verify domain ownership.
                            </p>
                        </motion.div>
                    )}

                    {(step === "verifying" || step === "domain-pending" || step === "email-pending" || step === "success" || step === "error") && user && method && (
                        <VerificationStep
                            key="verification"
                            venue={venue}
                            venueName={venueName}
                            osmEmail={venueEmail}
                            method={method}
                            selectedDomain={selectedDomain}
                            step={step}
                            setStep={setStep}
                            onError={setError}
                            onSuccess={handleClose}
                            onBack={hasMultipleMethods ? handleBackToMethodSelect : undefined}
                        />
                    )}
                </AnimatePresence>
            </div>
        </Modal>
    );
}

function StepIndicator({ number, label, active, completed }: { number: number; label: string; active: boolean; completed: boolean }) {
    return (
        <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                completed ? "bg-green-500 text-white" : active ? "bg-accent text-white" : "bg-surface-light text-text-light"
            }`}>
                {completed ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    number
                )}
            </div>
            <span className={`text-xs ${active || completed ? "text-white" : "text-text-light"}`}>{label}</span>
        </div>
    );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "@/components/ui/Modal";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { EnrichedVenue } from "@/models/Overpass";
import LoginStep from "./LoginStep";
import VerificationStep from "./VerificationStep";

interface VerifyOwnershipModalProps {
    isOpen: boolean;
    onClose: () => void;
    venue: EnrichedVenue;
    venueName: string;
    osmEmail?: string;
}

export type VerificationState = "login" | "method-select" | "domain-select" | "verifying" | "code" | "domain-pending" | "success" | "error";
export type VerificationMethod = "email" | "domain";

// Helper to extract domain from URL
function extractDomainFromUrl(website: string): string | null {
    try {
        let url = website.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        const parsed = new URL(url);
        return parsed.hostname.replace(/^www\./, '');
    } catch {
        return null;
    }
}

// Helper to extract domain from email
function extractDomainFromEmail(email: string): string | null {
    try {
        const trimmed = email.trim().toLowerCase();
        const atIndex = trimmed.lastIndexOf('@');
        if (atIndex === -1 || atIndex === trimmed.length - 1) {
            return null;
        }
        return trimmed.substring(atIndex + 1);
    } catch {
        return null;
    }
}

export default function VerifyOwnershipModal({
    isOpen,
    onClose,
    venue,
    venueName,
    osmEmail,
}: VerifyOwnershipModalProps) {
    const { user } = useNostrAuth();
    const [step, setStep] = useState<VerificationState>("login");
    const [method, setMethod] = useState<VerificationMethod | null>(null);
    const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Check if venue has email and/or website for verification options
    const hasEmail = !!osmEmail;
    const website = venue.tags?.website || venue.tags?.['contact:website'];
    const hasWebsite = !!website;

    // Extract available domains for domain verification
    const availableDomains = useMemo(() => {
        const domains: { domain: string; source: 'website' | 'email' }[] = [];

        if (website) {
            const websiteDomain = extractDomainFromUrl(website);
            if (websiteDomain) {
                domains.push({ domain: websiteDomain, source: 'website' });
            }
        }

        if (osmEmail) {
            const emailDomain = extractDomainFromEmail(osmEmail);
            if (emailDomain && !domains.some(d => d.domain === emailDomain)) {
                domains.push({ domain: emailDomain, source: 'email' });
            }
        }

        return domains;
    }, [website, osmEmail]);

    const hasDomainOptions = availableDomains.length > 0;
    const hasMultipleDomains = availableDomains.length > 1;

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            // If only one method available, skip method selection
            if (user) {
                if (hasEmail && !hasDomainOptions) {
                    setMethod("email");
                    setStep("verifying");
                } else if (!hasEmail && hasDomainOptions && !hasMultipleDomains) {
                    setMethod("domain");
                    setSelectedDomain(availableDomains[0]?.domain || null);
                    setStep("verifying");
                } else if (hasEmail || hasDomainOptions) {
                    setStep("method-select");
                } else {
                    setStep("verifying"); // Will show error in VerificationStep
                }
            } else {
                setStep("login");
            }
            setError(null);
        }
    }, [isOpen, user, hasEmail, hasDomainOptions, hasMultipleDomains, availableDomains]);

    // Update step when user logs in
    useEffect(() => {
        if (user && step === "login") {
            if (hasEmail && !hasDomainOptions) {
                setMethod("email");
                setStep("verifying");
            } else if (!hasEmail && hasDomainOptions && !hasMultipleDomains) {
                setMethod("domain");
                setSelectedDomain(availableDomains[0]?.domain || null);
                setStep("verifying");
            } else if (hasEmail || hasDomainOptions) {
                setStep("method-select");
            } else {
                setStep("verifying");
            }
        }
    }, [user, step, hasEmail, hasDomainOptions, hasMultipleDomains, availableDomains]);

    const handleClose = () => {
        setStep(user ? "method-select" : "login");
        setMethod(null);
        setSelectedDomain(null);
        setError(null);
        onClose();
    };

    const handleSelectMethod = (selectedMethod: VerificationMethod) => {
        setMethod(selectedMethod);
        if (selectedMethod === "domain" && hasMultipleDomains) {
            // Show domain selection step
            setStep("domain-select");
        } else if (selectedMethod === "domain" && availableDomains.length === 1) {
            // Only one domain, use it directly
            setSelectedDomain(availableDomains[0].domain);
            setStep("verifying");
        } else {
            setStep("verifying");
        }
    };

    const handleSelectDomain = (domain: string) => {
        setSelectedDomain(domain);
        setStep("verifying");
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
                    <StepIndicator number={2} label="Verify" active={step === "method-select" || step === "verifying" || step === "code" || step === "domain-pending"} completed={step === "success"} />
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
                                Choose how you want to verify ownership of this venue:
                            </p>

                            <div className="space-y-3">
                                {hasEmail && (
                                    <button
                                        onClick={() => handleSelectMethod("email")}
                                        className="w-full p-4 bg-surface-light hover:bg-surface-light/80 border border-border-light hover:border-accent/50 rounded-lg transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-white font-medium group-hover:text-accent transition-colors">Email Verification</h3>
                                                <p className="text-text-light text-sm">Receive a code at the registered email</p>
                                            </div>
                                        </div>
                                    </button>
                                )}

                                {hasDomainOptions && (
                                    <button
                                        onClick={() => handleSelectMethod("domain")}
                                        className="w-full p-4 bg-surface-light hover:bg-surface-light/80 border border-border-light hover:border-accent/50 rounded-lg transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-white font-medium group-hover:text-blue-400 transition-colors">Domain TXT Record</h3>
                                                <p className="text-text-light text-sm">Add a DNS TXT record to your domain</p>
                                            </div>
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
                            <p className="text-text-light text-sm text-center mb-4">
                                Choose which domain you want to verify:
                            </p>

                            <div className="space-y-3">
                                {availableDomains.map(({ domain, source }) => (
                                    <button
                                        key={domain}
                                        onClick={() => handleSelectDomain(domain)}
                                        className="w-full p-4 bg-surface-light hover:bg-surface-light/80 border border-border-light hover:border-blue-500/50 rounded-lg transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                {source === 'website' ? (
                                                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-white font-medium group-hover:text-blue-400 transition-colors">{domain}</h3>
                                                <p className="text-text-light text-sm">From {source === 'website' ? 'website' : 'email address'}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setStep("method-select")}
                                className="w-full text-center text-sm text-text-light hover:text-white transition-colors"
                            >
                                ← Back to method selection
                            </button>
                        </motion.div>
                    )}

                    {(step === "verifying" || step === "code" || step === "domain-pending" || step === "success" || step === "error") && user && method && (
                        <VerificationStep
                            key="verification"
                            venue={venue}
                            venueName={venueName}
                            osmEmail={osmEmail}
                            method={method}
                            selectedDomain={selectedDomain}
                            step={step}
                            setStep={setStep}
                            onError={setError}
                            onSuccess={handleClose}
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

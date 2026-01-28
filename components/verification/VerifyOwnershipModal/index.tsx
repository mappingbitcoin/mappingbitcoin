"use client";

import { useState, useEffect } from "react";
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

export type VerificationState = "login" | "verifying" | "code" | "success" | "error";

export default function VerifyOwnershipModal({
    isOpen,
    onClose,
    venue,
    venueName,
    osmEmail,
}: VerifyOwnershipModalProps) {
    const { user } = useNostrAuth();
    const [step, setStep] = useState<VerificationState>("login");
    const [error, setError] = useState<string | null>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep(user ? "verifying" : "login");
            setError(null);
        }
    }, [isOpen, user]);

    // Update step when user logs in
    useEffect(() => {
        if (user && step === "login") {
            setStep("verifying");
        }
    }, [user, step]);

    const handleClose = () => {
        setStep(user ? "verifying" : "login");
        setError(null);
        onClose();
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
                    <StepIndicator number={2} label="Verify" active={step === "verifying" || step === "code"} completed={step === "success"} />
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

                    {(step === "verifying" || step === "code" || step === "success" || step === "error") && user && (
                        <VerificationStep
                            key="verification"
                            venue={venue}
                            venueName={venueName}
                            osmEmail={osmEmail}
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

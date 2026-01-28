"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { EnrichedVenue } from "@/models/Overpass";
import { VerificationState } from "./index";

interface VerificationStepProps {
    venue: EnrichedVenue;
    venueName: string;
    osmEmail?: string;
    step: VerificationState;
    setStep: (step: VerificationState) => void;
    onError: (error: string | null) => void;
    onSuccess: () => void;
}

export default function VerificationStep({
    venue,
    venueName,
    step,
    setStep,
    onError,
    onSuccess,
}: VerificationStepProps) {
    const { authenticate, authToken } = useNostrAuth();
    const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
    const [claimId, setClaimId] = useState<string | null>(null);
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [isLoading, setIsLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleInitiateVerification = async () => {
        setIsLoading(true);
        onError(null);

        try {
            // Authenticate first to get a valid token
            let token = authToken;
            if (!token) {
                token = await authenticate();
            }

            // Backend fetches the email from venue cache - we don't send it
            const response = await fetch("/api/verify/initiate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    osmId: `${venue.type}/${venue.id}`,
                    venueName,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to initiate verification");
            }

            setClaimId(data.claimId);
            setMaskedEmail(data.maskedEmail);
            setStep("code");
            setResendCooldown(60);
        } catch (err) {
            onError(err instanceof Error ? err.message : "Failed to send verification code");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCodeChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value.slice(-1);
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            codeInputRefs.current[index + 1]?.focus();
        }
    };

    const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            codeInputRefs.current[index - 1]?.focus();
        }
    };

    const handleCodePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        const newCode = [...code];
        for (let i = 0; i < pastedText.length; i++) {
            newCode[i] = pastedText[i];
        }
        setCode(newCode);
        if (pastedText.length === 6) {
            codeInputRefs.current[5]?.focus();
        }
    };

    const handleVerifyCode = async () => {
        const codeString = code.join("");
        if (codeString.length !== 6) {
            onError("Please enter the complete 6-digit code");
            return;
        }

        if (!claimId) {
            onError("Invalid verification state. Please try again.");
            return;
        }

        setIsLoading(true);
        onError(null);

        try {
            let token = authToken;
            if (!token) {
                token = await authenticate();
            }

            const response = await fetch("/api/verify/confirm", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    claimId,
                    code: codeString,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to verify code");
            }

            setStep("success");
        } catch (err) {
            onError(err instanceof Error ? err.message : "Failed to verify code");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (resendCooldown > 0) return;
        await handleInitiateVerification();
    };

    // Verifying step - confirm to send code
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
                        To verify ownership, we&apos;ll send a verification code to the email address registered with this venue on OpenStreetMap.
                    </p>
                </div>

                <div className="p-4 bg-surface-light rounded-lg">
                    <p className="text-sm text-text-light">
                        The verification code will be sent to the email address stored in the venue&apos;s OpenStreetMap data. Make sure you have access to that email.
                    </p>
                </div>

                <button
                    onClick={handleInitiateVerification}
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-accent hover:bg-accent-dark text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Sending...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Send Verification Code
                        </>
                    )}
                </button>
            </motion.div>
        );
    }

    // Code entry step
    if (step === "code") {
        return (
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
            >
                <div className="text-center">
                    <p className="text-text-light text-sm">
                        We sent a 6-digit code to{" "}
                        <span className="text-white font-medium">{maskedEmail || "your email"}</span>
                    </p>
                </div>

                {/* Code input boxes */}
                <div className="flex justify-center gap-2" onPaste={handleCodePaste}>
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => { codeInputRefs.current[index] = el }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleCodeChange(index, e.target.value)}
                            onKeyDown={(e) => handleCodeKeyDown(index, e)}
                            className="w-12 h-14 text-center text-2xl font-bold bg-primary-light border border-border-light rounded-lg text-white focus:outline-none focus:border-accent"
                        />
                    ))}
                </div>

                <button
                    onClick={handleVerifyCode}
                    disabled={isLoading || code.join("").length !== 6}
                    className="w-full py-3 px-4 bg-accent hover:bg-accent-dark text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Verifying...
                        </>
                    ) : (
                        "Verify Code"
                    )}
                </button>

                <div className="text-center">
                    <button
                        onClick={handleResendCode}
                        disabled={resendCooldown > 0}
                        className="text-sm text-accent hover:text-accent-dark disabled:text-text-light disabled:cursor-not-allowed transition-colors"
                    >
                        {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                    </button>
                </div>
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
                        Your venue now displays a &quot;Verified Owner&quot; badge. This verification is linked to your Nostr identity and the email on record.
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

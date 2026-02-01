"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { EnrichedVenue } from "@/models/Overpass";
import { VerificationState, VerificationMethod } from "./index";
import {
    ChevronLeftIcon,
    CopyIcon,
    ClockIcon,
    RefreshIcon,
    CheckmarkIcon,
} from "@/assets/icons/ui";
import { EmailIcon, WebsiteIcon } from "@/assets/icons/contact";
import Button, { IconButton } from "@/components/ui/Button";

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
    onBack?: () => void;
}

export default function VerificationStep({
    venue,
    venueName,
    osmEmail,
    method,
    selectedDomain,
    step,
    setStep,
    onError,
    onSuccess,
    onBack,
}: VerificationStepProps) {
    const { authenticate, authToken } = useNostrAuth();
    const [claimId, setClaimId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Domain verification state
    const [domain, setDomain] = useState<string | null>(null);
    const [txtRecordValue, setTxtRecordValue] = useState<string | null>(null);
    const [checkCooldown, setCheckCooldown] = useState(0);

    // Email verification state
    const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
    const [verificationCode, setVerificationCode] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);

    // Check cooldown timer
    useEffect(() => {
        if (checkCooldown > 0) {
            const timer = setTimeout(() => setCheckCooldown(checkCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [checkCooldown]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // ==================== DOMAIN VERIFICATION ====================

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

    // ==================== EMAIL VERIFICATION ====================

    const handleInitiateEmailVerification = async () => {
        setIsLoading(true);
        onError(null);

        try {
            let token = authToken;
            if (!token) {
                token = await authenticate();
            }

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
                throw new Error(data.error || "Failed to send verification code");
            }

            setClaimId(data.claimId);
            setMaskedEmail(data.maskedEmail);
            setResendCooldown(60); // 60 second cooldown before resend
            setStep("email-pending");
        } catch (err) {
            onError(err instanceof Error ? err.message : "Failed to send verification code");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyEmailCode = async () => {
        if (!claimId || !verificationCode.trim()) return;

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
                    code: verificationCode.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Invalid verification code");
            }

            if (data.success) {
                setStep("success");
            } else {
                onError(data.error || "Verification failed");
            }
        } catch (err) {
            onError(err instanceof Error ? err.message : "Failed to verify code");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (resendCooldown > 0) return;
        await handleInitiateEmailVerification();
    };

    // ==================== HELPERS ====================

    const [copied, setCopied] = useState(false);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            // Fallback for older browsers or non-secure contexts
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand("copy");
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch {
                console.error("Failed to copy text");
            }
            document.body.removeChild(textArea);
        }
    };

    // ==================== RENDER ====================

    // Email: Verifying step - initiate email verification
    if (method === "email" && step === "verifying") {
        return (
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
            >
                {onBack && (
                    <button
                        onClick={onBack}
                        className="text-sm text-text-light hover:text-white flex items-center gap-1 transition-colors"
                    >
                        <ChevronLeftIcon className="w-4 h-4" />
                        Back to methods
                    </button>
                )}

                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-300">
                        We&apos;ll send a 6-digit verification code to the email address registered for this venue in OpenStreetMap.
                    </p>
                </div>

                {osmEmail && (
                    <div className="p-4 bg-surface-light rounded-lg">
                        <p className="text-sm text-text-light mb-1">
                            <strong className="text-white">Registered email:</strong>
                        </p>
                        <p className="text-accent font-mono">{osmEmail}</p>
                    </div>
                )}

                <Button
                    onClick={handleInitiateEmailVerification}
                    disabled={isLoading}
                    loading={isLoading}
                    fullWidth
                    leftIcon={!isLoading ? <EmailIcon className="w-5 h-5" /> : undefined}
                >
                    {isLoading ? "Sending..." : "Send Verification Code"}
                </Button>
            </motion.div>
        );
    }

    // Email: Pending step - enter code
    if (method === "email" && step === "email-pending") {
        return (
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
            >
                <div className="text-center">
                    <p className="text-text-light text-sm">
                        Enter the 6-digit code sent to <span className="text-white font-medium">{maskedEmail}</span>
                    </p>
                </div>

                <div className="space-y-3">
                    <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        className="w-full p-4 bg-surface-light border border-border-light rounded-lg text-white text-center text-2xl font-mono tracking-widest placeholder-text-light/50 focus:outline-none focus:border-accent"
                    />

                    <Button
                        onClick={handleVerifyEmailCode}
                        disabled={isLoading || verificationCode.length !== 6}
                        loading={isLoading}
                        fullWidth
                    >
                        {isLoading ? "Verifying..." : "Verify Code"}
                    </Button>
                </div>

                <div className="text-center">
                    <Button
                        onClick={handleResendCode}
                        disabled={resendCooldown > 0 || isLoading}
                        variant="ghost"
                        color="accent"
                        size="sm"
                    >
                        {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                    </Button>
                </div>

                <p className="text-xs text-text-light text-center">
                    The code expires in 15 minutes. Check your spam folder if you don&apos;t see it.
                </p>
            </motion.div>
        );
    }

    // Domain: Verifying step - initiate domain verification
    if (method === "domain" && step === "verifying") {
        return (
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
            >
                {onBack && (
                    <button
                        onClick={onBack}
                        className="text-sm text-text-light hover:text-white flex items-center gap-1 transition-colors"
                    >
                        <ChevronLeftIcon className="w-4 h-4" />
                        Back to methods
                    </button>
                )}

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

                <Button
                    onClick={handleInitiateDomainVerification}
                    disabled={isLoading}
                    loading={isLoading}
                    fullWidth
                    leftIcon={!isLoading ? <WebsiteIcon className="w-5 h-5" /> : undefined}
                >
                    {isLoading ? "Generating..." : "Generate TXT Record"}
                </Button>
            </motion.div>
        );
    }

    // Domain: Pending step - show TXT record and check button
    if (method === "domain" && step === "domain-pending") {
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
                            className={`text-xs transition-colors flex items-center gap-1 ${
                                copied ? "text-green-400" : "text-accent hover:text-accent-dark"
                            }`}
                        >
                            {copied ? (
                                <>
                                    <CheckmarkIcon className="w-3 h-3" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <CopyIcon className="w-3 h-3" />
                                    Copy
                                </>
                            )}
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

                <Button
                    onClick={handleCheckDomain}
                    disabled={isLoading || checkCooldown > 0}
                    loading={isLoading}
                    fullWidth
                    leftIcon={checkCooldown > 0 ? <ClockIcon className="w-5 h-5" /> : <RefreshIcon className="w-5 h-5" />}
                >
                    {isLoading
                        ? "Checking..."
                        : checkCooldown > 0
                            ? `Wait ${checkCooldown}s`
                            : "Check TXT Record"
                    }
                </Button>

                <p className="text-xs text-text-light text-center">
                    You can also check later from the &quot;My Verifications&quot; page in your profile menu.
                </p>
            </motion.div>
        );
    }

    // Success step (shared)
    if (step === "success") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center space-y-4"
            >
                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckmarkIcon className="w-8 h-8 text-green-400" />
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

                <Button onClick={onSuccess} fullWidth>
                    Done
                </Button>
            </motion.div>
        );
    }

    return null;
}

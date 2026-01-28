"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useNostrAuth } from "@/contexts/NostrAuthContext";

interface LoginStepProps {
    onError: (error: string | null) => void;
}

type LoginMethod = "extension" | "nsec" | "bunker";

export default function LoginStep({ onError }: LoginStepProps) {
    const { loginWithKey, loginWithExtension, loginWithBunker, isLoading } = useNostrAuth();
    const [selectedMethod, setSelectedMethod] = useState<LoginMethod | null>(null);
    const [keyInput, setKeyInput] = useState("");
    const [bunkerUrl, setBunkerUrl] = useState("");

    const handleExtensionLogin = async () => {
        try {
            onError(null);
            setSelectedMethod("extension");
            await loginWithExtension();
        } catch (err) {
            onError(err instanceof Error ? err.message : "Failed to login with extension");
        }
    };

    const handleKeyLogin = async () => {
        if (!keyInput.trim()) {
            onError("Please enter your nsec or npub key");
            return;
        }
        try {
            onError(null);
            await loginWithKey(keyInput.trim());
        } catch (err) {
            onError(err instanceof Error ? err.message : "Failed to login with key");
        }
    };

    const handleBunkerLogin = async () => {
        if (!bunkerUrl.trim()) {
            onError("Please enter your bunker URL");
            return;
        }
        try {
            onError(null);
            await loginWithBunker(bunkerUrl.trim());
        } catch (err) {
            onError(err instanceof Error ? err.message : "Failed to login with bunker");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
        >
            <p className="text-text-light text-sm">
                To verify ownership, you need to sign in with your Nostr identity. Choose your preferred method:
            </p>

            {/* Extension Login */}
            <button
                onClick={handleExtensionLogin}
                disabled={isLoading}
                className="w-full p-4 bg-surface-light hover:bg-primary-light border border-border-light rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <div className="font-medium text-white">Browser Extension</div>
                        <div className="text-xs text-text-light">Alby, nos2x, or other NIP-07 extension</div>
                    </div>
                    {selectedMethod === "extension" && isLoading && (
                        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    )}
                </div>
            </button>

            {/* Nsec/Npub Login */}
            <div className="space-y-2">
                <button
                    onClick={() => setSelectedMethod(selectedMethod === "nsec" ? null : "nsec")}
                    className="w-full p-4 bg-surface-light hover:bg-primary-light border border-border-light rounded-lg text-left transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <div className="font-medium text-white">Nsec / Npub Key</div>
                            <div className="text-xs text-text-light">Enter your private (nsec) or public (npub) key</div>
                        </div>
                        <svg className={`w-5 h-5 text-text-light transition-transform ${selectedMethod === "nsec" ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </button>

                {selectedMethod === "nsec" && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-4 space-y-2"
                    >
                        <input
                            type="password"
                            value={keyInput}
                            onChange={(e) => setKeyInput(e.target.value)}
                            placeholder="nsec1... or npub1..."
                            className="w-full p-3 bg-primary-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-accent"
                        />
                        <p className="text-xs text-text-light">
                            Note: nsec gives write access, npub is read-only (cannot verify ownership)
                        </p>
                        <button
                            onClick={handleKeyLogin}
                            disabled={isLoading || !keyInput.trim()}
                            className="w-full py-2 px-4 bg-accent hover:bg-accent-dark text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Connecting..." : "Continue"}
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Bunker Login */}
            <div className="space-y-2">
                <button
                    onClick={() => setSelectedMethod(selectedMethod === "bunker" ? null : "bunker")}
                    className="w-full p-4 bg-surface-light hover:bg-primary-light border border-border-light rounded-lg text-left transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <div className="font-medium text-white">Remote Signer (NIP-46)</div>
                            <div className="text-xs text-text-light">Connect via bunker URL</div>
                        </div>
                        <svg className={`w-5 h-5 text-text-light transition-transform ${selectedMethod === "bunker" ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </button>

                {selectedMethod === "bunker" && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-4 space-y-2"
                    >
                        <input
                            type="text"
                            value={bunkerUrl}
                            onChange={(e) => setBunkerUrl(e.target.value)}
                            placeholder="bunker://..."
                            className="w-full p-3 bg-primary-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-accent"
                        />
                        <button
                            onClick={handleBunkerLogin}
                            disabled={isLoading || !bunkerUrl.trim()}
                            className="w-full py-2 px-4 bg-accent hover:bg-accent-dark text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Connecting..." : "Connect"}
                        </button>
                    </motion.div>
                )}
            </div>

            <p className="text-xs text-text-light text-center pt-2">
                Your Nostr identity will be linked to your verified venue ownership.
            </p>
        </motion.div>
    );
}

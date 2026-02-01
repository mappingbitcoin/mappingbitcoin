"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { QRCodeSVG } from "qrcode.react";
import {
    LockIcon,
    KeyIcon,
    ChevronRightIcon,
    ChevronLeftIcon,
    BunkerIcon,
    QRCodeIcon,
    LinkIcon,
    UserAddIcon,
    ExternalLinkIcon,
} from "@/assets/icons/ui";
import Button, { IconButton } from "@/components/ui/Button";

export interface LoginStepProps {
    /** Callback to report errors to parent */
    onError: (error: string | null) => void;
    /** Whether to show the "Create Account" option (default: true) */
    showCreateAccount?: boolean;
    /** Translation key for description (e.g., "default" or "verification") */
    descriptionKey?: string;
}

type LoginMethod = "extension" | "nsec" | "bunker";
type BunkerMode = "select" | "url" | "qr";

export default function LoginStep({
    onError,
    showCreateAccount = true,
    descriptionKey = "default"
}: LoginStepProps) {
    const t = useTranslations("login");
    const { loginWithKey, loginWithExtension, loginWithBunker, isLoading } = useNostrAuth();
    const [selectedMethod, setSelectedMethod] = useState<LoginMethod | null>(null);
    const [keyInput, setKeyInput] = useState("");
    const [bunkerUrl, setBunkerUrl] = useState("");
    const [hasExtension, setHasExtension] = useState(false);
    const [bunkerMode, setBunkerMode] = useState<BunkerMode>("select");
    const [nostrConnectUrl, setNostrConnectUrl] = useState<string>("");
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);

    // Check if NIP-07 extension is available and generate nostrconnect URL
    useEffect(() => {
        const checkExtension = () => {
            setHasExtension(typeof window !== "undefined" && !!window.nostr);
        };
        checkExtension();
        // Re-check after a short delay in case extension loads late
        const timeout = setTimeout(checkExtension, 500);

        // Generate nostrconnect URL for QR code
        if (typeof window !== "undefined") {
            const secret = Array.from(crypto.getRandomValues(new Uint8Array(16)))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            const relay = encodeURIComponent("wss://relay.nsec.app");
            setNostrConnectUrl(`nostrconnect://?relay=${relay}&secret=${secret}&name=${encodeURIComponent("Mapping Bitcoin")}&url=${encodeURIComponent(window.location.origin)}`);
        }

        return () => clearTimeout(timeout);
    }, []);

    const handleBack = () => {
        setSelectedMethod(null);
        setBunkerMode("select");
        setKeyInput("");
        setBunkerUrl("");
        onError(null);
    };

    // Handle credentials returned from nstart via URL hash
    const handleNstartCredential = (credential: string) => {
        // Clear the hash immediately for security
        window.history.replaceState(null, "", window.location.pathname + window.location.search);

        // Handle the returned credential
        if (credential.startsWith("bunker://")) {
            setBunkerUrl(credential);
            setSelectedMethod("bunker");
            setBunkerMode("url");
            // Auto-login with the bunker URL
            loginWithBunker(credential).catch(err => {
                onError(err instanceof Error ? err.message : t("errors.bunkerFailed"));
                setIsCreatingAccount(false);
            });
        } else if (credential.startsWith("nsec1")) {
            setKeyInput(credential);
            setSelectedMethod("nsec");
            // Auto-login with the nsec
            loginWithKey(credential).catch(err => {
                onError(err instanceof Error ? err.message : t("errors.keyFailed"));
                setIsCreatingAccount(false);
            });
        } else {
            setIsCreatingAccount(false);
        }
    };

    // Listen for hashchange events (nstart redirect)
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash.startsWith("#nostr-login=")) {
                const credential = decodeURIComponent(hash.replace("#nostr-login=", ""));
                handleNstartCredential(credential);
            }
        };

        // Check on mount in case we already have credentials in hash
        handleHashChange();

        window.addEventListener("hashchange", handleHashChange);
        return () => window.removeEventListener("hashchange", handleHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCreateAccount = () => {
        setIsCreatingAccount(true);
        onError(null);

        // Build nstart URL with proper parameters for popup integration
        const params = new URLSearchParams({
            an: "Mapping Bitcoin",  // App name
            at: "popup",            // App type - popup mode
            ac: window.location.href.split("#")[0],  // Return URL (current page without hash)
            afb: "1",               // Force bunker (recommended for web apps)
        });

        const nstartUrl = `https://nstart.me?${params.toString()}`;

        // Open nstart in a popup window
        const popup = window.open(
            nstartUrl,
            "nstart",
            "width=450,height=700,scrollbars=yes,resizable=yes"
        );

        if (!popup) {
            onError(t("createAccount.popupBlocked"));
            setIsCreatingAccount(false);
            return;
        }

        // Poll for popup close
        const checkPopup = setInterval(() => {
            try {
                if (popup.closed) {
                    clearInterval(checkPopup);

                    // Give a moment for hashchange to fire
                    setTimeout(() => {
                        // Check hash one more time
                        const hash = window.location.hash;
                        if (hash.startsWith("#nostr-login=")) {
                            const credential = decodeURIComponent(hash.replace("#nostr-login=", ""));
                            handleNstartCredential(credential);
                        } else {
                            // Popup closed without credentials
                            setIsCreatingAccount(false);
                        }
                    }, 100);
                }
            } catch {
                // Cross-origin errors are expected, just continue polling
            }
        }, 500);

        // Stop checking after 10 minutes
        setTimeout(() => {
            clearInterval(checkPopup);
            setIsCreatingAccount(false);
        }, 600000);
    };

    const handleExtensionLogin = async () => {
        try {
            onError(null);
            setSelectedMethod("extension");
            await loginWithExtension();
        } catch (err) {
            onError(err instanceof Error ? err.message : t("errors.extensionFailed"));
        }
    };

    const handleKeyLogin = async () => {
        if (!keyInput.trim()) {
            onError(t("errors.enterKey"));
            return;
        }
        try {
            onError(null);
            await loginWithKey(keyInput.trim());
        } catch (err) {
            onError(err instanceof Error ? err.message : t("errors.keyFailed"));
        }
    };

    const handleBunkerLogin = async () => {
        if (!bunkerUrl.trim()) {
            onError(t("errors.enterBunkerUrl"));
            return;
        }
        try {
            onError(null);
            await loginWithBunker(bunkerUrl.trim());
        } catch (err) {
            onError(err instanceof Error ? err.message : t("errors.bunkerFailed"));
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
                {t(`description.${descriptionKey}`)}
            </p>

            {/* Extension Login - only show when no method selected */}
            {!selectedMethod && (
                <button
                    onClick={handleExtensionLogin}
                    disabled={isLoading || !hasExtension}
                    className={`w-full p-4 bg-surface-light border border-border-light rounded-lg text-left transition-colors ${
                        hasExtension
                            ? "hover:bg-primary-light"
                            : "opacity-50 cursor-not-allowed"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${hasExtension ? "bg-purple-500/20" : "bg-gray-500/20"}`}>
                            <LockIcon className={`w-5 h-5 ${hasExtension ? "text-purple-400" : "text-gray-500"}`} />
                        </div>
                        <div className="flex-1">
                            <div className={`font-medium ${hasExtension ? "text-white" : "text-gray-500"}`}>
                                {t("methods.extension.title")}
                            </div>
                            <div className="text-xs text-text-light">
                                {hasExtension
                                    ? t("methods.extension.description")
                                    : t("methods.extension.notFound")}
                            </div>
                        </div>
                        {selectedMethod === "extension" && isLoading && (
                            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        )}
                    </div>
                </button>
            )}

            {/* Nsec/Npub Login */}
            <AnimatePresence mode="wait">
                {!selectedMethod && (
                    <motion.button
                        key="nsec-button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedMethod("nsec")}
                        className="w-full p-4 bg-surface-light hover:bg-primary-light border border-border-light rounded-lg text-left transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                                <KeyIcon className="w-5 h-5 text-orange-400" />
                            </div>
                            <div className="flex-1">
                                <div className="font-medium text-white">{t("methods.key.title")}</div>
                                <div className="text-xs text-text-light">{t("methods.key.description")}</div>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-text-light" />
                        </div>
                    </motion.button>
                )}
                {selectedMethod === "nsec" && (
                    <motion.div
                        key="nsec-form"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-4 bg-surface-light border border-border-light rounded-lg space-y-3"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <IconButton
                                onClick={handleBack}
                                icon={<ChevronLeftIcon />}
                                aria-label="Go back"
                                variant="ghost"
                                color="neutral"
                                size="sm"
                            />
                            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                                <KeyIcon className="w-4 h-4 text-orange-400" />
                            </div>
                            <span className="font-medium text-white">{t("methods.key.title")}</span>
                        </div>
                        <input
                            type="password"
                            value={keyInput}
                            onChange={(e) => setKeyInput(e.target.value)}
                            placeholder={t("keyInput.placeholder")}
                            className="w-full p-3 bg-primary-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-accent"
                        />
                        <p className="text-xs text-text-light">
                            {t("methods.key.hint")}
                        </p>
                        <Button
                            onClick={handleKeyLogin}
                            disabled={isLoading || !keyInput.trim()}
                            loading={isLoading}
                            fullWidth
                        >
                            {isLoading ? t("actions.connecting") : t("actions.continue")}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bunker Login */}
            <AnimatePresence mode="wait">
                {!selectedMethod && (
                    <motion.button
                        key="bunker-button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedMethod("bunker")}
                        className="w-full p-4 bg-surface-light hover:bg-primary-light border border-border-light rounded-lg text-left transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <BunkerIcon className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <div className="font-medium text-white">{t("methods.bunker.title")}</div>
                                <div className="text-xs text-text-light">{t("methods.bunker.description")}</div>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-text-light" />
                        </div>
                    </motion.button>
                )}
                {selectedMethod === "bunker" && (
                    <motion.div
                        key="bunker-form"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-4 bg-surface-light border border-border-light rounded-lg space-y-3"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <IconButton
                                onClick={handleBack}
                                icon={<ChevronLeftIcon />}
                                aria-label="Go back"
                                variant="ghost"
                                color="neutral"
                                size="sm"
                            />
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <BunkerIcon className="w-4 h-4 text-blue-400" />
                            </div>
                            <span className="font-medium text-white">{t("methods.bunker.title")}</span>
                        </div>

                        {/* Bunker mode selector */}
                        {bunkerMode === "select" && (
                            <div className="space-y-2">
                                <button
                                    onClick={() => setBunkerMode("qr")}
                                    className="w-full p-3 bg-primary-light hover:bg-primary border border-border-light rounded-lg text-left transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <QRCodeIcon className="w-5 h-5 text-blue-400" />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-white">{t("methods.bunker.scanQR")}</div>
                                            <div className="text-xs text-text-light">{t("methods.bunker.scanDescription")}</div>
                                        </div>
                                        <ChevronRightIcon className="w-4 h-4 text-text-light" />
                                    </div>
                                </button>
                                <button
                                    onClick={() => setBunkerMode("url")}
                                    className="w-full p-3 bg-primary-light hover:bg-primary border border-border-light rounded-lg text-left transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <LinkIcon className="w-5 h-5 text-blue-400" />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-white">{t("methods.bunker.pasteURL")}</div>
                                            <div className="text-xs text-text-light">{t("methods.bunker.pasteDescription")}</div>
                                        </div>
                                        <ChevronRightIcon className="w-4 h-4 text-text-light" />
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* QR Code view */}
                        {bunkerMode === "qr" && (
                            <div className="space-y-3">
                                <button
                                    onClick={() => setBunkerMode("select")}
                                    className="text-xs text-text-light hover:text-white flex items-center gap-1 transition-colors"
                                >
                                    <ChevronLeftIcon className="w-3 h-3" />
                                    {t("methods.bunker.backToOptions")}
                                </button>
                                <div className="flex justify-center p-4 bg-white rounded-lg">
                                    <QRCodeSVG
                                        value={nostrConnectUrl}
                                        size={180}
                                        level="M"
                                        includeMargin={false}
                                    />
                                </div>
                                <p className="text-xs text-text-light text-center">
                                    {t("methods.bunker.scanInstructions")}
                                </p>
                                <div className="text-xs text-center">
                                    <button
                                        onClick={() => setBunkerMode("url")}
                                        className="text-accent hover:text-accent-dark transition-colors"
                                    >
                                        {t("methods.bunker.orManual")}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* URL input view */}
                        {bunkerMode === "url" && (
                            <div className="space-y-3">
                                <button
                                    onClick={() => setBunkerMode("select")}
                                    className="text-xs text-text-light hover:text-white flex items-center gap-1 transition-colors"
                                >
                                    <ChevronLeftIcon className="w-3 h-3" />
                                    {t("methods.bunker.backToOptions")}
                                </button>
                                <input
                                    type="text"
                                    value={bunkerUrl}
                                    onChange={(e) => setBunkerUrl(e.target.value)}
                                    placeholder={t("bunkerInput.placeholder")}
                                    className="w-full p-3 bg-primary-light border border-border-light rounded-lg text-white placeholder-text-light focus:outline-none focus:border-accent"
                                />
                                <Button
                                    onClick={handleBunkerLogin}
                                    disabled={isLoading || !bunkerUrl.trim()}
                                    loading={isLoading}
                                    fullWidth
                                >
                                    {isLoading ? t("actions.connecting") : t("actions.connect")}
                                </Button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Account option - only show when enabled and no method selected */}
            {showCreateAccount && !selectedMethod && (
                <div className="pt-4 border-t border-border-light">
                    {isCreatingAccount ? (
                        <div className="text-center py-4">
                            <div className="w-10 h-10 mx-auto mb-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm text-white font-medium">{t("createAccount.creating")}</p>
                            <p className="text-xs text-text-light mt-1">
                                {t("createAccount.completeSetup")}
                            </p>
                            <button
                                onClick={() => setIsCreatingAccount(false)}
                                className="mt-3 text-xs text-text-light hover:text-white transition-colors"
                            >
                                {t("createAccount.cancel")}
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-text-light text-center mb-3">
                                {t("createAccount.question")}
                            </p>
                            <button
                                onClick={handleCreateAccount}
                                className="w-full p-4 bg-gradient-to-r from-purple-500/10 to-accent/10 hover:from-purple-500/20 hover:to-accent/20 border border-purple-500/30 rounded-lg text-left transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/30 to-accent/30 flex items-center justify-center">
                                        <UserAddIcon className="w-5 h-5 text-purple-300" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-white">{t("createAccount.title")}</div>
                                        <div className="text-xs text-text-light">{t("createAccount.description")}</div>
                                    </div>
                                    <ExternalLinkIcon className="w-4 h-4 text-text-light" />
                                </div>
                            </button>
                            <p className="text-xs text-text-light text-center mt-2">
                                {t("createAccount.popupNote")}
                            </p>
                        </>
                    )}
                </div>
            )}
        </motion.div>
    );
}

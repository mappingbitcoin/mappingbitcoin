"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { PageSection } from "@/components/layout";
import { motion, AnimatePresence } from "framer-motion";
import { useNostrAuth, useNpub } from "@/contexts/NostrAuthContext";
import { QRCodeSVG } from "qrcode.react";
import {
    createNostrConnectSession,
    generateNostrConnectURI,
    startNostrConnect,
    type NostrConnectSession,
} from "@/lib/nostr/connect";

const ExtensionIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
    </svg>
);

const BunkerIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
    </svg>
);

const CreateIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
    </svg>
);

const CheckIcon = () => (
    <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const SpinnerIcon = () => (
    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
);

type ConnectTab = "qr" | "manual";

const Login: React.FC = () => {
    const t = useTranslations("login");
    const router = useRouter();
    const { user, isLoading, error, loginWithKey, loginWithExtension, loginWithBunker, clearError } = useNostrAuth();
    const npub = useNpub(user?.pubkey);

    const [keyInput, setKeyInput] = useState("");
    const [bunkerInput, setBunkerInput] = useState("");
    const [showBunkerModal, setShowBunkerModal] = useState(false);
    const [hasExtension, setHasExtension] = useState(false);
    const [connectTab, setConnectTab] = useState<ConnectTab>("qr");

    // Nostr Connect state
    const [connectSession, setConnectSession] = useState<NostrConnectSession | null>(null);
    const [connectURI, setConnectURI] = useState<string>("");
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectError, setConnectError] = useState<string | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);

    // Check for browser extension
    useEffect(() => {
        const checkExtension = () => {
            setHasExtension(typeof window !== "undefined" && !!window.nostr);
        };
        checkExtension();
        const timeout = setTimeout(checkExtension, 1000);
        return () => clearTimeout(timeout);
    }, []);

    // Handle nstart callback
    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleHashChange = () => {
            const hash = window.location.hash;
            if (hash.startsWith("#nostr-login=")) {
                const credential = decodeURIComponent(hash.replace("#nostr-login=", ""));
                const urlWithoutHash = window.location.href.split("#")[0];
                history.replaceState(null, "", urlWithoutHash);

                if (credential.startsWith("bunker://")) {
                    loginWithBunker(credential);
                } else if (credential.startsWith("nsec") || credential.startsWith("ncryptsec")) {
                    loginWithKey(credential);
                }
            }
        };

        handleHashChange();
        window.addEventListener("hashchange", handleHashChange);
        return () => window.removeEventListener("hashchange", handleHashChange);
    }, [loginWithBunker, loginWithKey]);

    // Redirect if already logged in
    useEffect(() => {
        if (user && !isLoading) {
            router.push("/");
        }
    }, [user, isLoading, router]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (cleanupRef.current) {
                cleanupRef.current();
            }
        };
    }, []);

    const handleKeySubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (keyInput.trim()) {
            await loginWithKey(keyInput);
        }
    }, [keyInput, loginWithKey]);

    const handleBunkerSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (bunkerInput.trim()) {
            await loginWithBunker(bunkerInput);
            setShowBunkerModal(false);
        }
    }, [bunkerInput, loginWithBunker]);

    const handleExtensionLogin = useCallback(async () => {
        await loginWithExtension();
    }, [loginWithExtension]);

    const openNstart = useCallback(() => {
        const params = new URLSearchParams({
            an: "MappingBitcoin",
            at: "web",
            ac: window.location.origin + "/login",
            am: "dark",
            aa: "f7931a",
        });
        window.location.href = `https://nstart.me?${params.toString()}`;
    }, []);

    const startQRConnect = useCallback(() => {
        // Clean up any existing session
        if (cleanupRef.current) {
            cleanupRef.current();
        }

        setConnectError(null);
        setIsConnecting(true);

        // Create new session
        const session = createNostrConnectSession();
        const uri = generateNostrConnectURI(session, "MappingBitcoin");

        setConnectSession(session);
        setConnectURI(uri);

        // Start listening for connection
        cleanupRef.current = startNostrConnect(session, {
            onConnected: (remotePubkey) => {
                setIsConnecting(false);
                loginWithBunker(`bunker://${remotePubkey}?relay=${encodeURIComponent(session.relay)}`);
                setShowBunkerModal(false);
            },
            onError: (err) => {
                setIsConnecting(false);
                setConnectError(err);
            },
            onTimeout: () => {
                setIsConnecting(false);
                setConnectError(t("bunker.timeout"));
            },
        });
    }, [loginWithBunker, t]);

    const openBunkerModal = useCallback(() => {
        setShowBunkerModal(true);
        setConnectTab("qr");
        startQRConnect();
    }, [startQRConnect]);

    const closeBunkerModal = useCallback(() => {
        if (cleanupRef.current) {
            cleanupRef.current();
            cleanupRef.current = null;
        }
        setShowBunkerModal(false);
        setConnectSession(null);
        setConnectURI("");
        setIsConnecting(false);
        setConnectError(null);
    }, []);

    const isKeyValid = () => {
        const trimmed = keyInput.trim();
        return (
            trimmed.startsWith("nsec1") ||
            trimmed.startsWith("npub1") ||
            /^[0-9a-fA-F]{64}$/.test(trimmed)
        );
    };

    if (user) {
        return (
            <PageSection background="dark">
                <div className="max-w-md mx-auto text-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                        <CheckIcon />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">{t("loggedIn.title")}</h2>
                    <p className="text-text-light mb-4">
                        {npub ? `${npub.slice(0, 12)}...${npub.slice(-8)}` : user.pubkey.slice(0, 16) + "..."}
                    </p>
                    <p className="text-sm text-text-light">
                        {t("loggedIn.redirecting")}
                    </p>
                </div>
            </PageSection>
        );
    }

    return (
        <PageSection background="dark">
            <div className="max-w-xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold mb-3 text-white">{t("heading")}</h1>
                    <p className="text-base text-text-light">{t("subheading")}</p>
                </div>

                {/* Error message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-red-500/10 text-red-400 text-sm p-4 rounded-xl border border-red-500/20 mb-6 flex items-start gap-3"
                        >
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                            <div className="flex-1">
                                <p>{error}</p>
                            </div>
                            <button onClick={clearError} className="text-red-400 hover:text-red-300">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Login Input */}
                <form onSubmit={handleKeySubmit} className="mb-6">
                    <div className="flex gap-3">
                        <input
                            type="password"
                            value={keyInput}
                            onChange={(e) => setKeyInput(e.target.value)}
                            placeholder={t("keyInput.placeholder")}
                            className="flex-1 py-3.5 px-4 text-base bg-surface text-white border border-border-light rounded-xl transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 placeholder:text-text-light font-mono text-sm"
                            autoComplete="off"
                            spellCheck={false}
                        />
                        <motion.button
                            type="submit"
                            disabled={isLoading || !isKeyValid()}
                            className="px-6 py-3.5 text-sm font-semibold text-white bg-accent border border-accent rounded-xl hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isLoading ? t("actions.loggingIn") : t("actions.loginWithKey")}
                        </motion.button>
                    </div>
                    <p className="text-xs text-text-light mt-2">
                        {t("keyInput.hint")}
                    </p>
                </form>

                {/* Divider */}
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border-light"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-primary text-text-light">{t("divider")}</span>
                    </div>
                </div>

                {/* Alternative Login Methods - Side by Side */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {/* Extension Login */}
                    <motion.button
                        onClick={handleExtensionLogin}
                        disabled={isLoading || !hasExtension}
                        className="flex flex-col items-center justify-center gap-3 p-6 bg-surface border border-border-light rounded-xl transition-all hover:border-accent/50 hover:bg-surface-light disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: hasExtension ? 1.02 : 1 }}
                        whileTap={{ scale: hasExtension ? 0.98 : 1 }}
                    >
                        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                            <ExtensionIcon />
                        </div>
                        <div className="text-center">
                            <h3 className="text-sm font-semibold text-white mb-1">{t("methods.extension.title")}</h3>
                            <p className="text-xs text-text-light">
                                {hasExtension ? t("methods.extension.description") : t("methods.extension.notFound")}
                            </p>
                        </div>
                    </motion.button>

                    {/* Remote Signer / Nostr Connect */}
                    <motion.button
                        onClick={openBunkerModal}
                        disabled={isLoading}
                        className="flex flex-col items-center justify-center gap-3 p-6 bg-surface border border-border-light rounded-xl transition-all hover:border-accent/50 hover:bg-surface-light disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                            <BunkerIcon />
                        </div>
                        <div className="text-center">
                            <h3 className="text-sm font-semibold text-white mb-1">{t("methods.bunker.title")}</h3>
                            <p className="text-xs text-text-light">{t("methods.bunker.description")}</p>
                        </div>
                    </motion.button>
                </div>

                {/* Bunker / Nostr Connect Modal */}
                <AnimatePresence>
                    {showBunkerModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={closeBunkerModal}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-surface rounded-2xl border border-border-light max-w-md w-full overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Modal Header */}
                                <div className="flex items-center justify-between p-4 border-b border-border-light">
                                    <h3 className="text-lg font-semibold text-white">{t("methods.bunker.title")}</h3>
                                    <button
                                        onClick={closeBunkerModal}
                                        className="text-text-light hover:text-white transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Tabs */}
                                <div className="flex border-b border-border-light">
                                    <button
                                        onClick={() => {
                                            setConnectTab("qr");
                                            if (!connectSession) startQRConnect();
                                        }}
                                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                                            connectTab === "qr"
                                                ? "text-accent border-b-2 border-accent"
                                                : "text-text-light hover:text-white"
                                        }`}
                                    >
                                        {t("bunker.scanQR")}
                                    </button>
                                    <button
                                        onClick={() => setConnectTab("manual")}
                                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                                            connectTab === "manual"
                                                ? "text-accent border-b-2 border-accent"
                                                : "text-text-light hover:text-white"
                                        }`}
                                    >
                                        {t("bunker.pasteURL")}
                                    </button>
                                </div>

                                {/* Tab Content */}
                                <div className="p-6">
                                    {connectTab === "qr" ? (
                                        <div className="flex flex-col items-center">
                                            {connectError ? (
                                                <div className="text-center">
                                                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                                                        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-red-400 mb-4">{connectError}</p>
                                                    <button
                                                        onClick={startQRConnect}
                                                        className="px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent-dark transition-colors"
                                                    >
                                                        {t("bunker.tryAgain")}
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-sm text-text-light text-center mb-4">
                                                        {t("bunker.scanInstructions")}
                                                    </p>

                                                    <div className="bg-white p-4 rounded-xl mb-4">
                                                        {connectURI ? (
                                                            <QRCodeSVG
                                                                value={connectURI}
                                                                size={200}
                                                                level="M"
                                                                includeMargin={false}
                                                            />
                                                        ) : (
                                                            <div className="w-[200px] h-[200px] flex items-center justify-center">
                                                                <SpinnerIcon />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {isConnecting && (
                                                        <div className="flex items-center gap-2 text-sm text-text-light">
                                                            <SpinnerIcon />
                                                            <span>{t("bunker.waiting")}</span>
                                                        </div>
                                                    )}

                                                    <p className="text-xs text-text-light text-center mt-4">
                                                        {t("bunker.supportedApps")}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <form onSubmit={handleBunkerSubmit}>
                                            <label className="block text-sm font-medium text-white mb-2">
                                                {t("bunkerInput.label")}
                                            </label>
                                            <input
                                                type="text"
                                                value={bunkerInput}
                                                onChange={(e) => setBunkerInput(e.target.value)}
                                                placeholder={t("bunkerInput.placeholder")}
                                                className="w-full py-3 px-4 text-base bg-primary-light text-white border border-border-light rounded-xl transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 placeholder:text-text-light font-mono text-sm mb-2"
                                                autoComplete="off"
                                                spellCheck={false}
                                            />
                                            <p className="text-xs text-text-light mb-4">
                                                {t("bunkerInput.hint")}
                                            </p>
                                            <button
                                                type="submit"
                                                disabled={isLoading || !bunkerInput.startsWith("bunker://")}
                                                className="w-full py-3 text-sm font-semibold text-white bg-accent border border-accent rounded-xl hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isLoading ? t("actions.connecting") : t("actions.connectBunker")}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Second Divider */}
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border-light"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-primary text-text-light">{t("divider")}</span>
                    </div>
                </div>

                {/* Create Account with nstart */}
                <div className="text-center">
                    <p className="text-sm text-text-light mb-4">{t("createAccount.description")}</p>
                    <motion.button
                        onClick={openNstart}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-accent/10 border border-accent rounded-xl hover:bg-accent/20 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <CreateIcon />
                        {t("createAccount.button")}
                    </motion.button>
                </div>

                {/* Info box */}
                <div className="mt-10 p-5 bg-surface rounded-xl border border-border-light">
                    <h3 className="text-sm font-semibold text-white mb-2">{t("info.title")}</h3>
                    <p className="text-sm text-text-light">{t("info.description")}</p>
                </div>
            </div>
        </PageSection>
    );
};

export default Login;

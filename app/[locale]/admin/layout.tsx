"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import AdminSidebar, { NavSection } from "@/components/layout/AdminSidebar";
import { LoginModal } from "@/components/auth";
import {
    HomeIcon,
    UsersIcon,
    BoltIcon,
    ChartBarIcon,
    MegaphoneIcon,
    StarOutlineIcon,
    PinIcon,
    WarningIcon,
    LockIcon,
    LoginIcon,
    ShieldCheckIcon,
    EditIcon,
    MenuIcon,
} from "@/assets/icons/ui";
import { NostrIcon } from "@/assets/icons/social";

interface AdminLayoutProps {
    children: React.ReactNode;
}

// Admin nav sections
const navSections: NavSection[] = [
    {
        items: [
            {
                href: "/admin",
                label: "Dashboard",
                exact: true,
                icon: <HomeIcon className="w-5 h-5" />,
            },
            {
                href: "/admin/seeders",
                label: "Seeders",
                icon: <UsersIcon className="w-5 h-5" />,
            },
            {
                href: "/admin/graph",
                label: "Trust Graph",
                icon: <BoltIcon className="w-5 h-5" />,
            },
            {
                href: "/admin/graph/analytics",
                label: "Analytics",
                icon: <ChartBarIcon className="w-5 h-5" />,
            },
            {
                href: "/admin/marketing",
                label: "Marketing",
                icon: <MegaphoneIcon className="w-5 h-5" />,
            },
            {
                href: "/admin/nostr-bot",
                label: "Nostr Bot",
                icon: <NostrIcon className="w-5 h-5" />,
            },
        ],
    },
    {
        title: "Moderation",
        items: [
            {
                href: "/admin/reviews",
                label: "Reviews",
                icon: <StarOutlineIcon className="w-5 h-5" />,
            },
            {
                href: "/admin/places",
                label: "Places",
                icon: <PinIcon className="w-5 h-5" />,
            },
            {
                href: "/admin/reports",
                label: "Reports",
                icon: <WarningIcon className="w-5 h-5" />,
            },
        ],
    },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
    const t = useTranslations("login.admin");
    const {
        user,
        authToken,
        authenticate,
        isLoading: authLoading,
        isAdmin,
        isAdminLoading,
        requiresInteraction,
    } = useNostrAuth();
    const [authError, setAuthError] = useState<string | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const pathname = usePathname();
    const autoAuthAttempted = useRef(false);

    // Extract locale from pathname
    const locale = pathname.split("/")[1] || "en";

    // Memoize callbacks to prevent unnecessary re-renders
    const handleSidebarClose = useCallback(() => setSidebarOpen(false), []);
    const handleSidebarOpen = useCallback(() => setSidebarOpen(true), []);
    const handleShowLoginModal = useCallback(() => setShowLoginModal(true), []);
    const handleCloseLoginModal = useCallback(() => setShowLoginModal(false), []);

    // Try automatic authentication for non-interactive methods (nsec)
    useEffect(() => {
        if (
            user &&
            user.mode === "write" &&
            !authToken &&
            !authLoading &&
            !isAuthenticating &&
            !requiresInteraction &&
            !autoAuthAttempted.current
        ) {
            autoAuthAttempted.current = true;
            setIsAuthenticating(true);
            authenticate({ silent: true })
                .then((token) => {
                    if (token) {
                        toast.success(t("authenticatedBackground"), {
                            icon: "🔐",
                            duration: 3000,
                        });
                    }
                })
                .catch((error) => {
                    console.error("Auto-authentication failed:", error);
                    setAuthError(error instanceof Error ? error.message : "Authentication failed");
                })
                .finally(() => {
                    setIsAuthenticating(false);
                });
        }
    }, [user, authToken, authLoading, isAuthenticating, requiresInteraction, authenticate]);

    // Reset auto-auth flag when user changes
    useEffect(() => {
        autoAuthAttempted.current = false;
    }, [user?.pubkey]);

    const handleAuthenticate = async () => {
        if (!user) return;

        setIsAuthenticating(true);
        setAuthError(null);

        try {
            await authenticate();
        } catch (error) {
            console.error("Authentication failed:", error);
            setAuthError(error instanceof Error ? error.message : "Authentication failed");
        } finally {
            setIsAuthenticating(false);
        }
    };

    // Loading state (including auto-authentication in progress)
    if (authLoading || isAdminLoading || isAuthenticating) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto mb-4" />
                    <p className="text-text-light">
                        {isAuthenticating ? t("authenticating") : t("checkingAccess")}
                    </p>
                </div>
            </div>
        );
    }

    // Not logged in - show login modal
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center p-8 bg-surface rounded-xl border border-border-light max-w-md">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LockIcon className="w-8 h-8 text-accent" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-4">{t("accessRequired")}</h1>
                    <p className="text-text-light mb-6">
                        {t("pleaseLogin")}
                    </p>
                    <button
                        onClick={handleShowLoginModal}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-light text-white rounded-lg transition-colors"
                    >
                        <LoginIcon className="w-5 h-5" />
                        {t("signToContinue")}
                    </button>
                    <p className="text-xs text-text-light mt-4">
                        <Link href="/" className="text-accent hover:text-accent-light">
                            {t("returnToSite")}
                        </Link>
                    </p>
                </div>
                <LoginModal
                    isOpen={showLoginModal}
                    onClose={handleCloseLoginModal}
                    titleKey="adminTitle"
                    showCreateAccount={false}
                />
            </div>
        );
    }

    // User is logged in but needs to sign challenge to verify identity
    if (!authToken) {
        // Check if user is in write mode (can sign)
        if (user.mode !== "write") {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <div className="text-center p-8 bg-surface rounded-xl border border-border-light max-w-md">
                        <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <WarningIcon className="w-8 h-8 text-amber-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-4">{t("writeRequired")}</h1>
                        <p className="text-text-light mb-6">
                            {t("writeRequiredDescription")}
                        </p>
                        <button
                            onClick={handleShowLoginModal}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-light text-white rounded-lg transition-colors"
                        >
                            <LoginIcon className="w-5 h-5" />
                            {t("loginWithWriteAccess")}
                        </button>
                        <p className="text-xs text-text-light mt-4">
                            {t("currentlyReadOnly")} {user.pubkey.slice(0, 8)}...
                        </p>
                    </div>
                    <LoginModal
                        isOpen={showLoginModal}
                        onClose={handleCloseLoginModal}
                        titleKey="adminTitle"
                    />
                </div>
            );
        }

        // Only show sign challenge UI if interaction is required (extension/bunker)
        // For nsec, auto-authentication should have already happened
        if (requiresInteraction || authError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <div className="text-center p-8 bg-surface rounded-xl border border-border-light max-w-md">
                        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldCheckIcon className="w-8 h-8 text-accent" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-4">{t("verifyIdentity")}</h1>
                        <p className="text-text-light mb-6">
                            {user.method === "extension"
                                ? t("extensionPrompt")
                                : user.method === "bunker"
                                ? t("bunkerPrompt")
                                : t("signPrompt")}
                        </p>
                        {authError && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-red-400 text-sm">
                                {authError}
                            </div>
                        )}
                        <button
                            onClick={handleAuthenticate}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-light text-white rounded-lg transition-colors"
                        >
                            <EditIcon className="w-5 h-5" />
                            {authError ? t("tryAgain") : t("signToContinue")}
                        </button>
                        <p className="text-xs text-text-light mt-4">
                            {t("loggedInAs")} {user.pubkey.slice(0, 8)}...{user.pubkey.slice(-8)}
                        </p>
                    </div>
                </div>
            );
        }

        // For nsec without error, should be authenticating - show loading
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto mb-4" />
                    <p className="text-text-light">{t("authenticating")}</p>
                </div>
            </div>
        );
    }

    // Not an admin
    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center p-8 bg-surface rounded-xl border border-border-light max-w-md">
                    <h1 className="text-2xl font-bold text-white mb-4">{t("accessDenied")}</h1>
                    <p className="text-text-light mb-6">
                        {t("noPrivileges")}
                    </p>
                    <p className="text-xs text-text-light mb-4">
                        {t("pubkey")} {user.pubkey.slice(0, 16)}...{user.pubkey.slice(-16)}
                    </p>
                    <Link
                        href="/"
                        className="inline-block px-6 py-3 bg-surface-light hover:bg-border-light text-white rounded-lg transition-colors"
                    >
                        {t("returnHome")}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-background flex z-40">
            <AdminSidebar
                title="Admin"
                sections={navSections}
                sidebarOpen={sidebarOpen}
                onSidebarClose={handleSidebarClose}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar (mobile) */}
                <header className="lg:hidden sticky top-0 z-30 bg-surface border-b border-border-light">
                    <div className="flex items-center justify-between h-16 px-4">
                        <button
                            onClick={handleSidebarOpen}
                            className="text-text-light hover:text-white"
                        >
                            <MenuIcon className="w-6 h-6" />
                        </button>
                        <span className="text-lg font-semibold text-white">Admin</span>
                        <div className="w-6" /> {/* Spacer for centering */}
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 p-6 lg:p-8 overflow-auto">
                    <div className="max-w-6xl mx-auto">{children}</div>
                </main>
            </div>
        </div>
    );
}

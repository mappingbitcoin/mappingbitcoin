"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useNostrAuth } from "@/contexts/NostrAuthContext";

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const { user, authToken, authenticate, isLoading: authLoading } = useNostrAuth();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [isChecking, setIsChecking] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    // Extract locale from pathname
    const locale = pathname.split("/")[1] || "en";

    const checkAdminStatus = useCallback(async (token: string) => {
        try {
            const response = await fetch("/api/admin/check", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            console.log("[Admin Layout] Check response:", data);
            console.log("[Admin Layout] User pubkey:", user?.pubkey);

            if (response.ok) {
                // Verify the token's pubkey matches the current user
                if (data.pubkey && user?.pubkey && data.pubkey.toLowerCase() !== user.pubkey.toLowerCase()) {
                    console.log("[Admin Layout] Token pubkey mismatch, need re-auth");
                    console.log("[Admin Layout] Token pubkey:", data.pubkey);
                    console.log("[Admin Layout] User pubkey:", user.pubkey);
                    // Token is for a different user, need to re-authenticate
                    setIsAdmin(null);
                    setIsChecking(false);
                    return;
                }
                setIsAdmin(data.isAdmin);
            } else {
                console.error("[Admin Layout] Check failed:", data);
                setIsAdmin(false);
            }
        } catch (error) {
            console.error("Failed to check admin status:", error);
            setIsAdmin(false);
        } finally {
            setIsChecking(false);
        }
    }, [user?.pubkey]);

    // Auto-check if we already have a valid token
    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setIsChecking(false);
            return;
        }

        // If we already have an auth token, check admin status
        if (authToken) {
            checkAdminStatus(authToken);
        } else {
            // Need to authenticate first
            setIsChecking(false);
        }
    }, [user, authToken, authLoading, checkAdminStatus]);

    const handleAuthenticate = async () => {
        if (!user) return;

        setIsAuthenticating(true);
        setAuthError(null);

        try {
            const token = await authenticate();
            await checkAdminStatus(token);
        } catch (error) {
            console.error("Authentication failed:", error);
            setAuthError(error instanceof Error ? error.message : "Authentication failed");
        } finally {
            setIsAuthenticating(false);
        }
    };

    // Loading state
    if (authLoading || isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-text-light">Checking access...</p>
                </div>
            </div>
        );
    }

    // Not logged in - get current path without locale for returnTo
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center p-8 bg-surface rounded-xl border border-border-light max-w-md">
                    <h1 className="text-2xl font-bold text-white mb-4">Admin Access Required</h1>
                    <p className="text-text-light mb-6">
                        Please log in with a Nostr key to access the admin panel.
                    </p>
                    <Link
                        href={`/login?returnTo=${encodeURIComponent(pathWithoutLocale)}`}
                        className="inline-block px-6 py-3 bg-primary hover:bg-primary-light text-white rounded-lg transition-colors"
                    >
                        Log In
                    </Link>
                </div>
            </div>
        );
    }

    // User is logged in but needs to sign challenge to verify identity
    // This includes: no token, or token pubkey doesn't match (isAdmin was set to null)
    if (!authToken || isAdmin === null) {
        // Check if user is in write mode (can sign)
        if (user.mode !== "write") {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <div className="text-center p-8 bg-surface rounded-xl border border-border-light max-w-md">
                        <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-4">Write Access Required</h1>
                        <p className="text-text-light mb-6">
                            Admin access requires signing capability. Please log in with an nsec key or browser extension.
                        </p>
                        <Link
                            href={`/login?returnTo=${encodeURIComponent(pathWithoutLocale)}`}
                            className="inline-block px-6 py-3 bg-primary hover:bg-primary-light text-white rounded-lg transition-colors"
                        >
                            Log In with Write Access
                        </Link>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center p-8 bg-surface rounded-xl border border-border-light max-w-md">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-4">Verify Your Identity</h1>
                    <p className="text-text-light mb-6">
                        Sign a message to prove you control this Nostr key and access the admin panel.
                    </p>
                    {authError && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 text-red-400 text-sm">
                            {authError}
                        </div>
                    )}
                    <button
                        onClick={handleAuthenticate}
                        disabled={isAuthenticating}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-dark text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isAuthenticating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Signing...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Sign Challenge
                            </>
                        )}
                    </button>
                    <p className="text-xs text-text-light mt-4">
                        Logged in as: {user.pubkey.slice(0, 8)}...{user.pubkey.slice(-8)}
                    </p>
                </div>
            </div>
        );
    }

    // Not an admin
    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center p-8 bg-surface rounded-xl border border-border-light max-w-md">
                    <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
                    <p className="text-text-light mb-6">
                        Your account does not have admin privileges.
                    </p>
                    <p className="text-xs text-text-light mb-4">
                        Pubkey: {user.pubkey.slice(0, 16)}...{user.pubkey.slice(-16)}
                    </p>
                    <Link
                        href="/"
                        className="inline-block px-6 py-3 bg-surface-light hover:bg-border-light text-white rounded-lg transition-colors"
                    >
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    // Admin nav items with icons
    const navItems = [
        {
            href: "/admin",
            label: "Dashboard",
            exact: true,
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        },
        {
            href: "/admin/seeders",
            label: "Seeders",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
        },
        {
            href: "/admin/graph",
            label: "Trust Graph",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
        },
        {
            href: "/admin/graph/analytics",
            label: "Analytics",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
    ];

    const moderationItems = [
        {
            href: "/admin/reviews",
            label: "Reviews",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
            ),
        },
        {
            href: "/admin/places",
            label: "Places",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
        },
        {
            href: "/admin/reports",
            label: "Reports",
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
        },
    ];

    const isActive = (href: string, exact?: boolean) => {
        const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
        if (exact) {
            return pathWithoutLocale === href;
        }
        return pathWithoutLocale.startsWith(href);
    };

    return (
        <>
        {/* Spacer to prevent navbar/footer collapse since admin content is fixed */}
        <div className="min-h-screen" />
        <div className="fixed inset-0 top-20 bg-background flex z-40">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-surface border-r border-border-light
                transform transition-transform duration-200 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="flex flex-col h-full">
                    {/* Logo/Title */}
                    <div className="flex items-center justify-between h-16 px-4 border-b border-border-light">
                        <Link href="/admin" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <span className="text-lg font-semibold text-white">Admin</span>
                        </Link>
                        <button
                            className="lg:hidden text-text-light hover:text-white"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        {/* Main Navigation */}
                        <div className="space-y-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                        isActive(item.href, item.exact)
                                            ? "bg-primary text-white"
                                            : "text-text-light hover:text-white hover:bg-surface-light"
                                    }`}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </div>

                        {/* Moderation Section */}
                        <div className="pt-4 mt-4 border-t border-border-light">
                            <p className="px-3 text-xs font-semibold text-text-light uppercase tracking-wider mb-2">
                                Moderation
                            </p>
                            <div className="space-y-1">
                                {moderationItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                            isActive(item.href)
                                                ? "bg-primary text-white"
                                                : "text-text-light hover:text-white hover:bg-surface-light"
                                        }`}
                                    >
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </nav>

                    {/* User Info */}
                    <div className="p-4 border-t border-border-light">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">Admin</p>
                                <p className="text-xs text-text-light truncate">
                                    {user.pubkey.slice(0, 8)}...{user.pubkey.slice(-8)}
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/"
                            className="mt-3 flex items-center justify-center space-x-2 w-full px-3 py-2 text-sm text-text-light hover:text-white hover:bg-surface-light rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Back to Site</span>
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar (mobile) */}
                <header className="lg:hidden sticky top-0 z-30 bg-surface border-b border-border-light">
                    <div className="flex items-center justify-between h-16 px-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-text-light hover:text-white"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <span className="text-lg font-semibold text-white">Admin</span>
                        <div className="w-6" /> {/* Spacer for centering */}
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 p-6 lg:p-8 overflow-auto">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
        </>
    );
}

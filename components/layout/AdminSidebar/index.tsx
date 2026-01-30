"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { SettingsIcon, CloseIcon, UserIcon, ArrowLeftIcon } from "@/assets/icons/ui";

export interface NavItem {
    href: string;
    label: string;
    exact?: boolean;
    icon: React.ReactNode;
}

export interface NavSection {
    title?: string;
    items: NavItem[];
}

interface AdminSidebarProps {
    title?: string;
    sections: NavSection[];
    sidebarOpen: boolean;
    onSidebarClose: () => void;
}

export default function AdminSidebar({
    title = "Admin",
    sections,
    sidebarOpen,
    onSidebarClose,
}: AdminSidebarProps) {
    const pathname = usePathname();
    const { user } = useNostrAuth();

    // Extract locale from pathname
    const locale = pathname.split("/")[1] || "en";

    const isActive = (href: string, exact?: boolean) => {
        const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
        if (exact) {
            return pathWithoutLocale === href;
        }
        return pathWithoutLocale.startsWith(href);
    };

    return (
        <>
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onSidebarClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-surface border-r border-border-light
                transform transition-transform duration-200 ease-in-out
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            `}
            >
                <div className="flex flex-col h-full">
                    {/* Logo/Title */}
                    <div className="flex items-center justify-between h-16 px-4 border-b border-border-light">
                        <Link href="/admin" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                                <SettingsIcon className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-semibold text-white">{title}</span>
                        </Link>
                        <button
                            className="lg:hidden text-text-light hover:text-white"
                            onClick={onSidebarClose}
                        >
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        {sections.map((section, sectionIndex) => (
                            <div
                                key={sectionIndex}
                                className={section.title ? "pt-4 mt-4 border-t border-border-light" : "space-y-1"}
                            >
                                {section.title && (
                                    <p className="px-3 text-xs font-semibold text-text-light uppercase tracking-wider mb-2">
                                        {section.title}
                                    </p>
                                )}
                                <div className="space-y-1">
                                    {section.items.map((item) => (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={onSidebarClose}
                                            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                                isActive(item.href, item.exact)
                                                    ? "bg-accent text-white"
                                                    : "text-text-light hover:text-white hover:bg-surface-light"
                                            }`}
                                        >
                                            {item.icon}
                                            <span>{item.label}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* User Info */}
                    {user && (
                        <div className="p-4 border-t border-border-light">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                                    <UserIcon className="w-4 h-4 text-accent" />
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
                                <ArrowLeftIcon className="w-4 h-4" />
                                <span>Back to Site</span>
                            </Link>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}

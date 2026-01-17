"use client";

import React, { useState, useRef, useEffect } from "react";

interface ContactType {
    key: string;
    label: string;
    placeholder: string;
    inputType: "url" | "email" | "tel" | "text";
    icon: React.ReactNode;
}

const CONTACT_TYPES: ContactType[] = [
    {
        key: "website",
        label: "Website",
        placeholder: "https://example.com",
        inputType: "url",
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
        ),
    },
    {
        key: "phone",
        label: "Phone",
        placeholder: "+1 234 567 8900",
        inputType: "tel",
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
        ),
    },
    {
        key: "email",
        label: "Email",
        placeholder: "hello@example.com",
        inputType: "email",
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        key: "instagram",
        label: "Instagram",
        placeholder: "https://instagram.com/username",
        inputType: "url",
        icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
        ),
    },
    {
        key: "facebook",
        label: "Facebook",
        placeholder: "https://facebook.com/page",
        inputType: "url",
        icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
        ),
    },
    {
        key: "twitter",
        label: "X (Twitter)",
        placeholder: "https://x.com/username",
        inputType: "url",
        icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
    },
    {
        key: "telegram",
        label: "Telegram",
        placeholder: "https://t.me/username",
        inputType: "url",
        icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
        ),
    },
    {
        key: "linkedin",
        label: "LinkedIn",
        placeholder: "https://linkedin.com/in/username",
        inputType: "url",
        icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
        ),
    },
    {
        key: "youtube",
        label: "YouTube",
        placeholder: "https://youtube.com/@channel",
        inputType: "url",
        icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
        ),
    },
    {
        key: "tiktok",
        label: "TikTok",
        placeholder: "https://tiktok.com/@username",
        inputType: "url",
        icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
            </svg>
        ),
    },
    {
        key: "nostr",
        label: "Nostr",
        placeholder: "npub1...",
        inputType: "text",
        icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm3.5 17.5h-7a.5.5 0 01-.5-.5v-2a.5.5 0 01.5-.5h7a.5.5 0 01.5.5v2a.5.5 0 01-.5.5zm0-5h-7a.5.5 0 01-.5-.5v-2a.5.5 0 01.5-.5h7a.5.5 0 01.5.5v2a.5.5 0 01-.5.5zm0-5h-7a.5.5 0 01-.5-.5v-2a.5.5 0 01.5-.5h7a.5.5 0 01.5.5v2a.5.5 0 01-.5.5z" />
            </svg>
        ),
    },
];

// Main contacts always shown
const MAIN_CONTACTS = ["website", "phone", "email"];

interface Props {
    contact: Record<string, string>;
    onChange: (updated: Record<string, string>) => void;
}

export default function SocialLinksEditor({ contact, onChange }: Props) {
    const [showAddMenu, setShowAddMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Get available socials that haven't been added yet
    const availableSocials = CONTACT_TYPES.filter(
        (type) => !MAIN_CONTACTS.includes(type.key) && !(type.key in contact)
    );

    // Get added socials (non-main ones that exist in contact)
    const addedSocials = CONTACT_TYPES.filter(
        (type) => !MAIN_CONTACTS.includes(type.key) && type.key in contact
    );

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowAddMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function handleChange(key: string, value: string) {
        onChange({ ...contact, [key]: value });
    }

    function handleAdd(key: string) {
        onChange({ ...contact, [key]: "" });
        setShowAddMenu(false);
    }

    function handleRemove(key: string) {
        const updated = { ...contact };
        delete updated[key];
        onChange(updated);
    }

    function getContactType(key: string): ContactType | undefined {
        return CONTACT_TYPES.find((t) => t.key === key);
    }

    return (
        <div className="space-y-3">
            {/* Main Contacts - Always shown */}
            <div className="grid gap-3 sm:grid-cols-2">
                {MAIN_CONTACTS.map((key) => {
                    const type = getContactType(key);
                    if (!type) return null;
                    return (
                        <div key={key} className="relative">
                            <label className="text-xs font-medium text-text-light block mb-1">
                                {type.label}
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light">
                                    {type.icon}
                                </div>
                                <input
                                    type={type.inputType}
                                    value={contact[key] || ""}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    placeholder={type.placeholder}
                                    className="w-full py-2 pl-10 pr-3 border border-border-light rounded-lg text-sm text-white bg-surface-light
                                        placeholder:text-text-light/50
                                        focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent
                                        transition-all duration-200"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Added Social Links */}
            {addedSocials.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                    {addedSocials.map((type) => (
                        <div key={type.key} className="relative">
                            <label className="text-xs font-medium text-text-light block mb-1">
                                {type.label}
                            </label>
                            <div className="relative flex gap-1.5">
                                <div className="relative flex-1">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light">
                                        {type.icon}
                                    </div>
                                    <input
                                        type={type.inputType}
                                        value={contact[type.key] || ""}
                                        onChange={(e) => handleChange(type.key, e.target.value)}
                                        placeholder={type.placeholder}
                                        className="w-full py-2 pl-10 pr-3 border border-border-light rounded-lg text-sm text-white bg-surface-light
                                            placeholder:text-text-light/50
                                            focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent
                                            transition-all duration-200"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemove(type.key)}
                                    className="p-2 text-text-light hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Remove"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add More Button */}
            {availableSocials.length > 0 && (
                <div ref={menuRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setShowAddMenu(!showAddMenu)}
                        className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-dark transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add social link
                    </button>

                    {showAddMenu && (
                        <div className="absolute z-50 mt-1 w-56 bg-surface-light border border-border-light rounded-xl shadow-lg py-1 max-h-64 overflow-y-auto">
                            {availableSocials.map((type) => (
                                <button
                                    key={type.key}
                                    type="button"
                                    onClick={() => handleAdd(type.key)}
                                    className="w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 text-white hover:bg-surface transition-colors"
                                >
                                    <span className="text-text-light">{type.icon}</span>
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

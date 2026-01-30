"use client";

import React, { useState, useRef, useEffect, ComponentType } from "react";
import { IconProps, CloseIcon, PlusIcon } from "@/assets/icons/ui";
import { WebsiteIcon, PhoneIcon, EmailIcon } from "@/assets/icons/contact";
import {
    InstagramIcon,
    FacebookIcon,
    TwitterIcon,
    TelegramIcon,
    LinkedInIcon,
    YouTubeIcon,
    TikTokIcon,
    NostrIcon,
} from "@/assets/icons/social";

interface ContactType {
    key: string;
    label: string;
    placeholder: string;
    inputType: "url" | "email" | "tel" | "text";
    Icon: ComponentType<IconProps>;
}

const CONTACT_TYPES: ContactType[] = [
    {
        key: "website",
        label: "Website",
        placeholder: "https://example.com",
        inputType: "url",
        Icon: WebsiteIcon,
    },
    {
        key: "phone",
        label: "Phone",
        placeholder: "+1 234 567 8900",
        inputType: "tel",
        Icon: PhoneIcon,
    },
    {
        key: "email",
        label: "Email",
        placeholder: "hello@example.com",
        inputType: "email",
        Icon: EmailIcon,
    },
    {
        key: "instagram",
        label: "Instagram",
        placeholder: "https://instagram.com/username",
        inputType: "url",
        Icon: InstagramIcon,
    },
    {
        key: "facebook",
        label: "Facebook",
        placeholder: "https://facebook.com/page",
        inputType: "url",
        Icon: FacebookIcon,
    },
    {
        key: "twitter",
        label: "X (Twitter)",
        placeholder: "https://x.com/username",
        inputType: "url",
        Icon: TwitterIcon,
    },
    {
        key: "telegram",
        label: "Telegram",
        placeholder: "https://t.me/username",
        inputType: "url",
        Icon: TelegramIcon,
    },
    {
        key: "linkedin",
        label: "LinkedIn",
        placeholder: "https://linkedin.com/in/username",
        inputType: "url",
        Icon: LinkedInIcon,
    },
    {
        key: "youtube",
        label: "YouTube",
        placeholder: "https://youtube.com/@channel",
        inputType: "url",
        Icon: YouTubeIcon,
    },
    {
        key: "tiktok",
        label: "TikTok",
        placeholder: "https://tiktok.com/@username",
        inputType: "url",
        Icon: TikTokIcon,
    },
    {
        key: "nostr",
        label: "Nostr",
        placeholder: "npub1...",
        inputType: "text",
        Icon: NostrIcon,
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
                    const IconComponent = type.Icon;
                    return (
                        <div key={key} className="relative">
                            <label className="text-xs font-medium text-text-light block mb-1">
                                {type.label}
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light">
                                    <IconComponent className="w-4 h-4" />
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
                    {addedSocials.map((type) => {
                        const IconComponent = type.Icon;
                        return (
                            <div key={type.key} className="relative">
                                <label className="text-xs font-medium text-text-light block mb-1">
                                    {type.label}
                                </label>
                                <div className="relative flex gap-1.5">
                                    <div className="relative flex-1">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light">
                                            <IconComponent className="w-4 h-4" />
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
                                        <CloseIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
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
                        <PlusIcon className="w-4 h-4" />
                        Add social link
                    </button>

                    {showAddMenu && (
                        <div className="absolute z-50 mt-1 w-56 bg-surface-light border border-border-light rounded-xl shadow-lg py-1 max-h-64 overflow-y-auto">
                            {availableSocials.map((type) => {
                                const IconComponent = type.Icon;
                                return (
                                    <button
                                        key={type.key}
                                        type="button"
                                        onClick={() => handleAdd(type.key)}
                                        className="w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 text-white hover:bg-surface transition-colors"
                                    >
                                        <span className="text-text-light"><IconComponent className="w-4 h-4" /></span>
                                        {type.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

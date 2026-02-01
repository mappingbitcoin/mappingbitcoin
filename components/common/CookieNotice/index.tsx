"use client";

import { useEffect, useState, useCallback } from "react";
import { CookieIcon } from "@/assets/icons/ui";
import Button, { IconButton } from "@/components/ui/Button";
import { TextLink } from "@/components/ui";

export type ConsentState = {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
};

const CONSENT_KEY = "cookieConsent";

export function getStoredConsent(): ConsentState | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;
    try {
        return JSON.parse(stored);
    } catch {
        return null;
    }
}

export function setStoredConsent(consent: ConsentState) {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    localStorage.setItem("gaDisabled", consent.analytics ? "false" : "true");
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: consent }));
}

export default function CookieNotice() {
    const [visible, setVisible] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);
    const [preferences, setPreferences] = useState<ConsentState>({
        necessary: true,
        analytics: false,
        marketing: false,
    });

    useEffect(() => {
        const consent = getStoredConsent();
        if (!consent) {
            setVisible(true);
        }

        const handleOpenSettings = () => {
            const storedConsent = getStoredConsent();
            if (storedConsent) {
                setPreferences(storedConsent);
            }
            setVisible(true);
            setShowPreferences(true);
        };

        window.addEventListener('open-cookie-settings', handleOpenSettings);
        return () => window.removeEventListener('open-cookie-settings', handleOpenSettings);
    }, []);

    const handleAcceptAll = useCallback(() => {
        const consent: ConsentState = { necessary: true, analytics: true, marketing: true };
        setStoredConsent(consent);
        setVisible(false);
        setShowPreferences(false);
    }, []);

    const handleNecessaryOnly = useCallback(() => {
        const consent: ConsentState = { necessary: true, analytics: false, marketing: false };
        setStoredConsent(consent);
        setVisible(false);
        setShowPreferences(false);
    }, []);

    const handleSavePreferences = useCallback(() => {
        setStoredConsent(preferences);
        setVisible(false);
        setShowPreferences(false);
    }, [preferences]);

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] flex justify-center p-4 bg-gradient-to-t from-black/30 to-transparent animate-slide-up">
            <div className="max-w-[600px] w-full bg-primary rounded-card shadow-glass border border-glass-border overflow-hidden">
                <div className="p-6">
                    <h3 className="text-white text-xl mb-3 font-semibold">Cookie Settings</h3>
                    <p className="text-white/70 text-[0.9rem] leading-relaxed mb-5">
                        We use cookies to enhance your experience. You can customize your preferences or accept all cookies.{" "}
                        <TextLink href="/privacy-policy" variant="accent">Privacy Policy</TextLink>
                    </p>

                    {showPreferences ? (
                        <div className="flex flex-col gap-4">
                            {/* Necessary */}
                            <div className="flex justify-between items-center p-3 px-4 bg-white/5 rounded-btn border border-white/[0.08]">
                                <div className="flex flex-col gap-1">
                                    <span className="text-white font-semibold text-[0.95rem]">Necessary</span>
                                    <span className="text-white/50 text-[0.8rem]">Required for the site to function properly</span>
                                </div>
                                <label className="relative inline-block w-12 h-[26px] opacity-60 cursor-not-allowed">
                                    <input type="checkbox" checked={preferences.necessary} disabled readOnly className="opacity-0 w-0 h-0" />
                                    <span className="absolute cursor-not-allowed inset-0 bg-gradient-accent rounded-full before:absolute before:content-[''] before:h-5 before:w-5 before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition-transform before:translate-x-[22px]"></span>
                                </label>
                            </div>

                            {/* Analytics */}
                            <div className="flex justify-between items-center p-3 px-4 bg-white/5 rounded-btn border border-white/[0.08]">
                                <div className="flex flex-col gap-1">
                                    <span className="text-white font-semibold text-[0.95rem]">Analytics</span>
                                    <span className="text-white/50 text-[0.8rem]">Help us understand how you use the site</span>
                                </div>
                                <label className="relative inline-block w-12 h-[26px] cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={preferences.analytics}
                                        onChange={(e) => setPreferences((p) => ({ ...p, analytics: e.target.checked }))}
                                        className="opacity-0 w-0 h-0 peer"
                                    />
                                    <span className="absolute cursor-pointer inset-0 bg-white/20 rounded-full transition-all before:absolute before:content-[''] before:h-5 before:w-5 before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition-transform peer-checked:bg-gradient-accent peer-checked:before:translate-x-[22px]"></span>
                                </label>
                            </div>

                            {/* Marketing */}
                            <div className="flex justify-between items-center p-3 px-4 bg-white/5 rounded-btn border border-white/[0.08]">
                                <div className="flex flex-col gap-1">
                                    <span className="text-white font-semibold text-[0.95rem]">Marketing</span>
                                    <span className="text-white/50 text-[0.8rem]">Personalized ads and content</span>
                                </div>
                                <label className="relative inline-block w-12 h-[26px] cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={preferences.marketing}
                                        onChange={(e) => setPreferences((p) => ({ ...p, marketing: e.target.checked }))}
                                        className="opacity-0 w-0 h-0 peer"
                                    />
                                    <span className="absolute cursor-pointer inset-0 bg-white/20 rounded-full transition-all before:absolute before:content-[''] before:h-5 before:w-5 before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition-transform peer-checked:bg-gradient-accent peer-checked:before:translate-x-[22px]"></span>
                                </label>
                            </div>

                            <div className="flex gap-3 mt-2 flex-col md:flex-row">
                                <Button
                                    onClick={() => setShowPreferences(false)}
                                    variant="outline"
                                    color="neutral"
                                    fullWidth
                                    size="lg"
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={handleSavePreferences}
                                    fullWidth
                                    size="lg"
                                >
                                    Save Preferences
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-3 flex-col md:flex-row">
                            <Button
                                onClick={handleNecessaryOnly}
                                variant="outline"
                                color="neutral"
                                fullWidth
                                size="lg"
                            >
                                Necessary Only
                            </Button>
                            <Button
                                onClick={() => setShowPreferences(true)}
                                variant="soft"
                                color="neutral"
                                fullWidth
                                size="lg"
                            >
                                Customize
                            </Button>
                            <Button
                                onClick={handleAcceptAll}
                                fullWidth
                                size="lg"
                            >
                                Accept All
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export function CookieSettingsButton() {
    const handleClick = () => {
        window.dispatchEvent(new CustomEvent('open-cookie-settings'));
    };

    return (
        <IconButton
            onClick={handleClick}
            icon={<CookieIcon />}
            aria-label="Cookie Settings"
            variant="soft"
            color="neutral"
            size="sm"
        />
    );
}

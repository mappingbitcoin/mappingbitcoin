"use client";

import { useEffect, useState, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { CookieIcon } from "@/assets/icons/ui";

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
                        <Link href="/privacy-policy" className="text-accent underline hover:text-accent-light">Privacy Policy</Link>
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
                                <button
                                    className="flex-1 min-w-[120px] py-3 px-5 rounded-btn text-[0.9rem] font-semibold cursor-pointer transition-all border-none font-oswald bg-transparent text-white/80 border border-white/20 hover:bg-white/10 hover:border-white/30"
                                    onClick={() => setShowPreferences(false)}
                                >
                                    Back
                                </button>
                                <button
                                    className="flex-1 min-w-[120px] py-3 px-5 rounded-btn text-[0.9rem] font-semibold cursor-pointer transition-all border-none font-oswald bg-gradient-accent text-white shadow-accent hover:-translate-y-0.5 hover:shadow-accent-hover"
                                    onClick={handleSavePreferences}
                                >
                                    Save Preferences
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-3 flex-col md:flex-row">
                            <button
                                className="flex-1 min-w-[120px] py-3 px-5 rounded-btn text-[0.9rem] font-semibold cursor-pointer transition-all font-oswald bg-transparent text-white/80 border border-white/20 shadow-none hover:bg-white/10 hover:border-white/30"
                                onClick={handleNecessaryOnly}
                            >
                                Necessary Only
                            </button>
                            <button
                                className="flex-1 min-w-[120px] py-3 px-5 rounded-btn text-[0.9rem] font-semibold cursor-pointer transition-all border-none font-oswald bg-white/10 text-white shadow-none hover:bg-white/15"
                                onClick={() => setShowPreferences(true)}
                            >
                                Customize
                            </button>
                            <button
                                className="flex-1 min-w-[120px] py-3 px-5 rounded-btn text-[0.9rem] font-semibold cursor-pointer transition-all border-none font-oswald bg-gradient-accent text-white shadow-accent hover:-translate-y-0.5 hover:shadow-accent-hover"
                                onClick={handleAcceptAll}
                            >
                                Accept All
                            </button>
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
        <button
            className="flex items-center justify-center w-9 h-9 p-0 min-w-0 bg-white/10 border border-white/15 rounded-lg text-white/60 cursor-pointer transition-all shadow-none hover:bg-white/15 hover:text-accent hover:transform-none hover:shadow-none"
            onClick={handleClick}
            aria-label="Cookie Settings"
            title="Cookie Settings"
        >
            <CookieIcon className="w-[18px] h-[18px]" />
        </button>
    );
}

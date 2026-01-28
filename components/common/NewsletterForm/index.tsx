"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

declare global {
    interface Window {
        grecaptcha?: {
            ready: (callback: () => void) => void;
            execute: (siteKey: string, options: { action: string }) => Promise<string>;
        };
    }
}

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

interface NewsletterFormProps {
    list?: string;
    className?: string;
    compact?: boolean;
}

const NewsletterForm: React.FC<NewsletterFormProps> = ({
    list = "newsletter",
    className = "",
    compact = false,
}) => {
    const t = useTranslations("subscribe");
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "already">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);

    // Check if reCAPTCHA is already loaded
    useEffect(() => {
        if (window.grecaptcha) {
            setRecaptchaLoaded(true);
        }
    }, []);

    const getRecaptchaToken = useCallback(async (): Promise<string | null> => {
        if (!RECAPTCHA_SITE_KEY || !window.grecaptcha) {
            return null;
        }

        return new Promise((resolve) => {
            window.grecaptcha!.ready(async () => {
                try {
                    const token = await window.grecaptcha!.execute(RECAPTCHA_SITE_KEY, {
                        action: "newsletter_subscribe",
                    });
                    resolve(token);
                } catch (error) {
                    console.error("reCAPTCHA error:", error);
                    resolve(null);
                }
            });
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setErrorMessage(t("invalidEmail"));
            setStatus("error");
            return;
        }

        setStatus("loading");
        setErrorMessage("");

        try {
            const recaptchaToken = recaptchaLoaded ? await getRecaptchaToken() : null;

            const response = await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    list,
                    recaptchaToken,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(data.error || t("error"));
                setStatus("error");
                return;
            }

            if (data.alreadySubscribed) {
                setStatus("already");
            } else {
                setStatus("success");
                setEmail("");
            }
        } catch {
            setErrorMessage(t("error"));
            setStatus("error");
        }
    };

    // Success message
    if (status === "success") {
        return (
            <div className={`${className}`}>
                <div className="flex items-center gap-2 text-green-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span className="text-sm">{t("success")}</span>
                </div>
            </div>
        );
    }

    // Already subscribed message
    if (status === "already") {
        return (
            <div className={`${className}`}>
                <div className="flex items-center gap-2 text-accent">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span className="text-sm">{t("alreadySubscribed")}</span>
                </div>
            </div>
        );
    }

    if (compact) {
        return (
            <div className={`${className}`}>
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t("placeholder")}
                        required
                        className="flex-1 py-2 px-3 text-sm bg-white/10 text-white border border-white/20 rounded-btn placeholder:text-white/40 focus:outline-none focus:border-accent"
                    />
                    <button
                        type="submit"
                        disabled={status === "loading"}
                        className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-btn hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {status === "loading" ? "..." : t("button")}
                    </button>
                </form>
                {status === "error" && (
                    <p className="mt-2 text-xs text-red-400">{errorMessage}</p>
                )}
            </div>
        );
    }

    return (
        <div className={`${className}`}>
            <h3 className="text-lg font-semibold text-white mb-2">{t("title")}</h3>
            <p className="text-sm text-white/60 mb-4">{t("description")}</p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("placeholder")}
                    required
                    className="flex-1 py-3 px-4 text-base bg-white/10 text-white border border-white/20 rounded-btn placeholder:text-white/40 focus:outline-none focus:border-accent"
                />
                <button
                    type="submit"
                    disabled={status === "loading"}
                    className="px-6 py-3 text-base font-semibold bg-accent text-white rounded-btn hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                    {status === "loading" ? t("sending") : t("button")}
                </button>
            </form>
            {status === "error" && (
                <p className="mt-3 text-sm text-red-400">{errorMessage}</p>
            )}
        </div>
    );
};

export default NewsletterForm;

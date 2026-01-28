"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

declare global {
    interface Window {
        // @ts-ignore
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
}

const NewsletterForm: React.FC<NewsletterFormProps> = ({
    list = "newsletter",
    className = "",
}) => {
    const t = useTranslations("subscribe");
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "already">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);

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

    if (status === "success") {
        return (
            <div className={`flex items-center gap-2 text-green-400 ${className}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span className="text-sm">{t("success")}</span>
            </div>
        );
    }

    if (status === "already") {
        return (
            <div className={`flex items-center gap-2 text-orange-400 ${className}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span className="text-sm">{t("alreadySubscribed")}</span>
            </div>
        );
    }

    return (
        <div className={className}>
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("placeholder")}
                    required
                    className="flex-1 py-2.5 px-4 text-sm bg-white/5 text-white border border-white/10 rounded-lg placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 transition-colors"
                />
                <button
                    type="submit"
                    disabled={status === "loading"}
                    className="px-5 py-2.5 text-sm font-medium bg-orange-500/10 border border-orange-500 text-white rounded-lg hover:bg-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                    {status === "loading" ? "..." : t("button")}
                </button>
            </form>
            {status === "error" && (
                <p className="mt-2 text-xs text-red-400">{errorMessage}</p>
            )}
        </div>
    );
};

export default NewsletterForm;

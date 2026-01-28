"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { PageSection } from "@/components/layout";

declare global {
    interface Window {
        grecaptcha: {
            ready: (callback: () => void) => void;
            execute: (siteKey: string, options: { action: string }) => Promise<string>;
        };
    }
}

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

const ContactCard = ({
    icon,
    title,
    description,
    email
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    email: string;
}) => (
    <div className="bg-surface rounded-card p-6 border border-border-light transition-all duration-300 hover:border-accent/30">
        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
            {icon}
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-text-light mb-4">{description}</p>
        <a
            href={`mailto:${email}`}
            className="text-accent font-medium text-sm hover:underline inline-flex items-center gap-2"
        >
            {email}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M17 7H7M17 7V17"/>
            </svg>
        </a>
    </div>
);

const Contact: React.FC = () => {
    const t = useTranslations("contact");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        message: "",
    });
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "rate-limited">("idle");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);

    // Load reCAPTCHA script
    useEffect(() => {
        if (!RECAPTCHA_SITE_KEY) {
            console.warn("reCAPTCHA site key not configured");
            return;
        }

        // Check if script already exists
        if (document.querySelector(`script[src*="recaptcha"]`)) {
            setRecaptchaLoaded(true);
            return;
        }

        const script = document.createElement("script");
        script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
        script.async = true;
        script.defer = true;
        script.onload = () => setRecaptchaLoaded(true);
        document.head.appendChild(script);

        return () => {
            // Cleanup on unmount (optional, usually not needed)
        };
    }, []);

    const getRecaptchaToken = useCallback(async (): Promise<string | null> => {
        if (!RECAPTCHA_SITE_KEY || !recaptchaLoaded) {
            return null;
        }

        return new Promise((resolve) => {
            window.grecaptcha.ready(async () => {
                try {
                    const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, {
                        action: "contact_form",
                    });
                    resolve(token);
                } catch (error) {
                    console.error("reCAPTCHA error:", error);
                    resolve(null);
                }
            });
        });
    }, [recaptchaLoaded]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus("loading");
        setErrorMessage("");

        try {
            // Get reCAPTCHA token
            const recaptchaToken = await getRecaptchaToken();

            if (!recaptchaToken && RECAPTCHA_SITE_KEY) {
                setStatus("error");
                setErrorMessage(t("form.recaptchaError"));
                return;
            }

            const response = await fetch("/api/contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    recaptchaToken,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 429) {
                    setStatus("rate-limited");
                    setErrorMessage(
                        data.resetIn
                            ? t("form.rateLimitedMessage", { minutes: data.resetIn })
                            : t("form.rateLimitedGeneric")
                    );
                } else {
                    setStatus("error");
                    setErrorMessage(data.error || t("form.errorMessage"));
                }
                return;
            }

            setStatus("success");
            setFormData({ name: "", email: "", message: "" });
        } catch (error) {
            console.error("Error sending message:", error);
            setStatus("error");
            setErrorMessage(t("form.errorMessage"));
        }
    };

    return (
        <PageSection background="dark">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4 text-white">{t("heading")}</h1>
                <p className="text-lg text-text-light max-w-[600px] mx-auto">{t("subheading")}</p>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
                {/* Left: Contact Form */}
                <div className="bg-surface rounded-card p-8 border border-border-light">
                    <h2 className="text-xl font-semibold text-white mb-2">{t("form.title")}</h2>
                    <p className="text-text-light text-sm mb-6">{t("form.subtitle")}</p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium text-white mb-1.5">{t("form.nameLabel")}</label>
                            <input
                                type="text"
                                name="name"
                                placeholder={t("form.namePlaceholder")}
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full py-3 px-4 text-base bg-primary-light text-white border border-border-light rounded-btn transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 placeholder:text-text-light"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white mb-1.5">{t("form.emailLabel")}</label>
                            <input
                                type="email"
                                name="email"
                                placeholder={t("form.emailPlaceholder")}
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full py-3 px-4 text-base bg-primary-light text-white border border-border-light rounded-btn transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 placeholder:text-text-light"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white mb-1.5">{t("form.messageLabel")}</label>
                            <textarea
                                name="message"
                                placeholder={t("form.messagePlaceholder")}
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows={5}
                                className="w-full py-3 px-4 text-base bg-primary-light text-white border border-border-light rounded-btn transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-y placeholder:text-text-light"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={status === "loading"}
                            className="w-full py-3.5 text-[15px] font-semibold text-white border-2 border-accent rounded-btn cursor-pointer transition-all bg-accent/10 hover:enabled:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {status === "loading" ? t("form.sendingButton") : t("form.sendButton")}
                        </button>
                        {status === "success" && (
                            <div className="bg-green-500/10 text-green-400 text-sm p-3 rounded-btn text-center border border-green-500/20">
                                {t("form.successMessage")}
                            </div>
                        )}
                        {(status === "error" || status === "rate-limited") && (
                            <div className="bg-red-500/10 text-red-400 text-sm p-3 rounded-btn text-center border border-red-500/20">
                                {errorMessage || t("form.errorMessage")}
                            </div>
                        )}
                        <p className="text-xs text-text-light text-center mt-2">
                            {t("form.recaptchaNotice")}
                        </p>
                    </form>
                </div>

                {/* Right: Contact Cards */}
                <div className="flex flex-col gap-6">
                    <ContactCard
                        icon={
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f7931a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                                <circle cx="9" cy="7" r="4"/>
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            </svg>
                        }
                        title={t("cards.partners.title")}
                        description={t("cards.partners.description")}
                        email="partners@mappingbitcoin.com"
                    />
                    <ContactCard
                        icon={
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f7931a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/>
                                <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                                <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/>
                                <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/>
                                <path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/>
                                <path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/>
                                <path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/>
                                <path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"/>
                            </svg>
                        }
                        title={t("cards.media.title")}
                        description={t("cards.media.description")}
                        email="media@mappingbitcoin.com"
                    />
                    <ContactCard
                        icon={
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f7931a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                <polyline points="22,6 12,13 2,6"/>
                            </svg>
                        }
                        title={t("cards.general.title")}
                        description={t("cards.general.description")}
                        email="satoshi@mappingbitcoin.com"
                    />
                </div>
            </div>
        </PageSection>
    );
};

export default Contact;

"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckmarkIcon } from "@/assets/icons/ui";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { isValidEmail } from "@/utils/validation";

type SubscribeStatus = "idle" | "loading" | "success" | "error" | "already";

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
    const [status, setStatus] = useState<SubscribeStatus>("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const { getToken, isReady } = useRecaptcha({ action: "newsletter_subscribe" });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!email || !isValidEmail(email)) {
            setErrorMessage(t("invalidEmail"));
            setStatus("error");
            return;
        }

        setStatus("loading");
        setErrorMessage("");

        try {
            const recaptchaToken = isReady ? await getToken() : null;

            const response = await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, list, recaptchaToken }),
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

    // Success state
    if (status === "success") {
        return (
            <StatusMessage
                className={className}
                color="green"
                message={t("success")}
            />
        );
    }

    // Already subscribed state
    if (status === "already") {
        return (
            <StatusMessage
                className={className}
                color="orange"
                message={t("alreadySubscribed")}
            />
        );
    }

    // Form state
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

// Small presentational component for status messages
const StatusMessage = ({
    className,
    color,
    message,
}: {
    className: string;
    color: "green" | "orange";
    message: string;
}) => (
    <div className={`flex items-center gap-2 text-${color}-400 ${className}`}>
        <CheckmarkIcon className="w-[18px] h-[18px]" />
        <span className="text-sm">{message}</span>
    </div>
);

export default NewsletterForm;

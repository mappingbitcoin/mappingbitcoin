"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { PageSection } from "@/components/layout";
import { ArrowUpRightIcon } from "@/assets/icons/ui";
import { PartnersIcon, MediaIcon, EnvelopeIcon } from "@/assets/icons/contact";
import { useRecaptcha } from "@/hooks/useRecaptcha";

type ContactStatus = "idle" | "loading" | "success" | "error" | "rate-limited";

interface ContactFormData {
    name: string;
    email: string;
    message: string;
}

const ContactCard = ({
    icon,
    title,
    description,
    email,
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
            <ArrowUpRightIcon className="w-3.5 h-3.5" />
        </a>
    </div>
);

const Contact: React.FC = () => {
    const t = useTranslations("contact");
    const [formData, setFormData] = useState<ContactFormData>({
        name: "",
        email: "",
        message: "",
    });
    const [status, setStatus] = useState<ContactStatus>("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const { getToken, isConfigured } = useRecaptcha({ action: "contact_form" });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus("loading");
        setErrorMessage("");

        try {
            const recaptchaToken = await getToken();

            if (!recaptchaToken && isConfigured) {
                setStatus("error");
                setErrorMessage(t("form.recaptchaError"));
                return;
            }

            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, recaptchaToken }),
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
                <h1 className="text-4xl font-bold mb-4 text-white">
                    {t("heading")}
                </h1>
                <p className="text-lg text-text-light max-w-[600px] mx-auto">
                    {t("subheading")}
                </p>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
                {/* Left: Contact Form */}
                <div className="bg-surface rounded-card p-8 border border-border-light">
                    <h2 className="text-xl font-semibold text-white mb-2">
                        {t("form.title")}
                    </h2>
                    <p className="text-text-light text-sm mb-6">
                        {t("form.subtitle")}
                    </p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <FormField label={t("form.nameLabel")}>
                            <input
                                type="text"
                                name="name"
                                placeholder={t("form.namePlaceholder")}
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full py-3 px-4 text-base bg-primary-light text-white border border-border-light rounded-btn transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 placeholder:text-text-light"
                            />
                        </FormField>

                        <FormField label={t("form.emailLabel")}>
                            <input
                                type="email"
                                name="email"
                                placeholder={t("form.emailPlaceholder")}
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full py-3 px-4 text-base bg-primary-light text-white border border-border-light rounded-btn transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 placeholder:text-text-light"
                            />
                        </FormField>

                        <FormField label={t("form.messageLabel")}>
                            <textarea
                                name="message"
                                placeholder={t("form.messagePlaceholder")}
                                value={formData.message}
                                onChange={handleChange}
                                required
                                rows={5}
                                className="w-full py-3 px-4 text-base bg-primary-light text-white border border-border-light rounded-btn transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-y placeholder:text-text-light"
                            />
                        </FormField>

                        <button
                            type="submit"
                            disabled={status === "loading"}
                            className="w-full py-3.5 text-[15px] font-semibold text-white border-2 border-accent rounded-btn cursor-pointer transition-all bg-accent/10 hover:enabled:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {status === "loading"
                                ? t("form.sendingButton")
                                : t("form.sendButton")}
                        </button>

                        {status === "success" && (
                            <FormAlert type="success">
                                {t("form.successMessage")}
                            </FormAlert>
                        )}

                        {(status === "error" || status === "rate-limited") && (
                            <FormAlert type="error">
                                {errorMessage || t("form.errorMessage")}
                            </FormAlert>
                        )}

                        <p className="text-xs text-text-light text-center mt-2">
                            {t("form.recaptchaNotice")}
                        </p>
                    </form>
                </div>

                {/* Right: Contact Cards */}
                <div className="flex flex-col gap-6">
                    <ContactCard
                        icon={<PartnersIcon className="w-6 h-6 stroke-accent" />}
                        title={t("cards.partners.title")}
                        description={t("cards.partners.description")}
                        email="partners@mappingbitcoin.com"
                    />
                    <ContactCard
                        icon={<MediaIcon className="w-6 h-6 stroke-accent" />}
                        title={t("cards.media.title")}
                        description={t("cards.media.description")}
                        email="media@mappingbitcoin.com"
                    />
                    <ContactCard
                        icon={<EnvelopeIcon className="w-6 h-6 stroke-accent" />}
                        title={t("cards.general.title")}
                        description={t("cards.general.description")}
                        email="satoshi@mappingbitcoin.com"
                    />
                </div>
            </div>
        </PageSection>
    );
};

// Small presentational components
const FormField = ({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) => (
    <div>
        <label className="block text-sm font-medium text-white mb-1.5">
            {label}
        </label>
        {children}
    </div>
);

const FormAlert = ({
    type,
    children,
}: {
    type: "success" | "error";
    children: React.ReactNode;
}) => {
    const styles =
        type === "success"
            ? "bg-green-500/10 text-green-400 border-green-500/20"
            : "bg-red-500/10 text-red-400 border-red-500/20";

    return (
        <div className={`text-sm p-3 rounded-btn text-center border ${styles}`}>
            {children}
        </div>
    );
};

export default Contact;

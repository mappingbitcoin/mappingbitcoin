"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageSection } from "@/components/layout";
import { Link } from "@/i18n/navigation";
import { CircleWarningIcon, CircleXIcon, CircleCheckIcon } from "@/assets/icons/ui";

interface SubscriptionList {
    slug: string;
    name: string;
    subscribedAt: string;
}

interface SubscriberInfo {
    email: string;
    lists: SubscriptionList[];
}

const Unsubscribe: React.FC = () => {
    const t = useTranslations("unsubscribe");
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const listParam = searchParams.get("list");

    const [status, setStatus] = useState<"loading" | "ready" | "success" | "error" | "no-token">("loading");
    const [subscriber, setSubscriber] = useState<SubscriberInfo | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [unsubscribing, setUnsubscribing] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setStatus("no-token");
            return;
        }

        // Fetch subscriber info
        fetch(`/api/unsubscribe?token=${token}`)
            .then((res) => {
                if (!res.ok) throw new Error("Invalid token");
                return res.json();
            })
            .then((data: SubscriberInfo) => {
                setSubscriber(data);
                setStatus("ready");

                // Auto-unsubscribe if list param is provided
                if (listParam && data.lists.some((l) => l.slug === listParam)) {
                    handleUnsubscribe(listParam);
                }
            })
            .catch(() => {
                setErrorMessage(t("invalidToken"));
                setStatus("error");
            });
    }, [token, listParam, t]);

    const handleUnsubscribe = async (listSlug?: string) => {
        if (!token) return;

        setUnsubscribing(listSlug ?? "all");

        try {
            const response = await fetch("/api/unsubscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, list: listSlug }),
            });

            if (!response.ok) {
                throw new Error("Failed to unsubscribe");
            }

            const data = await response.json();

            if (listSlug) {
                // Update local state to remove the unsubscribed list
                setSubscriber((prev) =>
                    prev
                        ? {
                              ...prev,
                              lists: prev.lists.filter((l) => l.slug !== listSlug),
                          }
                        : null
                );
            } else {
                // Unsubscribed from all
                setSubscriber((prev) => (prev ? { ...prev, lists: [] } : null));
            }

            if (!data.remainingLists?.length) {
                setStatus("success");
            }
        } catch {
            setErrorMessage(t("error"));
        } finally {
            setUnsubscribing(null);
        }
    };

    // No token provided
    if (status === "no-token") {
        return (
            <PageSection background="dark">
                <div className="max-w-lg mx-auto text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-yellow-500/10 flex items-center justify-center">
                        <CircleWarningIcon className="w-8 h-8 stroke-yellow-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-4">{t("noToken.title")}</h1>
                    <p className="text-text-light mb-6">{t("noToken.description")}</p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-accent/10 border-2 border-accent rounded-btn text-white font-semibold hover:bg-accent/20 transition-colors"
                    >
                        {t("backHome")}
                    </Link>
                </div>
            </PageSection>
        );
    }

    // Loading state
    if (status === "loading") {
        return (
            <PageSection background="dark">
                <div className="max-w-lg mx-auto text-center py-12">
                    <div className="w-12 h-12 mx-auto mb-6 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
                    <p className="text-text-light">{t("loading")}</p>
                </div>
            </PageSection>
        );
    }

    // Error state
    if (status === "error") {
        return (
            <PageSection background="dark">
                <div className="max-w-lg mx-auto text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                        <CircleXIcon className="w-8 h-8 stroke-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-4">{t("error")}</h1>
                    <p className="text-text-light mb-6">{errorMessage}</p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-accent/10 border-2 border-accent rounded-btn text-white font-semibold hover:bg-accent/20 transition-colors"
                    >
                        {t("backHome")}
                    </Link>
                </div>
            </PageSection>
        );
    }

    // Success state - fully unsubscribed
    if (status === "success" || (subscriber && subscriber.lists.length === 0)) {
        return (
            <PageSection background="dark">
                <div className="max-w-lg mx-auto text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CircleCheckIcon className="w-8 h-8 stroke-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-4">{t("success.title")}</h1>
                    <p className="text-text-light mb-6">{t("success.description")}</p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-accent/10 border-2 border-accent rounded-btn text-white font-semibold hover:bg-accent/20 transition-colors"
                    >
                        {t("backHome")}
                    </Link>
                </div>
            </PageSection>
        );
    }

    // Ready state - show subscriptions
    return (
        <PageSection background="dark">
            <div className="max-w-lg mx-auto py-12">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">{t("title")}</h1>
                    <p className="text-text-light">
                        {t("description", { email: subscriber?.email })}
                    </p>
                </div>

                <div className="bg-surface rounded-card border border-border-light overflow-hidden">
                    <div className="p-4 border-b border-border-light">
                        <h2 className="text-lg font-semibold text-white">{t("yourSubscriptions")}</h2>
                    </div>

                    <div className="divide-y divide-border-light">
                        {subscriber?.lists.map((list) => (
                            <div key={list.slug} className="p-4 flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-white">{list.name}</h3>
                                    <p className="text-sm text-text-light">
                                        {t("subscribedSince", {
                                            date: new Date(list.subscribedAt).toLocaleDateString(),
                                        })}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleUnsubscribe(list.slug)}
                                    disabled={unsubscribing !== null}
                                    className="px-4 py-2 text-sm font-medium text-red-400 border border-red-400/30 rounded-btn hover:bg-red-400/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {unsubscribing === list.slug ? t("unsubscribing") : t("unsubscribe")}
                                </button>
                            </div>
                        ))}
                    </div>

                    {subscriber && subscriber.lists.length > 1 && (
                        <div className="p-4 border-t border-border-light bg-primary-light/50">
                            <button
                                onClick={() => handleUnsubscribe()}
                                disabled={unsubscribing !== null}
                                className="w-full py-3 text-sm font-semibold text-red-400 border border-red-400/30 rounded-btn hover:bg-red-400/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {unsubscribing === "all" ? t("unsubscribing") : t("unsubscribeAll")}
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-accent hover:underline">
                        {t("backHome")}
                    </Link>
                </div>
            </div>
        </PageSection>
    );
};

export default Unsubscribe;

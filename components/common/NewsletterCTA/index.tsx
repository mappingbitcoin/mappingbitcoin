"use client";

import { useTranslations } from "next-intl";
import NewsletterForm from "../NewsletterForm";

export default function NewsletterCTA() {
    const t = useTranslations("subscribe");

    return (
        <section className="py-20 px-6">
            <div className="max-w-md mx-auto text-center">
                <h2 className="text-white font-semibold text-xl mb-2">
                    {t("cta.title")}
                </h2>
                <p className="text-gray-400 mb-8">
                    {t("cta.subtitle")}
                </p>
                <NewsletterForm />
            </div>
        </section>
    );
}

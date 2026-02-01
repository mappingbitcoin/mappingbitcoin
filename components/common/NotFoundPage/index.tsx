"use client"

import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";

export default function NotFoundPage() {
    const t = useTranslations("notFound");

    return (
        <>
            <main className="p-24">
                <div className="text-center py-16 px-8 max-w-[600px] mx-auto">
                    <h1 className="text-[6rem] mb-4 text-accent">404</h1>
                    <h2 className="text-[2rem] mb-4">{t("title")}</h2>
                    <p className="text-lg text-gray-600 mb-8">{t("description")}</p>
                    <Button href="/" variant="solid" color="accent">
                        {t("cta")}
                    </Button>
                </div>
            </main>
        </>
    );
}

import { useTranslations } from "next-intl";
import {Link} from "@/i18n/navigation";
import { FAQSection } from "@/components/common";
import React, {JSX} from "react";

type RichTagMap = Record<string, (chunks: React.ReactNode) => JSX.Element>;

const tagMap: RichTagMap = {
    "link.create": chunks => <Link href="/places/create">{chunks}</Link>,
    "link.countries": chunks => <Link href="/countries">{chunks}</Link>
};

export default function MapFAQ() {
    const t = useTranslations("map.faq");

    const rawFaqs = t.raw("questions") as { question: string; answer: string }[];

    const faqs = rawFaqs.map(({ question, answer }, i) => {
        // Detect which tags exist in the answer string
        const usedTags = Object.keys(tagMap).filter(tag => answer.includes(`<${tag}>`));

        if (usedTags.length === 0) {
            return { question, answer };
        }

        const richAnswer = t.rich(`questions.${i}.answer`, Object.fromEntries(
            usedTags.map(tag => [tag, tagMap[tag]])
        ));

        return {
            question,
            answer: richAnswer
        };
    });

    return (
        <div style={{
                position: 'absolute',
                width: "1px",
                height: "1px",
                padding: 0,
                margin: "-1px",
                overflow: "hidden",
                clip:" rect(0, 0, 0, 0)",
                whiteSpace: "nowrap",
                border: 0
            }}>
            <FAQSection translationKey="map.faq" faqs={faqs} />
        </div>
    );
}

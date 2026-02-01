"use client";

import { useTranslations } from "next-intl";
import { ReactNode, useState } from "react";
import { ChevronDownIcon } from "@/assets/icons/ui";
import AccordionButton from "@/components/ui/AccordionButton";

type FAQEntry = {
    question: string;
    answer: string | ReactNode;
};

type FAQSectionProps = {
    translationKey: string; // e.g. 'merchants.faq'
    substitutions?: Record<string, string | number>;
    titleKey?: string; // default: 'title'
    faqs?: FAQEntry[]; // Optional override of FAQ entries
};

export default function FAQSection({
    translationKey,
    substitutions = {},
    titleKey = "title",
    faqs
}: FAQSectionProps) {
    const t = useTranslations(translationKey);
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const defaultFaqs = t.raw("questions") as FAQEntry[];
    const finalFaqs = faqs || defaultFaqs;
    const title = t(titleKey);

    const renderWithPlaceholders = (template: string): string => {
        return template.replace(/\{(\w+)\}/g, (_, key) =>
            substitutions[key] !== undefined ? String(substitutions[key]) : ""
        );
    };

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="w-full bg-background py-12 px-8 max-md:px-4">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-8">
                    <span className="inline-block text-accent text-sm font-semibold uppercase tracking-wider mb-2">
                        FAQ
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-text-dark">{title}</h2>
                </div>

                <div className="space-y-3">
                    {finalFaqs.map(({ question, answer }, i) => {
                        const renderedQ = renderWithPlaceholders(question);
                        const isStringAnswer = typeof answer === 'string';
                        const isOpen = openIndex === i;

                        return (
                            <div
                                key={i}
                                className="bg-surface rounded-card border border-border-light shadow-soft overflow-hidden transition-shadow duration-200 hover:shadow-medium"
                            >
                                <AccordionButton
                                    expanded={isOpen}
                                    expandIcon={<ChevronDownIcon className="w-5 h-5" />}
                                    onClick={() => toggleFaq(i)}
                                >
                                    {renderedQ}
                                </AccordionButton>

                                <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                                >
                                    <div className="px-4 pb-4 text-text text-sm leading-relaxed [&_a]:text-accent [&_a]:underline [&_a:hover]:text-accent-dark">
                                        {isStringAnswer ? (
                                            <div dangerouslySetInnerHTML={{ __html: renderWithPlaceholders(answer) }} />
                                        ) : (
                                            answer
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

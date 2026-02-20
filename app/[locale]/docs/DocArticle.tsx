'use client';

import { useEffect, useState } from "react";
import { Locale } from "@/i18n/types";
import { Link } from "@/i18n/navigation";
import { getAdjacentDocs, getDocBySlug } from "./docsConfig";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";

interface DocArticleProps {
    slug: string;
    locale: Locale;
}

export default function DocArticle({ slug, locale }: DocArticleProps) {
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const doc = getDocBySlug(slug);
    const { prev, next } = getAdjacentDocs(slug);

    useEffect(() => {
        setIsLoading(true);
        fetch(`/docs/${locale}/${slug}.md`)
            .then((res) => {
                if (!res.ok) throw new Error('Not found');
                return res.text();
            })
            .then((text) => {
                // Strip first H1 from content (we render title as H1 in component)
                const strippedContent = text.replace(/^#\s+.+\n+/, '');
                setContent(strippedContent);
                setIsLoading(false);
            })
            .catch(() => {
                setContent('This documentation page could not be found.');
                setIsLoading(false);
            });
    }, [slug, locale]);

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-10 bg-white/5 rounded w-2/3"></div>
                <div className="h-4 bg-white/5 rounded w-full"></div>
                <div className="h-4 bg-white/5 rounded w-5/6"></div>
                <div className="h-4 bg-white/5 rounded w-4/5"></div>
            </div>
        );
    }

    return (
        <div>
            {doc && (
                <>
                    <h1 className="text-3xl font-bold mb-4 text-white leading-tight">{doc.title}</h1>
                    <p className="text-gray-400 text-sm mb-6">{doc.description}</p>
                </>
            )}

            <article className="
                text-base leading-[1.8] text-gray-300 text-left

                [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-6 [&_h1]:text-white [&_h1]:leading-tight
                [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-white [&_h2]:leading-tight [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-white/10
                [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-white
                [&_h4]:text-base [&_h4]:font-medium [&_h4]:mt-4 [&_h4]:mb-2 [&_h4]:text-white

                [&_p]:mb-4 [&_p]:text-base [&_p]:leading-[1.75]

                [&_ul]:my-4 [&_ul]:pl-6 [&_ul]:list-disc
                [&_ol]:my-4 [&_ol]:pl-6 [&_ol]:list-decimal
                [&_li]:mb-2 [&_li]:text-base [&_li]:leading-[1.75] [&_li]:pl-1
                [&_li_p]:mb-2

                [&_blockquote]:border-l-4 [&_blockquote]:border-accent [&_blockquote]:pl-4 [&_blockquote]:pr-4 [&_blockquote]:py-2 [&_blockquote]:my-6 [&_blockquote]:bg-white/5 [&_blockquote]:rounded-r-lg [&_blockquote]:italic
                [&_blockquote_p]:mb-0 [&_blockquote_p]:text-sm

                [&_pre]:bg-[#0d1117] [&_pre]:text-gray-300 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:font-mono [&_pre]:text-sm [&_pre]:my-6 [&_pre]:border [&_pre]:border-white/10
                [&_code]:bg-white/10 [&_code]:py-0.5 [&_code]:px-1.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-sm [&_code]:text-accent
                [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-gray-300

                [&_a]:text-accent [&_a]:no-underline hover:[&_a]:underline [&_a]:transition-colors

                [&_hr]:border-0 [&_hr]:h-px [&_hr]:bg-white/10 [&_hr]:my-8

                [&_strong]:font-semibold [&_strong]:text-white
                [&_em]:italic

                [&_table]:w-full [&_table]:border-collapse [&_table]:my-6 [&_table]:text-sm [&_table]:text-left [&_table]:border [&_table]:border-white/10 [&_table]:rounded-lg [&_table]:overflow-hidden
                [&_thead]:bg-white/5
                [&_th]:px-4 [&_th]:py-3 [&_th]:border-b [&_th]:border-white/10 [&_th]:text-white [&_th]:font-medium [&_th]:text-left [&_th]:bg-white/5
                [&_td]:px-4 [&_td]:py-3 [&_td]:border-b [&_td]:border-white/5 [&_td]:text-gray-300
                [&_tbody_tr:last-child_td]:border-b-0
                [&_tr]:transition-colors hover:[&_tbody_tr]:bg-white/5
                [&_table_code]:text-xs [&_table_code]:bg-white/10 [&_table_code]:px-1.5 [&_table_code]:py-0.5 [&_table_code]:rounded

                max-md:[&_table]:block max-md:[&_table]:overflow-x-auto max-md:[&_table]:whitespace-nowrap
                max-md:[&_h1]:text-2xl
                max-md:[&_h2]:text-lg
                max-md:[&_h3]:text-base
            ">
                <ReactMarkdown remarkPlugins={[gfm]}>
                    {content}
                </ReactMarkdown>
            </article>

            {/* Navigation */}
            <nav className="flex justify-between items-center mt-12 pt-8 border-t border-white/10">
                {prev ? (
                    <Link
                        href={`/docs/${prev.slug}`}
                        className="group flex flex-col items-start"
                    >
                        <span className="text-xs text-gray-500 mb-1">Previous</span>
                        <span className="text-accent group-hover:underline flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            {prev.title}
                        </span>
                    </Link>
                ) : <div />}

                {next ? (
                    <Link
                        href={`/docs/${next.slug}`}
                        className="group flex flex-col items-end"
                    >
                        <span className="text-xs text-gray-500 mb-1">Next</span>
                        <span className="text-accent group-hover:underline flex items-center gap-2">
                            {next.title}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </span>
                    </Link>
                ) : <div />}
            </nav>
        </div>
    );
}

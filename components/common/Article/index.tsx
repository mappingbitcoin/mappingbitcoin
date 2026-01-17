"use client"

import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import React, {useMemo} from "react";
import WikiPreview from "../WikiPreview";
import VideoEmbed from "../VideoEmbed";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

const Article = ({content}: {content: string}) => {

    const components = useMemo(
        () => ({
            p: ({ children }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    : any) => {
                if (typeof children[0] === "string" && children[0].match(/(youtube\.com|youtu\.be|vimeo\.com)/)) {
                    return <VideoEmbed url={children[0]} />;
                }
                return <p>{children}</p>;
            },
            a: ({ href, children, ...props }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    : any) => {
                if (href.includes("youtube.com") || href.includes("youtu.be") || href.includes("vimeo.com")) {
                    return <VideoEmbed url={href} />;
                }
                if (href.includes("wikipedia.org/wiki/")) {
                    return <WikiPreview href={href}>{children}</WikiPreview>;
                }
                return <a href={href} {...props}>{children}</a>;
            },
        }),
        []
    );

    return (
        <article className="
            text-base leading-[1.8] text-text text-left

            [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-text-dark [&_h2]:leading-tight
            [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-text-dark
            [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:mt-6 [&_h4]:mb-2 [&_h4]:text-text-dark

            [&_p]:mb-5 [&_p]:text-[1.05rem] [&_p]:leading-[1.85]

            [&_ul]:my-5 [&_ul]:pl-6 [&_ul]:list-disc
            [&_ol]:my-5 [&_ol]:pl-6 [&_ol]:list-decimal
            [&_li]:mb-2.5 [&_li]:text-[1.05rem] [&_li]:leading-[1.75] [&_li]:pl-1
            [&_li_p]:mb-2

            [&_blockquote]:border-l-4 [&_blockquote]:border-accent [&_blockquote]:pl-5 [&_blockquote]:pr-4 [&_blockquote]:py-3 [&_blockquote]:my-6 [&_blockquote]:bg-accent-subtle [&_blockquote]:rounded-r-lg [&_blockquote]:italic [&_blockquote]:text-text
            [&_blockquote_p]:mb-0 [&_blockquote_p]:text-base

            [&_pre]:bg-primary [&_pre]:text-white [&_pre]:p-5 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:font-mono [&_pre]:text-sm [&_pre]:my-6
            [&_code]:bg-background-secondary [&_code]:py-0.5 [&_code]:px-1.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-sm [&_code]:text-accent
            [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-white

            [&_img]:max-w-full [&_img]:h-auto [&_img]:block [&_img]:mx-auto [&_img]:my-8 [&_img]:rounded-lg

            [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_a]:transition-colors [&_a]:duration-200 hover:[&_a]:text-accent-light

            [&_hr]:border-0 [&_hr]:h-px [&_hr]:bg-border [&_hr]:my-10

            [&_strong]:font-semibold [&_strong]:text-text-dark
            [&_em]:italic

            [&_table]:w-full [&_table]:border-collapse [&_table]:my-8 [&_table]:text-sm [&_table]:text-left [&_table]:bg-white [&_table]:shadow-soft [&_table]:rounded-lg [&_table]:overflow-hidden
            [&_th]:p-3 [&_th]:border-b [&_th]:border-border [&_th]:bg-primary [&_th]:text-white [&_th]:font-semibold [&_th]:text-left
            [&_td]:p-3 [&_td]:border-b [&_td]:border-border
            [&_tr:last-child_td]:border-b-0
            [&_tr:hover]:bg-background

            max-md:[&_table]:block max-md:[&_table]:overflow-x-auto max-md:[&_table]:whitespace-nowrap
            max-md:[&_h2]:text-xl
            max-md:[&_h3]:text-lg
            max-md:[&_p]:text-base
            max-md:[&_li]:text-base
        ">
            <ReactMarkdown
                remarkPlugins={[gfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={components}>
                {content}
            </ReactMarkdown>
        </article>
    )
}

export default Article

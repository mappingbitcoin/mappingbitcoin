import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getAdjacentPosts, getRelatedPosts, formatBlogDate, LOCALE_NAMES, type BlogPost } from "@/lib/blog/parser";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";

interface BlogArticleProps {
    slug: string;
    locale: string;
    post: BlogPost;
    availableLocales: string[];
}

export default function BlogArticle({ slug, locale, post, availableLocales }: BlogArticleProps) {
    const { prev, next } = getAdjacentPosts(slug, locale);
    const relatedPosts = getRelatedPosts(slug, locale, 3);
    const hasMultipleLanguages = availableLocales.length > 1;

    return (
        <div className="max-w-[720px] mx-auto">
            {/* Featured Image */}
            <div className="relative w-full aspect-[1200/630] rounded-lg overflow-hidden mb-8">
                <Image
                    src={post.featuredImage}
                    alt={post.featuredImageAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 720px) 100vw, 720px"
                    priority
                />
            </div>

            <div className="mb-8 pb-8 border-b border-white/10">
                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                    {post.title}
                </h1>

                {/* Tags and Language Switcher Row */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                            <span
                                key={tag}
                                className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-full"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Language Switcher */}
                    {hasMultipleLanguages && (
                        <div className="flex items-center gap-2">
                            <svg
                                className="w-4 h-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                                />
                            </svg>
                            <div className="flex gap-1">
                                {availableLocales.map((loc) => (
                                    <Link
                                        key={loc}
                                        href={`/${loc}/blog/${slug}`}
                                        className={`
                                            text-xs px-2 py-1 rounded transition-colors
                                            ${loc === locale
                                                ? 'bg-white/20 text-white font-medium'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                            }
                                        `}
                                        title={LOCALE_NAMES[loc] || loc.toUpperCase()}
                                    >
                                        {loc.toUpperCase()}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-gray-400 text-sm">
                    {formatBlogDate(post.date, locale)} · {post.author}
                </p>
            </div>

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
                    {post.content}
                </ReactMarkdown>
            </article>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
                <section className="mt-12 pt-8 border-t border-white/10">
                    <h2 className="text-lg font-semibold text-white mb-6">Related Posts</h2>
                    <div className="grid gap-4 sm:grid-cols-3">
                        {relatedPosts.map((relatedPost) => (
                            <Link
                                key={relatedPost.slug}
                                href={`/blog/${relatedPost.slug}`}
                                className="group block bg-white/5 rounded-lg overflow-hidden hover:bg-white/[0.07] transition-colors"
                            >
                                <div className="relative w-full aspect-[16/9]">
                                    <Image
                                        src={relatedPost.previewImage}
                                        alt={relatedPost.featuredImageAlt}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        sizes="(max-width: 640px) 100vw, 240px"
                                    />
                                </div>
                                <div className="p-3">
                                    <h3 className="text-sm font-medium text-white group-hover:text-accent transition-colors line-clamp-2">
                                        {relatedPost.title}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatBlogDate(relatedPost.date, locale)}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Navigation */}
            <nav className="flex justify-between items-center mt-12 pt-8 border-t border-white/10">
                {prev ? (
                    <Link
                        href={`/blog/${prev.slug}`}
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
                        href={`/blog/${next.slug}`}
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

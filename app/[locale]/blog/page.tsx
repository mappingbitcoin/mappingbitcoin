import { buildGeneratePageMetadata, getPageSeo } from "@/utils/SEOUtils";
import { Localized } from "@/i18n/types";
import Script from "next/script";
import { generateCanonical } from "@/i18n/seo";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { getAllBlogPosts, formatBlogDate } from "@/lib/blog/parser";
import { env } from "@/lib/Environment";
import { routing } from "@/i18n/routing";

export const revalidate = 3600; // ISR: revalidate every hour
export const generateMetadata = buildGeneratePageMetadata("blog");

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

interface BlogPageProps extends Localized {
    searchParams: Promise<{
        q?: string;
        category?: string;
    }>;
}

export default async function BlogPage({ params, searchParams }: BlogPageProps) {
    const { locale } = await getPageSeo("blog")({ params });
    const { q: searchQuery, category } = await searchParams;
    const canonical = generateCanonical("blog", locale);

    // Get all blog posts from markdown files
    let blogPosts = getAllBlogPosts(locale);

    // Filter by search query
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        blogPosts = blogPosts.filter(post =>
            post.title.toLowerCase().includes(query) ||
            post.description.toLowerCase().includes(query) ||
            post.tags.some(tag => tag.toLowerCase().includes(query))
        );
    }

    // Filter by category
    if (category) {
        blogPosts = blogPosts.filter(post =>
            post.tags.some(tag => tag.toLowerCase() === category.toLowerCase())
        );
    }

    // Featured post is the first one
    const featuredPost = blogPosts[0];
    const otherPosts = blogPosts.slice(1);

    // JSON-LD schemas
    const blogSchema = {
        "@context": "https://schema.org",
        "@type": "Blog",
        "@id": `${canonical}#blog`,
        "name": "MappingBitcoin Blog",
        "description": "Updates, insights, and announcements from the MappingBitcoin team",
        "url": canonical,
        "publisher": {
            "@type": "Organization",
            "name": "MappingBitcoin",
            "url": env.siteUrl,
            "logo": {
                "@type": "ImageObject",
                "url": `${env.siteUrl}/mapping-bitcoin-logo.svg`,
            },
        },
        "isPartOf": {
            "@type": "WebSite",
            "name": "MappingBitcoin",
            "url": env.siteUrl,
        },
        "blogPost": blogPosts.map((post) => ({
            "@type": "BlogPosting",
            "headline": post.title,
            "description": post.description,
            "datePublished": post.date,
            "url": `${env.siteUrl}/blog/${post.slug}`,
            "image": `${env.siteUrl}${post.ogImage}`,
            "author": {
                "@type": "Organization",
                "name": post.author,
            },
        })),
    };

    const collectionSchema = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "MappingBitcoin Blog",
        "description": "Updates, insights, and announcements from the MappingBitcoin team",
        "url": canonical,
        "mainEntity": {
            "@type": "ItemList",
            "numberOfItems": blogPosts.length,
            "itemListElement": blogPosts.map((post, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "url": `${env.siteUrl}/blog/${post.slug}`,
                "name": post.title,
            })),
        },
    };

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": env.siteUrl,
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Blog",
                "item": canonical,
            },
        ],
    };

    return (
        <>
            <Script
                id="blog-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(blogSchema),
                }}
            />
            <Script
                id="collection-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(collectionSchema),
                }}
            />
            <Script
                id="breadcrumb-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(breadcrumbSchema),
                }}
            />

            <div>
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Blog</h1>
                    <p className="text-gray-400">
                        Updates, insights, and announcements from the MappingBitcoin team.
                    </p>
                </div>

                {/* Active filters */}
                {(searchQuery || category) && (
                    <div className="mb-6 flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-400">Filtering by:</span>
                        {searchQuery && (
                            <span className="text-xs px-3 py-1 bg-white/10 text-white rounded-full">
                                &quot;{searchQuery}&quot;
                            </span>
                        )}
                        {category && (
                            <span className="text-xs px-3 py-1 bg-accent/20 text-accent rounded-full">
                                {category}
                            </span>
                        )}
                        <Link
                            href="/blog"
                            className="text-xs text-gray-400 hover:text-white ml-2"
                        >
                            Clear filters
                        </Link>
                    </div>
                )}

                {blogPosts.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400">No posts found.</p>
                        <Link href="/blog" className="text-accent hover:underline mt-2 inline-block">
                            View all posts
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Featured Post */}
                        {featuredPost && (
                            <article className="mb-12">
                                <Link href={`/blog/${featuredPost.slug}`} className="group block">
                                    <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden bg-white/5 mb-4">
                                        <Image
                                            src={featuredPost.featuredImage}
                                            alt={featuredPost.featuredImageAlt}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            sizes="(max-width: 1200px) 100vw, 900px"
                                            priority
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                        <div className="absolute bottom-0 left-0 right-0 p-6">
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {featuredPost.tags.slice(0, 3).map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="text-xs px-2 py-1 bg-accent/20 text-accent rounded-full backdrop-blur-sm"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                            <h2 className="text-2xl md:text-3xl font-bold text-white group-hover:text-accent transition-colors mb-2">
                                                {featuredPost.title}
                                            </h2>
                                            <p className="text-gray-300 text-sm md:text-base line-clamp-2 mb-2">
                                                {featuredPost.description}
                                            </p>
                                            <p className="text-gray-400 text-sm">
                                                {formatBlogDate(featuredPost.date)} · {featuredPost.author}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            </article>
                        )}

                        {/* Grid of other posts */}
                        {otherPosts.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {otherPosts.map((post) => (
                                    <article
                                        key={post.slug}
                                        className="group bg-white/5 rounded-lg overflow-hidden hover:bg-white/[0.07] transition-colors"
                                    >
                                        <Link href={`/blog/${post.slug}`} className="block">
                                            <div className="relative w-full aspect-[16/9] overflow-hidden">
                                                <Image
                                                    src={post.previewImage}
                                                    alt={post.featuredImageAlt}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                    sizes="(max-width: 768px) 100vw, 450px"
                                                />
                                            </div>
                                            <div className="p-4">
                                                <div className="flex flex-wrap gap-1.5 mb-2">
                                                    {post.tags.slice(0, 2).map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                                <h3 className="text-lg font-semibold text-white group-hover:text-accent transition-colors mb-2 line-clamp-2">
                                                    {post.title}
                                                </h3>
                                                <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                                                    {post.description}
                                                </p>
                                                <p className="text-gray-500 text-xs">
                                                    {formatBlogDate(post.date)}
                                                </p>
                                            </div>
                                        </Link>
                                    </article>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}

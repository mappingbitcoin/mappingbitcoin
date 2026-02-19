import BlogArticle from "../BlogArticle";
import { Locale } from "@/i18n/types";
import Script from "next/script";
import { generateCanonical } from "@/i18n/seo";
import { getBlogPost, getBlogPostMeta, getPostAvailableLocales, getBlogSlugs } from "@/lib/blog/parser";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { env } from "@/lib/Environment";
import { routing } from "@/i18n/routing";

export const revalidate = 3600; // ISR: revalidate every hour

export function generateStaticParams() {
    const params: { locale: string; slug: string }[] = [];

    for (const locale of routing.locales) {
        const slugs = getBlogSlugs(locale);
        for (const slug of slugs) {
            params.push({ locale, slug });
        }
    }

    return params;
}

interface BlogPostPageProps {
    params: Promise<{
        locale: Locale;
        slug: string;
    }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
    const { slug, locale } = await params;
    const post = getBlogPostMeta(slug, locale);

    if (!post) {
        return {
            title: "Post Not Found | MappingBitcoin Blog",
        };
    }

    const canonical = generateCanonical(`blog/${slug}`, locale);
    const ogImageUrl = `${env.siteUrl}${post.ogImage}`;
    const availableLocales = getPostAvailableLocales(slug);

    // Build hreflang alternate links for available translations
    const languages: Record<string, string> = {};
    for (const loc of availableLocales) {
        const localeUrl = generateCanonical(`blog/${slug}`, loc);
        languages[loc] = localeUrl;
    }
    // Add x-default pointing to the default locale version
    if (availableLocales.includes(routing.defaultLocale)) {
        languages['x-default'] = generateCanonical(`blog/${slug}`, routing.defaultLocale);
    }

    return {
        title: `${post.title} | MappingBitcoin Blog`,
        description: post.description,
        keywords: post.tags,
        authors: [{ name: post.author }],
        alternates: {
            canonical,
            languages,
        },
        openGraph: {
            title: post.title,
            description: post.description,
            type: "article",
            publishedTime: post.date,
            authors: [post.author],
            tags: post.tags,
            url: canonical,
            siteName: "MappingBitcoin",
            images: [
                {
                    url: ogImageUrl,
                    width: 1200,
                    height: 630,
                    alt: post.featuredImageAlt,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: post.title,
            description: post.description,
            images: [ogImageUrl],
        },
    };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const { slug, locale } = await params;
    const post = getBlogPost(slug, locale);
    const availableLocales = getPostAvailableLocales(slug);

    if (!post) {
        notFound();
    }

    const canonical = generateCanonical(`blog/${slug}`, locale);
    const ogImageUrl = `${env.siteUrl}${post.ogImage}`;

    // JSON-LD: BlogPosting schema
    const blogPostingSchema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "@id": `${canonical}#article`,
        "headline": post.title,
        "description": post.description,
        "datePublished": post.date,
        "dateModified": post.date,
        "author": {
            "@type": "Organization",
            "name": post.author,
            "url": env.siteUrl,
        },
        "publisher": {
            "@type": "Organization",
            "name": "MappingBitcoin",
            "url": env.siteUrl,
            "logo": {
                "@type": "ImageObject",
                "url": `${env.siteUrl}/mapping-bitcoin-logo.svg`,
            },
        },
        "image": {
            "@type": "ImageObject",
            "url": ogImageUrl,
            "width": 1200,
            "height": 630,
        },
        "url": canonical,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": canonical,
        },
        "isPartOf": {
            "@type": "Blog",
            "@id": `${env.siteUrl}/blog#blog`,
            "name": "MappingBitcoin Blog",
            "url": `${env.siteUrl}/blog`,
        },
        "keywords": post.tags.join(", "),
        "articleSection": "Technology",
        "inLanguage": locale,
    };

    // JSON-LD: BreadcrumbList schema
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
                "item": `${env.siteUrl}/blog`,
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": post.title,
                "item": canonical,
            },
        ],
    };

    return (
        <>
            <Script
                id="blogpost-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(blogPostingSchema),
                }}
            />
            <Script
                id="breadcrumb-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(breadcrumbSchema),
                }}
            />
            <BlogArticle slug={slug} locale={locale} post={post} availableLocales={availableLocales} />
        </>
    );
}

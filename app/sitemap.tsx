import { MetadataRoute } from "next";

import { env } from "@/lib/Environment";
import { allDocs } from "@/app/[locale]/docs/docsConfig";
import { getAllBlogPosts } from "@/lib/blog/parser";

export const revalidate = 3600; // revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticPages = ["contact", 'countries', 'privacy-policy', 'terms-and-conditions', 'verify-your-business', 'places/create', 'stats', 'verified-places'];

    // Generate docs pages
    const docsPages = allDocs.map((doc) => ({
        url: `${env.siteUrl}/docs/${doc.slug}`,
        lastModified: new Date().toISOString(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
    }));

    // Generate blog pages
    const blogPosts = getAllBlogPosts('en');
    const blogPages = blogPosts.map((post) => ({
        url: `${env.siteUrl}/blog/${post.slug}`,
        lastModified: new Date(post.date).toISOString(),
        changeFrequency: "monthly" as const,
        priority: 0.8,
    }));

    return [
        ...[{
            url: `${env.siteUrl}/`,
            lastModified: new Date(2026, 1, 1).toISOString(),
            changeFrequency: "weekly",
            priority: 1.0,
        }], ...[{
            url: `${env.siteUrl}/map`,
            lastModified: new Date().toISOString(),
            changeFrequency: "daily",
            priority: 1.0,
        }],
        ...staticPages.map((page) => ({
            url: `${env.siteUrl}/${page}`,
            lastModified: new Date(2026, 1, 1).toISOString(),
            changeFrequency: "monthly",
            priority: 0.9,
        })),
        // Docs index
        {
            url: `${env.siteUrl}/docs`,
            lastModified: new Date().toISOString(),
            changeFrequency: "weekly",
            priority: 0.9,
        },
        // Individual docs pages
        ...docsPages,
        // Blog index
        {
            url: `${env.siteUrl}/blog`,
            lastModified: new Date().toISOString(),
            changeFrequency: "weekly",
            priority: 0.9,
        },
        // Individual blog posts
        ...blogPages,
    ] as MetadataRoute.Sitemap;
}

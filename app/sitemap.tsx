import { MetadataRoute } from "next";

import { env } from "@/lib/Environment";
import { allDocs } from "@/app/[locale]/docs/docsConfig";
import { getAllBlogPosts } from "@/lib/blog/parser";
import { routing } from "@/i18n/routing";
import { generateCanonical } from "@/i18n/seo";

export const revalidate = 3600; // revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticPages = ["contact", 'countries', 'categories', 'privacy-policy', 'terms-and-conditions', 'verify-your-business', 'places/create', 'stats', 'verified-places'];
    const entries: MetadataRoute.Sitemap = [];

    for (const locale of routing.locales) {
        // Homepage
        entries.push({
            url: generateCanonical('', locale),
            lastModified: new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00'),
            changeFrequency: "weekly",
            priority: 1.0,
        });

        // Map
        entries.push({
            url: generateCanonical('map', locale),
            lastModified: new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00'),
            changeFrequency: "daily",
            priority: 1.0,
        });

        // Static pages
        for (const page of staticPages) {
            entries.push({
                url: generateCanonical(page, locale),
                lastModified: new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00'),
                changeFrequency: "monthly",
                priority: 0.9,
            });
        }

        // Docs index
        entries.push({
            url: generateCanonical('docs', locale),
            lastModified: new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00'),
            changeFrequency: "weekly",
            priority: 0.9,
        });

        // Individual docs pages
        for (const doc of allDocs) {
            entries.push({
                url: generateCanonical(`docs/${doc.slug}`, locale),
                lastModified: new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00'),
                changeFrequency: "weekly",
                priority: 0.8,
            });
        }

        // Blog index
        entries.push({
            url: generateCanonical('blog', locale),
            lastModified: new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00'),
            changeFrequency: "weekly",
            priority: 0.9,
        });

        // Blog posts for this locale
        const blogPosts = getAllBlogPosts(locale);
        for (const post of blogPosts) {
            entries.push({
                url: generateCanonical(`blog/${post.slug}`, locale),
                lastModified: new Date(post.date).toISOString().replace(/\.\d{3}Z$/, '+00:00'),
                changeFrequency: "monthly",
                priority: 0.8,
            });
        }
    }

    return entries;
}

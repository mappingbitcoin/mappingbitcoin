import { MetadataRoute } from "next";

import {env} from "@/lib/Environment";

export const revalidate = 3600; // revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticPages = ["contact", 'countries', 'privacy-policy', 'terms-and-conditions', 'verify-your-business', 'places/create'];

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
    ] as MetadataRoute.Sitemap;
}

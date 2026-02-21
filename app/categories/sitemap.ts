import { MetadataRoute } from "next";
import { env } from "@/lib/Environment";
import { getCategoryCache } from "@/app/api/cache/CategoryCache";

export const revalidate = 86400; // revalidate sitemap every 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const cache = await getCategoryCache();
    const subcategories = Object.keys(cache.subcategories);

    // Categories index page
    const categoriesIndex = {
        url: `${env.siteUrl}/categories`,
        lastModified: new Date().toISOString(),
        changeFrequency: "weekly" as const,
        priority: 0.9,
    };

    // Individual subcategory pages
    const subcategoryPages = subcategories.map((subcategory) => ({
        url: `${env.siteUrl}/categories/${subcategory}`,
        lastModified: new Date().toISOString(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
    }));

    return [categoriesIndex, ...subcategoryPages];
}

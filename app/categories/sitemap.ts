import { MetadataRoute } from "next";
import { env } from "@/lib/Environment";
import { getCategoryCache } from "@/app/api/cache/CategoryCache";

// Force dynamic rendering - data file only exists after deployment
export const dynamic = 'force-dynamic';
export const revalidate = 86400; // revalidate sitemap every 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Categories index page (always include)
    const categoriesIndex = {
        url: `${env.siteUrl}/categories`,
        lastModified: new Date().toISOString(),
        changeFrequency: "weekly" as const,
        priority: 0.9,
    };

    try {
        const cache = await getCategoryCache();
        const subcategories = Object.keys(cache.subcategories);

        // Individual subcategory pages
        const subcategoryPages = subcategories.map((subcategory) => ({
            url: `${env.siteUrl}/categories/${subcategory}`,
            lastModified: new Date().toISOString(),
            changeFrequency: "weekly" as const,
            priority: 0.7,
        }));

        return [categoriesIndex, ...subcategoryPages];
    } catch (error) {
        // Data file not available (e.g., during build), return minimal sitemap
        console.warn('Categories sitemap: Data not available, returning minimal sitemap');
        return [categoriesIndex];
    }
}

import { MetadataRoute } from "next";
import { env } from "@/lib/Environment";
import merchantSlugs from "@/data/merchant-slugs.json";

export const revalidate = 86400; // revalidate sitemap every 24 hours

type MerchantSlug = {
    type: "country" | "category" | "city";
    canonical: string;
    alternates: Record<string, string>;
};

export default function sitemap(): MetadataRoute.Sitemap {
    const countrySlugs = (merchantSlugs as MerchantSlug[])
        .filter((entry) => entry.type === "country")
        .map((entry) => entry.canonical);

    return countrySlugs.map((slug) => ({
        url: `${env.siteUrl}/${slug}`,
        lastModified: new Date().toISOString(),
        changeFrequency: "weekly",
        priority: 0.8,
    }));
}

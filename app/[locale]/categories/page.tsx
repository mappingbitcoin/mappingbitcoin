import Script from "next/script";
import { env } from "@/lib/Environment";
import { PLACE_CATEGORIES, PLACE_SUBTYPE_MAP, PlaceCategory } from "@/constants/PlaceCategories";
import { getCategoryCache } from "@/app/api/cache/CategoryCache";
import { buildGeneratePageMetadata } from "@/utils/SEOUtils";
import { getTranslations } from "next-intl/server";
import CategoriesClient from "./CategoriesClient";

export const generateMetadata = buildGeneratePageMetadata('categories');

// Generate category list for SEO
function generateCategoryList() {
    const categoriesData = PLACE_CATEGORIES["en"];
    return (Object.keys(PLACE_SUBTYPE_MAP) as PlaceCategory[])
        .filter((key) => key !== "geographical-areas")
        .map((key) => ({
            key,
            label: categoriesData[key]?.label || key.replace(/-/g, " "),
            count: PLACE_SUBTYPE_MAP[key].length,
        }));
}

export default async function CategoriesPage() {
    const t = await getTranslations("categories");
    const categoryList = generateCategoryList();
    const totalSubcategories = categoryList.reduce((sum, cat) => sum + cat.count, 0);

    // Get available subcategories from actual data
    let availableSubcategories: Set<string> = new Set();
    try {
        const cache = await getCategoryCache();
        availableSubcategories = new Set(Object.keys(cache.subcategories));
    } catch {
        // Data not available, show all subcategories
        availableSubcategories = new Set(
            (Object.keys(PLACE_SUBTYPE_MAP) as PlaceCategory[])
                .flatMap((key) => PLACE_SUBTYPE_MAP[key])
        );
    }

    // JSON-LD: ItemList schema for categories
    const itemListSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": t("jsonLd.categoriesName"),
        "description": t("jsonLd.categoriesDescription"),
        "numberOfItems": categoryList.length,
        "itemListElement": categoryList.map((cat, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": cat.label,
            "description": `${cat.count} types of ${cat.label.toLowerCase()} businesses accepting Bitcoin`,
            "url": `${env.siteUrl}/categories`
        }))
    };

    // JSON-LD: BreadcrumbList schema
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": t("breadcrumb.home"),
                "item": env.siteUrl
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": t("breadcrumb.categories"),
                "item": `${env.siteUrl}/categories`
            }
        ]
    };

    return (
        <>
            <Script
                id="itemlist-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
            />
            <Script
                id="breadcrumb-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            {/* Server-rendered SEO content for crawlers */}
            <div className="sr-only">
                <p>
                    {t("seo.intro", { count: categoryList.length, subcategoryCount: totalSubcategories })}
                </p>
                <h2>{t("seo.mainCategoriesTitle")}</h2>
                <ul>
                    {categoryList.map((cat) => (
                        <li key={cat.key}>
                            {cat.label} ({cat.count} types)
                        </li>
                    ))}
                </ul>
                <h2>{t("seo.popularTitle")}</h2>
                <p>{t("seo.popularDescription")}</p>
                <h2>{t("seo.findingTitle")}</h2>
                <p>{t("seo.findingDescription")}</p>
            </div>

            {/* Hero Section */}
            <section className="bg-primary pt-12 pb-6 mt-16">
                <div className="max-w-container mx-auto px-8 max-md:px-4 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        {t("title")}
                    </h1>
                    <p className="text-text-light text-lg max-w-2xl mx-auto">
                        {t("subtitle", { count: categoryList.length, subcategoryCount: availableSubcategories.size })}
                    </p>
                </div>
            </section>

            {/* Client Component */}
            <section className="bg-primary min-h-[60vh]">
                <CategoriesClient availableSubcategories={Array.from(availableSubcategories)} />
            </section>
        </>
    );
}

import { Metadata } from "next";
import { notFound } from "next/navigation";

import { env } from "@/lib/Environment";
import { getSubcategoryData } from "@/app/api/cache/CategoryCache";
import { PLACE_CATEGORIES, matchPlaceSubcategory, PlaceSubcategory } from "@/constants/PlaceCategories";
import { getTranslations } from "next-intl/server";
import { getLocalizedCountryCategorySlug, getLocalizedCityCategorySlug, getSubcategoryFromSlug, SUBCATEGORY_SLUGS_BY_LOCALE } from "@/utils/SlugUtils";
import { Locale } from "@/i18n/types";
import SubcategoryClient from "./SubcategoryClient";

type PageProps = {
    params: Promise<{ subcategory: string; locale: string }>;
};

// Convert slug to display label (e.g., "coffee-shops" -> "Coffee Shops")
function slugToLabel(slug: string): string {
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Resolve a subcategory param to internal key — handles both raw keys (corporate_office)
// and localized slugs (escritorios-corporativos)
function resolveSubcategoryKey(param: string): string {
    // Try as-is first (internal key like "corporate_office")
    const asKey = param as PlaceSubcategory;
    if (SUBCATEGORY_SLUGS_BY_LOCALE['en'][asKey]) return param;

    // Try reverse lookup from localized slug across all locales
    for (const loc of ['en', 'es', 'pt'] as const) {
        const found = getSubcategoryFromSlug(param, loc);
        if (found) return found;
    }

    // Fallback: return as-is
    return param;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { subcategory: subcategoryParam } = await params;
    const subcategory = resolveSubcategoryKey(subcategoryParam);
    const data = await getSubcategoryData(subcategory);

    if (!data) {
        return { title: "Category Not Found" };
    }

    // Get the plural label from the slug
    const pluralLabel = slugToLabel(data.pluralSlug);

    const title = `${pluralLabel} Accepting Bitcoin | Mapping Bitcoin`;
    const description = `Find ${pluralLabel.toLowerCase()} that accept Bitcoin in ${data.countries.length} countries. Browse ${data.totalCount} verified places on our Bitcoin map.`;
    const url = `${env.siteUrl}/categories/${subcategory}`;
    const image = `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`;

    return {
        title,
        description,
        keywords: [
            `bitcoin ${pluralLabel.toLowerCase()}`,
            `${pluralLabel.toLowerCase()} accept bitcoin`,
            `${pluralLabel.toLowerCase()} bitcoin payment`,
            `${pluralLabel.toLowerCase()} lightning network`,
            "bitcoin merchants",
            `spend bitcoin ${pluralLabel.toLowerCase()}`
        ],
        alternates: {
            canonical: url,
        },
        openGraph: {
            title,
            description,
            url,
            type: "website",
            siteName: "Mapping Bitcoin",
            images: [
                {
                    url: image,
                    width: 1200,
                    height: 630,
                    alt: `${pluralLabel} Accepting Bitcoin - Mapping Bitcoin`,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [image],
        },
    };
}

export default async function SubcategoryPage({ params }: PageProps) {
    const { subcategory: subcategoryParam, locale } = await params;
    const subcategory = resolveSubcategoryKey(subcategoryParam);
    const t = await getTranslations({ locale, namespace: "categories" });
    const data = await getSubcategoryData(subcategory);

    if (!data) {
        notFound();
    }

    // Get singular label for the subcategory
    const match = matchPlaceSubcategory(subcategory);
    const categoryInfo = PLACE_CATEGORIES[locale as keyof typeof PLACE_CATEGORIES] || PLACE_CATEGORIES["en"];
    const label = match
        ? categoryInfo[match.category]?.types?.[subcategory as keyof typeof categoryInfo[typeof match.category]["types"]] || subcategory.replace(/_/g, " ")
        : subcategory.replace(/_/g, " ");

    // Get the plural label — use locale-specific slug map for display
    const localePluralSlug = SUBCATEGORY_SLUGS_BY_LOCALE[locale as Locale]?.[subcategory as PlaceSubcategory]
        || SUBCATEGORY_SLUGS_BY_LOCALE['en'][subcategory as PlaceSubcategory]
        || subcategory.replace(/_/g, '-');
    const pluralLabel = slugToLabel(localePluralSlug);

    // Re-map country/city slugs to current locale
    const localizedData = {
        ...data,
        countries: data.countries.map(country => ({
            ...country,
            slug: getLocalizedCountryCategorySlug(country.name, subcategory as PlaceSubcategory, locale),
            cities: country.cities.map(city => ({
                ...city,
                slug: getLocalizedCityCategorySlug(country.name, city.name, subcategory as PlaceSubcategory, locale),
            })),
        })),
    };

    // JSON-LD: ItemList schema for countries in this subcategory
    const itemListSchema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": t("jsonLd.subcategoryName", { category: pluralLabel }),
        "description": t("jsonLd.subcategoryDescription", { category: pluralLabel.toLowerCase() }),
        "numberOfItems": localizedData.countries.length,
        "itemListElement": localizedData.countries.slice(0, 50).map((country, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": country.name,
            "description": `${country.count} ${pluralLabel.toLowerCase()} accepting Bitcoin in ${country.name}`,
            "url": `${env.siteUrl}/${country.slug}`
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
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": pluralLabel,
                "item": `${env.siteUrl}/categories/${subcategory}`
            }
        ]
    };

    return (
        <>
            <script
                id="itemlist-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
            />
            <script
                id="breadcrumb-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            {/* Hero Section */}
            <section className="bg-primary pt-12 pb-6 mt-16">
                <div className="max-w-container mx-auto px-8 max-md:px-4 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        {t("subcategory.title", { category: pluralLabel })}
                    </h1>
                    <p className="text-text-light text-lg max-w-2xl mx-auto">
                        {t("subcategory.subtitle", { count: data.totalCount, countries: data.countries.length })}
                    </p>
                </div>
            </section>

            {/* Server-rendered SEO content for crawlers */}
            <div className="sr-only">
                <p>
                    {t("seo.subcategory.intro", {
                        category: pluralLabel.toLowerCase(),
                        countries: data.countries.length,
                        count: data.totalCount
                    })}
                </p>
                <h2>{t("seo.subcategory.countriesTitle", { category: pluralLabel })}</h2>
                <ul>
                    {data.countries.slice(0, 20).map((country) => (
                        <li key={country.name}>
                            {country.name} ({country.count} places)
                        </li>
                    ))}
                </ul>
            </div>

            {/* Client Component */}
            <section className="bg-primary min-h-[60vh]">
                <SubcategoryClient
                    subcategory={subcategory}
                    label={label}
                    pluralLabel={pluralLabel}
                    data={localizedData}
                />
            </section>
        </>
    );
}

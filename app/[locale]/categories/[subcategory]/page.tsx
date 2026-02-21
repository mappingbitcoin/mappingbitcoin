import { Metadata } from "next";
import { notFound } from "next/navigation";
import { env } from "@/lib/Environment";
import { getSubcategoryData } from "@/app/api/cache/CategoryCache";
import { PLACE_CATEGORIES, matchPlaceSubcategory } from "@/constants/PlaceCategories";
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { subcategory } = await params;
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
    const { subcategory } = await params;
    const data = await getSubcategoryData(subcategory);

    if (!data) {
        notFound();
    }

    // Get singular label for the subcategory
    const match = matchPlaceSubcategory(subcategory);
    const categoryInfo = PLACE_CATEGORIES["en"];
    const label = match
        ? categoryInfo[match.category]?.types?.[subcategory as keyof typeof categoryInfo[typeof match.category]["types"]] || subcategory.replace(/_/g, " ")
        : subcategory.replace(/_/g, " ");

    // Get the plural label from the slug (e.g., "cafes", "restaurants")
    const pluralLabel = slugToLabel(data.pluralSlug);

    return (
        <>
            {/* Server-rendered SEO content for crawlers */}
            <div className="sr-only">
                <p>
                    Find {pluralLabel.toLowerCase()} that accept Bitcoin payments in {data.countries.length} countries around the world.
                    Our directory includes {data.totalCount} verified places where you can pay with Bitcoin or Lightning.
                </p>
                <h2>Countries with {pluralLabel}</h2>
                <ul>
                    {data.countries.slice(0, 20).map((country) => (
                        <li key={country.name}>
                            {country.name} ({country.count} places)
                        </li>
                    ))}
                </ul>
            </div>

            {/* Hero Section */}
            <section className="bg-primary pt-12 pb-6">
                <div className="max-w-container mx-auto px-8 max-md:px-4 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        {pluralLabel} Accepting Bitcoin
                    </h1>
                    <p className="text-text-light text-lg max-w-2xl mx-auto">
                        {data.totalCount} places in {data.countries.length} countries accept Bitcoin
                    </p>
                </div>
            </section>

            {/* Client Component */}
            <section className="bg-primary min-h-[60vh]">
                <SubcategoryClient
                    subcategory={subcategory}
                    label={label}
                    pluralLabel={pluralLabel}
                    data={data}
                />
            </section>
        </>
    );
}

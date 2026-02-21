import { Metadata } from "next";
import { env } from "@/lib/Environment";
import { PLACE_CATEGORIES, PLACE_SUBTYPE_MAP, PlaceCategory } from "@/constants/PlaceCategories";
import CategoriesClient from "./CategoriesClient";

const title = "Bitcoin Business Categories | Mapping Bitcoin";
const description = "Browse all categories of businesses that accept Bitcoin payments. Find restaurants, cafes, hotels, shops, and services accepting Bitcoin and Lightning.";
const url = `${env.siteUrl}/categories`;
const image = `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`;

export const metadata: Metadata = {
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
                alt: "Bitcoin Business Categories - Mapping Bitcoin",
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

export default function CategoriesPage() {
    const categoryList = generateCategoryList();
    const totalSubcategories = categoryList.reduce((sum, cat) => sum + cat.count, 0);

    return (
        <>
            {/* Server-rendered SEO content for crawlers */}
            <div className="sr-only">
                <p>
                    Mapping Bitcoin organizes Bitcoin-accepting businesses into {categoryList.length} main categories
                    with over {totalSubcategories} specific business types. Whether you&apos;re looking for
                    restaurants, hotels, retail stores, or professional services that accept Bitcoin, our
                    comprehensive directory helps you find exactly what you need.
                </p>
                <h2>Main Business Categories</h2>
                <ul>
                    {categoryList.map((cat) => (
                        <li key={cat.key}>
                            {cat.label} ({cat.count} types)
                        </li>
                    ))}
                </ul>
                <h2>Popular Categories for Bitcoin Payments</h2>
                <p>
                    Food and drink establishments, including restaurants, cafes, and bars, are among the most
                    common places accepting Bitcoin. Shopping locations like grocery stores, electronics
                    retailers, and clothing boutiques also frequently accept cryptocurrency. The services
                    sector, from hair salons to professional consultants, continues to grow in Bitcoin adoption.
                </p>
                <h2>Finding Bitcoin-Accepting Businesses</h2>
                <p>
                    Use our interactive map to discover Bitcoin merchants near you, or browse by country to
                    see regional adoption. Each business listing includes payment details, showing whether
                    they accept Lightning Network payments, on-chain Bitcoin, or both.
                </p>
            </div>

            {/* Hero Section */}
            <section className="bg-primary pt-12 pb-6">
                <div className="max-w-container mx-auto px-8 max-md:px-4 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Bitcoin Business Categories
                    </h1>
                    <p className="text-text-light text-lg max-w-2xl mx-auto">
                        Browse {categoryList.length} categories and over {totalSubcategories} types of businesses
                        that accept Bitcoin payments worldwide.
                    </p>
                </div>
            </section>

            {/* Client Component */}
            <section className="bg-primary min-h-[60vh]">
                <CategoriesClient />
            </section>
        </>
    );
}

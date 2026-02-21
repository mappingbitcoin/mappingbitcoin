import { Metadata } from "next";
import { env } from "@/lib/Environment";
import StatsClient from "./StatsClient";

const title = "Bitcoin Merchant Statistics | Mapping Bitcoin";
const description = "Explore global Bitcoin adoption statistics. See the growth of Bitcoin-accepting merchants, top countries, categories, and verification trends.";
const url = `${env.siteUrl}/stats`;
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
                alt: "Bitcoin Merchant Statistics - Mapping Bitcoin",
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

export default function StatsPage() {
    return (
        <>
            {/* Server-rendered SEO content for crawlers */}
            <div className="sr-only">
                <h1>Bitcoin Merchant Statistics</h1>
                <p>
                    Track global Bitcoin adoption with comprehensive statistics and analytics.
                    Mapping Bitcoin provides real-time data on Bitcoin-accepting merchants worldwide,
                    helping you understand the growth of the Bitcoin economy.
                </p>
                <h2>Global Bitcoin Merchant Data</h2>
                <p>
                    Our statistics dashboard shows the total number of Bitcoin-accepting businesses,
                    geographic distribution across countries, and growth trends over time.
                    Monitor how Bitcoin adoption is spreading in different regions and business categories.
                </p>
                <h2>Categories of Bitcoin-Accepting Businesses</h2>
                <p>
                    Explore Bitcoin acceptance across various business categories including restaurants,
                    cafes, hotels, bars, retail stores, professional services, and more.
                    See which industries are leading Bitcoin adoption.
                </p>
                <h2>Verified Bitcoin Merchants</h2>
                <p>
                    Our verification system ensures accurate and up-to-date information about
                    Bitcoin-accepting businesses. Track the growth of verified merchants and
                    trusted Bitcoin payment locations.
                </p>
                <h2>Bitcoin Adoption Trends</h2>
                <p>
                    View monthly growth charts showing how Bitcoin merchant adoption has evolved.
                    Analyze cumulative growth patterns and identify emerging markets for Bitcoin payments.
                </p>
            </div>
            <StatsClient />
        </>
    );
}

import { Metadata } from "next";
import { env } from "@/lib/Environment";
import MyVerificationsClient from "./MyVerificationsClient";

const title = "My Verifications | Mapping Bitcoin";
const description = "View and manage your Bitcoin venue verification requests. Track the status of your business ownership claims on Mapping Bitcoin.";
const url = `${env.siteUrl}/my-verifications`;
const image = `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`;

export const metadata: Metadata = {
    title,
    description,
    robots: { index: false, follow: true }, // User-specific page
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
                alt: "My Verifications - Mapping Bitcoin",
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

export default function MyVerificationsPage() {
    return <MyVerificationsClient />;
}

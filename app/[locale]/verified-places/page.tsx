import { Metadata } from "next";
import { env } from "@/lib/Environment";
import VerifiedPlacesClient from "./VerifiedPlacesClient";

const title = "Verified Bitcoin Places | Mapping Bitcoin";
const description = "Browse verified Bitcoin-accepting businesses worldwide. Each merchant has been verified by its owner through email or domain verification.";
const url = `${env.siteUrl}/verified-places`;
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
                alt: "Verified Bitcoin Places - Mapping Bitcoin",
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

export default function VerifiedPlacesPage() {
    return <VerifiedPlacesClient />;
}

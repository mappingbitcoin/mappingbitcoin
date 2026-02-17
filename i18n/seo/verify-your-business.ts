import { env } from "@/lib/Environment";
import { generateCanonical } from "./utils";
import type { SEOModule } from "./types";

export type VerifyYourBusinessPageKey = 'verify-your-business';

const verifyYourBusinessSeo: SEOModule<VerifyYourBusinessPageKey> = {
    'verify-your-business': {
        en: {
            title: "Verify Your Business | Mapping Bitcoin",
            description: "Prove ownership of your Bitcoin-accepting business on Mapping Bitcoin. Learn about our transparent verification process using email or domain verification.",
            keywords: [
                "verify Bitcoin business",
                "claim business listing",
                "Bitcoin merchant verification",
                "prove business ownership",
                "Mapping Bitcoin verification",
                "business verification"
            ],
            openGraph: {
                title: "Verify Your Business | Mapping Bitcoin",
                description: "Prove ownership of your Bitcoin-accepting business on Mapping Bitcoin. Learn about our transparent verification process.",
                url: generateCanonical('verify-your-business', 'en'),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Verify Your Business | Mapping Bitcoin",
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Verify Your Business | Mapping Bitcoin",
                description: "Prove ownership of your Bitcoin-accepting business on Mapping Bitcoin. Learn about our transparent verification process.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
    },
};

export default verifyYourBusinessSeo;

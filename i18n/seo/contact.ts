import { env } from "@/lib/Environment";
import { generateCanonical } from "./utils";
import type { SEOModule } from "./types";

export type ContactPageKey = 'contact';

const contactSeo: SEOModule<ContactPageKey> = {
    contact: {
        en: {
            title: "Contact | Mapping Bitcoin",
            description: "Mapping Bitcoin is an open-source platform for discovering, learning, and using Bitcoin. Contact us for collaboration, questions, or feedback.",
            keywords: [
                "contact Bitcoin",
                "Bitcoin help",
                "Bitcoin support",
                "Mapping Bitcoin contact",
                "connect Bitcoin project"
            ],
            openGraph: {
                title: "Contact | Mapping Bitcoin",
                description: "Mapping Bitcoin is an open-source platform for discovering, learning, and using Bitcoin. Contact us for collaboration, questions, or feedback.",
                url: generateCanonical('contact', 'en'),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Contact | Mapping Bitcoin",
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Contact | Mapping Bitcoin",
                description: "Mapping Bitcoin is an open-source platform for discovering, learning, and using Bitcoin. Contact us for collaboration, questions, or feedback.",
                images: [`${env.siteUrl}/assets/opengraph/mapping-bitcoin-preview.webp`]
            }
        },
    },
};

export default contactSeo;

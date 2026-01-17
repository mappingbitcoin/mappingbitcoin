import { env } from "@/lib/Environment";
import { generateCanonical } from "./utils";
import type { SEOModule } from "./types";

export type ContactPageKey = 'contact';

const contactSeo: SEOModule<ContactPageKey> = {
    contact: {
        en: {
            title: "Contact | MappingBitcoin.com",
            description: "MappingBitcoin.com is an open-source platform for discovering, learning, and using Bitcoin. Contact us for collaboration, questions, or feedback.",
            keywords: [
                "contact Bitcoin",
                "Bitcoin help",
                "Bitcoin support",
                "MappingBitcoin contact",
                "connect Bitcoin project"
            ],
            openGraph: {
                title: "Contact | MappingBitcoin.com",
                description: "MappingBitcoin.com is an open-source platform for discovering, learning, and using Bitcoin. Contact us for collaboration, questions, or feedback.",
                url: generateCanonical('contact', 'en'),
                type: "website",
                images: [
                    {
                        url: `${env.siteUrl}/assets/opengraph/wab-contact.webp`,
                        width: 1200,
                        height: 630,
                        alt: "Contact | MappingBitcoin.com",
                    }
                ]
            },
            twitter: {
                card: "summary_large_image",
                title: "Contact | MappingBitcoin.com",
                description: "MappingBitcoin.com is an open-source platform for discovering, learning, and using Bitcoin. Contact us for collaboration, questions, or feedback.",
                images: [`${env.siteUrl}/assets/opengraph/wab-contact.webp`]
            }
        },
    },
};

export default contactSeo;

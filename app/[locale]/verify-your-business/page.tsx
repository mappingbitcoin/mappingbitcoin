import { Metadata } from "next";
import Script from "next/script";
import VerifyYourBusinessContent from "./VerifyYourBusinessContent";

export const metadata: Metadata = {
    title: "Verify Your Business | MappingBitcoin.com",
    description: "Prove ownership of your Bitcoin-accepting business on MappingBitcoin. Learn about our transparent verification process using email or domain verification.",
    openGraph: {
        title: "Verify Your Business | MappingBitcoin.com",
        description: "Prove ownership of your Bitcoin-accepting business on MappingBitcoin. Learn about our transparent verification process.",
        type: "website",
    },
};

export default function VerifyYourBusinessPage() {
    return (
        <>
            <Script
                id="verify-business-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebPage",
                        "name": "Verify Your Business",
                        "description": "Learn how to verify ownership of your Bitcoin-accepting business on MappingBitcoin.com",
                        "url": "https://mappingbitcoin.com/verify-your-business",
                        "isPartOf": {
                            "@type": "WebSite",
                            "name": "MappingBitcoin.com",
                            "url": "https://mappingbitcoin.com/"
                        }
                    }),
                }}
            />
            <Script
                id="breadcrumb-jsonld"
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        "itemListElement": [
                            {
                                "@type": "ListItem",
                                "position": 1,
                                "name": "Home",
                                "item": "https://mappingbitcoin.com/"
                            },
                            {
                                "@type": "ListItem",
                                "position": 2,
                                "name": "Verify Your Business",
                                "item": "https://mappingbitcoin.com/verify-your-business"
                            }
                        ]
                    }),
                }}
            />
            <VerifyYourBusinessContent />
        </>
    );
}

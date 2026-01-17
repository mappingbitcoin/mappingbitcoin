import React from "react";
import Contact from "@/app/[locale]/contact/Contact";
import {buildGeneratePageMetadata, getPageSeo} from "@/utils/SEOUtils";
import {Localized} from "@/i18n/types";
import {generateCanonical} from "@/i18n/seo";
import Script from "next/script";

export const generateMetadata = buildGeneratePageMetadata('contact')

const ContactPage = async ({params}: Localized) => {
    const {metadata,locale} = await getPageSeo('contact')({params})

    return (
        <>
            <Script
              id="json-ld"
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "ContactPage",
                  name: metadata.title,
                  description: metadata.description,
                  url: generateCanonical("contact", locale),
                  contactPoint: [
                    {
                      "@type": "ContactPoint",
                      contactType: "General Inquiries",
                      email: "satoshi@mappingbitcoin.com",
                      url: generateCanonical("contact", locale),
                    },
                    {
                      "@type": "ContactPoint",
                      contactType: "Partnerships",
                      email: "partners@mappingbitcoin.com",
                    },
                    {
                      "@type": "ContactPoint",
                      contactType: "Media & Press",
                      email: "media@mappingbitcoin.com",
                    },
                  ],
                }),
              }}
            />
            <Contact />
        </>);
};

export default ContactPage;

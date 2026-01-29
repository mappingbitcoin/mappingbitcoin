import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
    title: "Verify Your Business | MappingBitcoin.com",
    description: "Prove ownership of your Bitcoin-accepting business on MappingBitcoin. Learn about our transparent verification process using email or domain verification.",
    openGraph: {
        title: "Verify Your Business | MappingBitcoin.com",
        description: "Prove ownership of your Bitcoin-accepting business on MappingBitcoin. Learn about our transparent verification process.",
        type: "website",
    },
};

const VerifyYourBusinessPage = () => {
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

            <main className="bg-[#0D0D0D] min-h-screen">
                {/* Hero Section */}
                <section className="py-16 md:py-24 px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-orange-500/10 flex items-center justify-center">
                            <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
                            Verify Your Business
                        </h1>
                        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                            Claim and verify your listing on MappingBitcoin to build trust with customers and unlock additional features.
                        </p>
                    </div>
                </section>

                {/* Why Verify Section */}
                <section className="py-12 px-6 border-t border-white/10">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-8 text-center">
                            Why Verify?
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-[#1A1A1A] border border-white/10 rounded-xl">
                                <div className="w-10 h-10 mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Build Trust</h3>
                                <p className="text-gray-400 text-sm">
                                    A verified badge shows customers that your business has been confirmed as legitimate.
                                </p>
                            </div>
                            <div className="p-6 bg-[#1A1A1A] border border-white/10 rounded-xl">
                                <div className="w-10 h-10 mb-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Manage Your Listing</h3>
                                <p className="text-gray-400 text-sm">
                                    Update your business information, respond to reviews, and keep details accurate.
                                </p>
                            </div>
                            <div className="p-6 bg-[#1A1A1A] border border-white/10 rounded-xl">
                                <div className="w-10 h-10 mb-4 rounded-full bg-orange-500/10 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Stand Out</h3>
                                <p className="text-gray-400 text-sm">
                                    Verified businesses appear more prominently in search results.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Verification Methods Section */}
                <section className="py-16 px-6 bg-[#111111]">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4 text-center">
                            Verification Methods
                        </h2>
                        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
                            Choose the method that works best for you. Both options are free and secure.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Email Verification */}
                            <div className="p-8 bg-[#1A1A1A] border border-white/10 rounded-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-white">Email Verification</h3>
                                </div>

                                <p className="text-gray-400 mb-6">
                                    Verify by receiving a code at your business email address listed on OpenStreetMap.
                                </p>

                                <div className="space-y-4 mb-6">
                                    <h4 className="text-sm font-semibold text-white uppercase tracking-wide">What you need:</h4>
                                    <ul className="space-y-2 text-gray-400 text-sm">
                                        <li className="flex items-start gap-2">
                                            <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Access to the email address listed on your venue
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            A Nostr account to link the verification to your identity
                                        </li>
                                    </ul>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-white uppercase tracking-wide">How it works:</h4>
                                    <ol className="space-y-3 text-gray-400 text-sm">
                                        <li className="flex items-start gap-3">
                                            <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-semibold flex-shrink-0">1</span>
                                            Find your business on MappingBitcoin and click "Verify"
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-semibold flex-shrink-0">2</span>
                                            Log in with your Nostr account
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-semibold flex-shrink-0">3</span>
                                            We send a 6-digit code to your business email
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-semibold flex-shrink-0">4</span>
                                            Enter the code to complete verification
                                        </li>
                                    </ol>
                                </div>
                            </div>

                            {/* Domain Verification */}
                            <div className="p-8 bg-[#1A1A1A] border border-white/10 rounded-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                                        <svg className="w-6 h-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-white">Domain Verification</h3>
                                </div>

                                <p className="text-gray-400 mb-6">
                                    Verify by adding a DNS TXT record to your website domain.
                                </p>

                                <div className="space-y-4 mb-6">
                                    <h4 className="text-sm font-semibold text-white uppercase tracking-wide">What you need:</h4>
                                    <ul className="space-y-2 text-gray-400 text-sm">
                                        <li className="flex items-start gap-2">
                                            <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Access to your domain&apos;s DNS settings
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            A Nostr account to link the verification to your identity
                                        </li>
                                    </ul>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-white uppercase tracking-wide">How it works:</h4>
                                    <ol className="space-y-3 text-gray-400 text-sm">
                                        <li className="flex items-start gap-3">
                                            <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-semibold flex-shrink-0">1</span>
                                            Find your business on MappingBitcoin and click "Verify"
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-semibold flex-shrink-0">2</span>
                                            Log in with your Nostr account
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-semibold flex-shrink-0">3</span>
                                            Copy the unique TXT record we provide
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-semibold flex-shrink-0">4</span>
                                            Add it to your domain&apos;s DNS settings
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-semibold flex-shrink-0">5</span>
                                            Click &quot;Verify&quot; once DNS propagates (usually 5-30 minutes)
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Transparency Section */}
                <section className="py-16 px-6">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-8 text-center">
                            Our Commitment to Transparency
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-[#1A1A1A] border border-white/10 rounded-xl">
                                <h3 className="text-lg font-semibold text-white mb-3">Open Source</h3>
                                <p className="text-gray-400 text-sm">
                                    Our verification system is open source. Anyone can review the code and verify how we handle the verification process.
                                </p>
                            </div>
                            <div className="p-6 bg-[#1A1A1A] border border-white/10 rounded-xl">
                                <h3 className="text-lg font-semibold text-white mb-3">Decentralized Identity</h3>
                                <p className="text-gray-400 text-sm">
                                    Verifications are linked to your Nostr public key, giving you sovereign control over your business identity.
                                </p>
                            </div>
                            <div className="p-6 bg-[#1A1A1A] border border-white/10 rounded-xl">
                                <h3 className="text-lg font-semibold text-white mb-3">No Central Authority</h3>
                                <p className="text-gray-400 text-sm">
                                    We don&apos;t hold custody of your identity. Your Nostr keys are yours, and verification proves ownership without intermediaries.
                                </p>
                            </div>
                            <div className="p-6 bg-[#1A1A1A] border border-white/10 rounded-xl">
                                <h3 className="text-lg font-semibold text-white mb-3">Cryptographic Proof</h3>
                                <p className="text-gray-400 text-sm">
                                    All verifications are recorded with cryptographic signatures that can be independently verified.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="py-16 px-6 bg-[#111111]">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-8 text-center">
                            Frequently Asked Questions
                        </h2>
                        <div className="space-y-4">
                            <div className="p-6 bg-[#1A1A1A] border border-white/10 rounded-xl">
                                <h3 className="text-lg font-semibold text-white mb-2">What is Nostr?</h3>
                                <p className="text-gray-400 text-sm">
                                    Nostr is a decentralized protocol for social networking. It uses cryptographic key pairs for identity, meaning you own your account without relying on any company. We use Nostr for verification because it aligns with Bitcoin&apos;s values of self-sovereignty.
                                </p>
                            </div>
                            <div className="p-6 bg-[#1A1A1A] border border-white/10 rounded-xl">
                                <h3 className="text-lg font-semibold text-white mb-2">How long does verification take?</h3>
                                <p className="text-gray-400 text-sm">
                                    Email verification is instant once you enter the code. Domain verification depends on DNS propagation, typically 5-30 minutes, but can take up to 48 hours in some cases.
                                </p>
                            </div>
                            <div className="p-6 bg-[#1A1A1A] border border-white/10 rounded-xl">
                                <h3 className="text-lg font-semibold text-white mb-2">Can I verify multiple businesses?</h3>
                                <p className="text-gray-400 text-sm">
                                    Yes, a single Nostr account can verify multiple businesses, as long as you can prove ownership of each one through email or domain verification.
                                </p>
                            </div>
                            <div className="p-6 bg-[#1A1A1A] border border-white/10 rounded-xl">
                                <h3 className="text-lg font-semibold text-white mb-2">Why do you block common email providers?</h3>
                                <p className="text-gray-400 text-sm">
                                    For domain verification via email, we only accept custom email domains (like you@yourbusiness.com). This ensures the verification actually proves domain ownership. However, if your venue has an email listed (even Gmail), you can still use email code verification.
                                </p>
                            </div>
                            <div className="p-6 bg-[#1A1A1A] border border-white/10 rounded-xl">
                                <h3 className="text-lg font-semibold text-white mb-2">Is verification free?</h3>
                                <p className="text-gray-400 text-sm">
                                    Yes, verification is completely free. We believe in open access to the Bitcoin economy.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-16 md:py-24 px-6 bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-orange-500/10 border-y border-orange-500/20">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
                            Ready to verify your business?
                        </h2>
                        <p className="text-gray-400 mb-8">
                            Find your listing on the map and click the Verify button to get started.
                        </p>
                        <Link
                            href="/map"
                            className="inline-flex items-center justify-center px-8 py-4 bg-orange-500/10 border border-orange-500 hover:bg-orange-500/20 text-white font-semibold rounded-lg transition-colors"
                        >
                            Find your business
                        </Link>
                    </div>
                </section>
            </main>
        </>
    );
};

export default VerifyYourBusinessPage;

import {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const securityHeaders = [
    {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
    },
    {
        key: 'X-Frame-Options',
        value: 'DENY',
    },
    {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
    },
    {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
    },
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(self)',
    },
    {
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains',
    },
    {
        key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; font-src 'self' https://fonts.gstatic.com; frame-src https://www.google.com; media-src 'self' https:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self';",
    },
];

const nextConfig: NextConfig = {
    poweredByHeader: false,
    typescript: {
        ignoreBuildErrors: process.env.SKIP_TYPE_CHECK === 'true',
    },
    experimental: {
        optimizePackageImports: ['lodash', 'framer-motion', 'react-icons', 'recharts', 'i18n-iso-countries', 'nostr-tools', '@noble/curves', '@noble/hashes'],
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'cdn.jsdelivr.net',
            },
            {
                protocol: 'https',
                hostname: 'drive.google.com',
                pathname: '/uc',
            },
        ],
    },
    async redirects() {
        return [
            {
                source: '/bitcoin-shops-in-united-states-of-america',
                destination: '/bitcoin-shops-in-united-states',
                permanent: true,
            },
            {
                source: '/bitcoin-shops-in-czech-republic',
                destination: '/bitcoin-shops-in-czechia',
                permanent: true,
            },
            {
                source: '/:locale/bitcoin-shops-in-united-states-of-america',
                destination: '/:locale/bitcoin-shops-in-united-states',
                permanent: true,
            },
            {
                source: '/:locale/bitcoin-shops-in-czech-republic',
                destination: '/:locale/bitcoin-shops-in-czechia',
                permanent: true,
            },
            // Redirect old comercios (wrong prefix) city/state slugs to correct locais/lugares
            {
                source: '/es/comercios-bitcoin-en-:slug(.*)',
                destination: '/es/lugares-bitcoin-en-:slug',
                permanent: true,
            },
            {
                source: '/pt/comercios-bitcoin-em-:slug(.*)',
                destination: '/pt/locais-bitcoin-em-:slug',
                permanent: true,
            },
        ];
    },
    async headers() {
        return [
            {
                // Apply security headers to all routes
                source: '/:path*',
                headers: securityHeaders,
            },
        ];
    },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);

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
];

const nextConfig: NextConfig = {
    poweredByHeader: false,
    typescript: {
        ignoreBuildErrors: ['production', 'healthcheck'].includes(process.env.NODE_ENV),
    },
    experimental: {
        optimizePackageImports: ['lodash', 'framer-motion', 'react-icons'],
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

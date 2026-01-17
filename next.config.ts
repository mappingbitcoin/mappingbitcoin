import {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

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
                hostname: 'maps.googleapis.com',
                pathname: '/maps/api/place/photo',
            },
            {
                protocol: 'https',
                hostname: 'drive.google.com',
                pathname: '/uc',
            },
        ],
    },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);

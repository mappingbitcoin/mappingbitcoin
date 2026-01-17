const isDev = process.env.NODE_ENV === 'development';

export const env = {
    // Use localhost in development, production URL otherwise.
    // Can be overridden with NEXT_PUBLIC_SITE_URL env variable.
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || (isDev ? 'http://localhost:3000' : 'https://mappingbitcoin.com')
}

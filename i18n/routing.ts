import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: ['en'],

    // Used when no locale matches
    defaultLocale: 'en',

    // Only add locale prefix for non-default locales
    // English: /map (no prefix)
    // Spanish (future): /es/map (with prefix)
    localePrefix: 'as-needed'
});

import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
    matcher: [
        // Match all pathnames except:
        // - /api (API routes)
        // - /_next (Next.js internals)
        // - /assets, /blog/images, /locales (static files in public/)
        // - Files with extensions (.ico, .svg, .jpg, etc.)
        '/((?!api|_next|assets|blog/images|locales|.*\\..*).*)'
    ]
};

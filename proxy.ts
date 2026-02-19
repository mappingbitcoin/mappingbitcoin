import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export default intlMiddleware;

export const config = {
    // Match all paths except API routes, static files, and Next.js internals
    matcher: ["/((?!api|_next|.*\\..*).*)"]
};

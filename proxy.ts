import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware({
    locales: routing.locales,
    defaultLocale: "en",
    localePrefix: "as-needed",
});

export default function proxy(req: NextRequest) {
    return intlMiddleware(req);
}

export const config = { matcher: ["/((?!api|_next|.*\\..*).*)"] };

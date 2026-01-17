import { env } from "@/lib/Environment";

export const generateCanonical = (pagePath: string, currentLocale: string) =>
    `${env.siteUrl}/${currentLocale === 'en' ? '' : currentLocale + '/'}${pagePath}`;

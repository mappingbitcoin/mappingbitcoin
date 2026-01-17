// i18n/locales.ts
import {routing} from "@/i18n/routing";

export type Locale = typeof routing.locales[number];

export const LOCALE_NAMES: Record<Locale, string> = {
    en: 'English',
};

export interface Localized {
    params: Promise<{
        locale: Locale;
    }>;
}

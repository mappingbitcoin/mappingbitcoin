// i18n/locales.ts
import {routing} from "@/i18n/routing";

export type Locale = typeof routing.locales[number];

export interface Localized {
    params: Promise<{
        locale: Locale;
    }>;
}

import { defineRouting } from "next-intl/routing";

// /en/... and /es/... always carry the locale. A visit to "/" is sent to
// the best match for the browser's Accept-Language header.
export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

export const isLocale = (value: string): value is Locale =>
  (routing.locales as readonly string[]).includes(value);

/** BCP 47 tags for <html lang>, OpenGraph, and date formatting. */
export const LOCALE_TAGS: Record<Locale, { lang: string; og: string }> = {
  en: { lang: "en", og: "en_US" },
  es: { lang: "es", og: "es_ES" },
};

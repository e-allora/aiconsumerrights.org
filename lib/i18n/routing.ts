import { defineRouting } from "next-intl/routing";

// /en/... and /es/... always carry the locale. A visit to "/" is sent to
// the best match for the browser's Accept-Language header.
export const routing = defineRouting({
  locales: ["en", "es", "pt"],
  defaultLocale: "en",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

export const isLocale = (value: string): value is Locale =>
  (routing.locales as readonly string[]).includes(value);

/**
 * lang: <html lang>, so screen readers pick the right voice. The Portuguese
 * text is European Portuguese, hence pt-PT.
 * hreflang: which searchers each version is for. "pt" offers the only
 * Portuguese version to every Portuguese speaker, not just those in Portugal.
 * og: OpenGraph locale.
 */
export const LOCALE_TAGS: Record<Locale, { lang: string; hreflang: string; og: string }> = {
  en: { lang: "en", hreflang: "en", og: "en_US" },
  es: { lang: "es", hreflang: "es", og: "es_ES" },
  pt: { lang: "pt-PT", hreflang: "pt", og: "pt_PT" },
};

import { defineRouting } from "next-intl/routing";

// Every URL carries its locale. A visit to "/" is sent to the best match for
// the browser's Accept-Language header.
//
// European Portuguese uses the precise code pt-PT so a Portuguese browser
// matches it: a bare "pt" counts as Brazilian to the language matcher, which
// sent pt-PT visitors to /pt-BR. Its URL stays /pt.
export const routing = defineRouting({
  locales: ["en", "es", "pt-PT", "pt-BR"],
  defaultLocale: "en",
  localePrefix: { mode: "always", prefixes: { "pt-PT": "/pt" } },
});

export type Locale = (typeof routing.locales)[number];

const PREFIXES: Partial<Record<Locale, string>> = { "pt-PT": "/pt" };

/** The public URL path for a page in a locale: ("pt-PT", "/forum") -> "/pt/forum". */
export function localizedPath(locale: Locale, path: `/${string}` = "/"): string {
  const prefix = PREFIXES[locale] ?? `/${locale}`;
  return path === "/" ? prefix : `${prefix}${path}`;
}

export const isLocale = (value: string): value is Locale =>
  (routing.locales as readonly string[]).includes(value);

/**
 * lang: <html lang>, so screen readers pick the right voice and accent.
 * hreflang: which searchers each version is for. /pt is European Portuguese
 * and /pt-BR is Brazilian Portuguese, so each targets its own region.
 * og: OpenGraph locale.
 */
export const LOCALE_TAGS: Record<Locale, { lang: string; hreflang: string; og: string }> = {
  en: { lang: "en", hreflang: "en", og: "en_US" },
  es: { lang: "es", hreflang: "es", og: "es_ES" },
  "pt-PT": { lang: "pt-PT", hreflang: "pt-PT", og: "pt_PT" },
  "pt-BR": { lang: "pt-BR", hreflang: "pt-BR", og: "pt_BR" },
};

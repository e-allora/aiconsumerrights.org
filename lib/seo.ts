import type { Metadata } from "next";

import { LOCALE_TAGS, routing, type Locale } from "@/lib/i18n/routing";

/** The share image, described in the page's language. */
export const ogImage = (alt: string) => ({ url: "/opengraph-image", width: 1200, height: 630, alt });

/** hreflang alternates for a path in every locale, plus x-default. */
export function languageAlternates(path: `/${string}`) {
  const suffix = path === "/" ? "" : path;
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[LOCALE_TAGS[l].hreflang] = `/${l}${suffix}`;
  languages["x-default"] = `/${routing.defaultLocale}${suffix}`;
  return languages;
}

// A page that sets its own openGraph replaces the layout's, image included,
// so every page builds its metadata here to keep the share image.
export function pageMetadata({
  locale,
  title,
  description,
  siteName,
  imageAlt,
  path,
  type = "website",
}: {
  locale: Locale;
  title: string;
  description: string;
  siteName: string;
  imageAlt: string;
  path: `/${string}`;
  type?: "website" | "article";
}): Metadata {
  const url = `/${locale}${path === "/" ? "" : path}`;
  const image = ogImage(imageAlt);
  return {
    title,
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type,
      siteName,
      locale: LOCALE_TAGS[locale].og,
      alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => LOCALE_TAGS[l].og),
      title,
      description,
      url,
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

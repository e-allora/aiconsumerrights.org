import type { MetadataRoute } from "next";

import { routing } from "@/lib/i18n/routing";
import { languageAlternates } from "@/lib/seo";
import { PUBLISHED_ROUTES, SITE_URL } from "@/lib/site";

// Every page in every locale, each listing its translations (hreflang) so
// search engines show people the version in their language.
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLISHED_ROUTES.flatMap(({ path, changeFrequency, priority }) => {
    const languages = Object.fromEntries(
      Object.entries(languageAlternates(path)).map(([lang, href]) => [lang, `${SITE_URL}${href}`])
    );
    return routing.locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${path === "/" ? "" : path}`,
      changeFrequency,
      priority,
      alternates: { languages },
    }));
  });
}

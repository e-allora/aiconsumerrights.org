import type { MetadataRoute } from "next";

import { PUBLISHED_ROUTES, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLISHED_ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  }));
}

import createMiddleware from "next-intl/middleware";

import { routing } from "@/lib/i18n/routing";

// Adds the locale to every page URL and detects the browser language on "/".
export default createMiddleware(routing);

export const config = {
  // Skip Next internals, Vercel internals, the share image, and any file
  // with an extension (sitemap.xml, robots.txt, favicon.ico, images).
  matcher: ["/((?!api|_next|_vercel|opengraph-image|.*\\..*).*)"],
};

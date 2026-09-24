import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "@/lib/i18n/routing";

// Adds the locale to every page URL and detects the browser language on "/".
const intl = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // European Portuguese lives at /pt. Someone typing its locale code,
  // /pt-PT, gets there too instead of a dead end.
  const { pathname } = request.nextUrl;
  if (/^\/pt-pt(\/|$)/i.test(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/pt-pt/i, "/pt");
    return NextResponse.redirect(url, 308);
  }
  return intl(request);
}

export const config = {
  // Skip Next internals, Vercel internals, the share image, and any file
  // with an extension (sitemap.xml, robots.txt, favicon.ico, images).
  matcher: ["/((?!api|_next|_vercel|opengraph-image|.*\\..*).*)"],
};

import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_REALM, isAdmin } from "@/lib/admin-auth";
import { localizedPath, routing, type Locale } from "@/lib/i18n/routing";
import { PUBLISHED_ROUTES } from "@/lib/site";

// Adds the locale to every page URL and detects the browser language on "/".
const intl = createMiddleware(routing);

const PAGES = new Set<string>(PUBLISHED_ROUTES.map((r) => r.path));
// The public prefix of each language: "/en" is en, "/pt" is pt-PT.
const LOCALE_BY_PREFIX = new Map<string, Locale>(routing.locales.map((l) => [localizedPath(l), l]));

/** The language of an address that starts with a language but matches no page. */
function missingPageLocale(pathname: string): Locale | undefined {
  const [, first, ...rest] = pathname.split("/");
  const locale = LOCALE_BY_PREFIX.get(`/${first}`);
  if (!locale) return undefined;
  return PAGES.has(`/${rest.filter(Boolean).join("/")}`) ? undefined : locale;
}

export default function proxy(request: NextRequest) {
  // The review page is private and English-only: password first, no locale.
  const { pathname } = request.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (isAdmin(request.headers.get("authorization"))) return NextResponse.next();
    return new NextResponse("Password required.", { status: 401, headers: { "WWW-Authenticate": ADMIN_REALM } });
  }

  // European Portuguese lives at /pt. Someone typing its locale code,
  // /pt-PT, gets there too instead of a dead end.
  if (/^\/pt-pt(\/|$)/i.test(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/pt-pt/i, "/pt");
    return NextResponse.redirect(url, 308);
  }

  // An address that matches no page gets the ready-made "page not found" page
  // in its own language, with status 404, so it works without JavaScript.
  const lost = missingPageLocale(pathname);
  if (lost) {
    const url = request.nextUrl.clone();
    url.pathname = `/${lost}/missing`;
    return NextResponse.rewrite(url, { status: 404 });
  }
  return intl(request);
}

export const config = {
  // Skip Next internals, Vercel internals, the share image, and any file
  // with an extension (sitemap.xml, robots.txt, favicon.ico, images).
  matcher: ["/((?!api|_next|_vercel|opengraph-image|.*\\..*).*)"],
};

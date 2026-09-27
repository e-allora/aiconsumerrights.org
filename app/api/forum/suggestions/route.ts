import { NextResponse, type NextRequest } from "next/server";

import { fail } from "@/lib/forum/http";
import { approvedSuggestions } from "@/lib/forum/submissions";
import { isLocale } from "@/lib/i18n/routing";

// Read from the database on each request, not at build time.
export const dynamic = "force-dynamic";

/**
 * Approved suggestions for one language: /api/forum/suggestions?locale=it.
 * Cached like the results: a minute at Vercel's CDN, never in browsers.
 */
export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") ?? "";
  if (!isLocale(locale)) return fail(400, "invalid");
  try {
    const statements = await approvedSuggestions(locale);
    return NextResponse.json(
      { statements },
      {
        headers: {
          "Cache-Control": "no-store",
          "Vercel-CDN-Cache-Control": "max-age=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("forum suggestions failed", error);
    return fail(500, "unavailable");
  }
}

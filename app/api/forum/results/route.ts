import { NextResponse } from "next/server";

import { countVotes } from "@/lib/forum/votes";

// Read from the database on each request, not at build time.
export const dynamic = "force-dynamic";

/**
 * Vote counts per statement and language. No voter data. Vercel's CDN keeps
 * a copy for a minute, so a busy page doesn't query the database each visit.
 * Browsers don't cache it, so a reload always gets the CDN's latest copy.
 */
export async function GET() {
  try {
    const rows = await countVotes();
    return NextResponse.json(
      { rows },
      {
        headers: {
          "Cache-Control": "no-store",
          "Vercel-CDN-Cache-Control": "max-age=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("forum results failed", error);
    return NextResponse.json({ error: "unavailable" }, { status: 500 });
  }
}

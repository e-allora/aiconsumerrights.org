import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { VOTER_COOKIE, deleteVotes, hashVoter, parseVote, saveVote } from "@/lib/forum/votes";

// The voter code is sent only to /api/forum, never to pages, and scripts
// can't read it.
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/forum",
  maxAge: 60 * 60 * 24 * 180,
} as const;

/** Only this site's own pages may vote, so other sites can't vote for a visitor. */
function fromThisSite(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

const fail = (status: number, error: string) => NextResponse.json({ ok: false, error }, { status });

/** Records or changes one vote. */
export async function POST(request: NextRequest) {
  if (!fromThisSite(request)) return fail(403, "forbidden");

  const input = parseVote(await request.json().catch(() => null));
  if (!input) return fail(400, "invalid");

  const existing = request.cookies.get(VOTER_COOKIE)?.value;
  const code = existing ?? randomUUID();
  try {
    await saveVote(hashVoter(code), input);
  } catch (error) {
    console.error("forum vote failed", error);
    return fail(500, "unavailable");
  }

  const response = NextResponse.json({ ok: true });
  if (!existing) response.cookies.set(VOTER_COOKIE, code, COOKIE_OPTIONS);
  return response;
}

/** "Clear my votes": deletes this browser's votes and forgets its code. */
export async function DELETE(request: NextRequest) {
  if (!fromThisSite(request)) return fail(403, "forbidden");

  const code = request.cookies.get(VOTER_COOKIE)?.value;
  if (code) {
    try {
      await deleteVotes(hashVoter(code));
    } catch (error) {
      console.error("forum vote delete failed", error);
      return fail(500, "unavailable");
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(VOTER_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  return response;
}

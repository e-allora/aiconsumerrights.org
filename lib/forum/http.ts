import { NextResponse, type NextRequest } from "next/server";

/** Only this site's own pages may call the forum API, so other sites can't act for a visitor. */
export function fromThisSite(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export const fail = (status: number, error: string) => NextResponse.json({ ok: false, error }, { status });

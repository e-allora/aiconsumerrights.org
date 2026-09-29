import { NextResponse, type NextRequest } from "next/server";

import { fail, fromThisSite } from "@/lib/forum/http";
import { precheck } from "@/lib/forum/precheck";
import { DAILY_LIMITS, parseSubmission, saveSubmission, submissionsToday } from "@/lib/forum/submissions";

/**
 * Takes a suggested statement for review. Nothing is published here: every
 * suggestion waits until Robert approves it. Text with links, emails,
 * handles, or phone numbers is turned back unsaved, so the writer can fix it.
 * Daily limits keep a flood from running up the AI bill (see DAILY_LIMITS).
 */
export async function POST(request: NextRequest) {
  if (!fromThisSite(request)) return fail(403, "forbidden");

  const input = parseSubmission(await request.json().catch(() => null));
  if (input === "invalid") return fail(400, "invalid");
  if (input === "contact") return fail(422, "contact");

  try {
    const today = await submissionsToday();
    if (today >= DAILY_LIMITS.submissions) return fail(429, "busy");
    const check = today < DAILY_LIMITS.aiChecks ? await precheck(input.text, input.locale) : null;
    await saveSubmission(input, check);
  } catch (error) {
    console.error("forum submission failed", error);
    return fail(500, "unavailable");
  }
  return NextResponse.json({ ok: true });
}

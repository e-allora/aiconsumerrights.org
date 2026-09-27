import { isLocale, type Locale } from "@/lib/i18n/routing";
import { getSql } from "@/lib/forum/db";
import type { Precheck } from "@/lib/forum/precheck";
import { MAX_STATEMENT_LENGTH } from "@/lib/forum/statements";

// Links, emails, handles, and phone numbers are never published, so a
// statement with any of them is turned back with a note, not stored. No /g
// flag: a global regex keeps state between calls and skips matches.
const CONTACT_PATTERNS = [
  /\bhttps?:\/\//i,
  /\bwww\./i,
  /\b[a-z0-9-]{2,}\.(?:com|org|net|info|io|co|app|dev|ai|eu|br|pt|it|es|uk|us|de|fr|me|tv|ly|xyz)\b/i,
  /[^\s@]+@[^\s@]+\.[^\s@]+/,
  /(?:^|\s)@\w{2,}/,
  // 8 or more digits, allowing + and the usual separators: covers
  // +1 555 123 4567, +39 347 123 4567, (11) 91234-5678.
  /(?:\+?\d[\s().-]{0,2}){8,}/,
];

export const hasContactInfo = (text: string) => CONTACT_PATTERNS.some((p) => p.test(text));

/** Collapses spaces and line breaks. Returns null if empty or too long. */
export function cleanText(raw: string): string | null {
  const text = raw
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const length = [...text].length;
  return length > 0 && length <= MAX_STATEMENT_LENGTH ? text : null;
}

export type SubmissionInput = { text: string; locale: Locale };

/** Checks a suggestion request body. */
export function parseSubmission(body: unknown): SubmissionInput | "invalid" | "contact" {
  if (!body || typeof body !== "object") return "invalid";
  const { text: raw, locale } = body as Record<string, unknown>;
  if (typeof raw !== "string" || typeof locale !== "string" || !isLocale(locale)) return "invalid";
  const text = cleanText(raw);
  if (!text) return "invalid";
  if (hasContactInfo(text)) return "contact";
  return { text, locale };
}

// Approved suggestions are voted on as statements with the id "s-<uuid>".
const SUGGESTION_ID = /^s-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const suggestionId = (uuid: string) => `s-${uuid}`;

export type Submission = {
  id: string;
  text: string;
  locale: string;
  status: "pending" | "approved";
  check: Precheck | null;
  createdAt: string;
};

export async function saveSubmission({ text, locale }: SubmissionInput, check: Precheck | null) {
  await getSql()`
    INSERT INTO submissions (text, locale, ai_check)
    VALUES (${text}, ${locale}, ${check ? JSON.stringify(check) : null}::jsonb)`;
}

/** Every suggestion waiting for review or already approved, oldest first. */
export async function listSubmissions(): Promise<Submission[]> {
  const rows = (await getSql()`
    SELECT id, text, locale, status, ai_check, created_at
    FROM submissions ORDER BY created_at`) as Record<string, unknown>[];
  return rows.map((r) => ({
    id: String(r.id),
    text: String(r.text),
    locale: String(r.locale),
    status: r.status === "approved" ? "approved" : "pending",
    check: (r.ai_check as Precheck | null) ?? null,
    createdAt: new Date(r.created_at as string).toISOString(),
  }));
}

export async function approveSubmission(id: string) {
  if (!UUID.test(id)) return;
  await getSql()`UPDATE submissions SET status = 'approved', reviewed_at = now() WHERE id = ${id}`;
}

/** Runs the AI pre-check again on a saved suggestion, e.g. after it was busy. */
export async function recheckSubmission(id: string, run: (text: string, locale: string) => Promise<Precheck | null>) {
  if (!UUID.test(id)) return;
  const rows = (await getSql()`SELECT text, locale FROM submissions WHERE id = ${id}`) as Record<string, string>[];
  if (!rows.length) return;
  const check = await run(rows[0].text, rows[0].locale);
  if (check) await getSql()`UPDATE submissions SET ai_check = ${JSON.stringify(check)}::jsonb WHERE id = ${id}`;
}

/** Rejecting or removing a suggestion deletes it and any votes on it. */
export async function deleteSubmission(id: string) {
  if (!UUID.test(id)) return;
  await getSql()`DELETE FROM votes WHERE statement_id = ${suggestionId(id)}`;
  await getSql()`DELETE FROM submissions WHERE id = ${id}`;
}

/** Approved suggestions for one language, as votable statements. */
export async function approvedSuggestions(locale: Locale): Promise<{ id: string; text: string }[]> {
  const rows = (await getSql()`
    SELECT id, text FROM submissions
    WHERE status = 'approved' AND locale = ${locale}
    ORDER BY reviewed_at, created_at`) as Record<string, unknown>[];
  return rows.map((r) => ({ id: suggestionId(String(r.id)), text: String(r.text) }));
}

/** True if the statement id is an approved suggestion. */
export async function isApprovedSuggestion(statementId: string): Promise<boolean> {
  const uuid = SUGGESTION_ID.exec(statementId)?.[1];
  if (!uuid) return false;
  const rows = (await getSql()`
    SELECT 1 FROM submissions WHERE id = ${uuid} AND status = 'approved'`) as unknown[];
  return rows.length > 0;
}

export const looksLikeSuggestion = (statementId: string) => SUGGESTION_ID.test(statementId);

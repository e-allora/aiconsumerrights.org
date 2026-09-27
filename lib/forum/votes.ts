import { createHash } from "node:crypto";

import { isLocale, type Locale } from "@/lib/i18n/routing";
import type { CountRow } from "@/lib/forum/consensus";
import { getSql } from "@/lib/forum/db";
import { STATEMENTS } from "@/lib/forum/statements";
import { looksLikeSuggestion } from "@/lib/forum/submissions";

export const VOTES = ["agree", "disagree", "pass"] as const;
export type Vote = (typeof VOTES)[number];

export type VoteInput = { statementId: string; vote: Vote; locale: Locale };

const STATEMENT_IDS = new Set(STATEMENTS.map((s) => s.id));

/**
 * Checks a vote request body. Returns the vote, or null if anything is off.
 * A suggestion id only has the right shape here; the route also checks the
 * suggestion is approved.
 */
export function parseVote(body: unknown): VoteInput | null {
  if (!body || typeof body !== "object") return null;
  const { statementId, vote, locale } = body as Record<string, unknown>;
  if (typeof statementId !== "string") return null;
  if (!STATEMENT_IDS.has(statementId) && !looksLikeSuggestion(statementId)) return null;
  if (typeof vote !== "string" || !(VOTES as readonly string[]).includes(vote)) return null;
  if (typeof locale !== "string" || !isLocale(locale)) return null;
  return { statementId, vote: vote as Vote, locale };
}

/** Cookie holding a random code that lets one browser vote once per statement. */
export const VOTER_COOKIE = "forum_voter";
/** How long that code lasts. The How it works page quotes this number. */
export const VOTER_COOKIE_DAYS = 180;

/**
 * The voter code in the cookie is random. Only its hash is stored, so the
 * database alone can't be matched back to a browser.
 */
export const hashVoter = (code: string) => createHash("sha256").update(code).digest("hex");

/** Saves a vote. Voting again on the same statement replaces the old vote. */
export async function saveVote(voter: string, { statementId, vote, locale }: VoteInput) {
  await getSql()`
    INSERT INTO votes (statement_id, voter, vote, locale)
    VALUES (${statementId}, ${voter}, ${vote}, ${locale})
    ON CONFLICT (statement_id, voter)
    DO UPDATE SET vote = EXCLUDED.vote, locale = EXCLUDED.locale, updated_at = now()`;
}

/** Deletes every vote from one voter. */
export async function deleteVotes(voter: string) {
  await getSql()`DELETE FROM votes WHERE voter = ${voter}`;
}

/** Agree, disagree, and pass counts for every statement in every language. */
export async function countVotes(): Promise<CountRow[]> {
  const rows = (await getSql()`
    SELECT statement_id, locale,
      count(*) FILTER (WHERE vote = 'agree')::int AS agree,
      count(*) FILTER (WHERE vote = 'disagree')::int AS disagree,
      count(*) FILTER (WHERE vote = 'pass')::int AS pass
    FROM votes
    GROUP BY statement_id, locale`) as Record<string, string | number>[];
  return rows.map((r) => ({
    statementId: String(r.statement_id),
    locale: String(r.locale),
    agree: Number(r.agree),
    disagree: Number(r.disagree),
    pass: Number(r.pass),
  }));
}

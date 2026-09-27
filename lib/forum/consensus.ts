// Turns raw vote counts into "where groups agree". The groups are the site's
// languages, so common ground has to reach across countries, not just win a
// majority in one place. Runs in the browser and on the server; no database.

import { routing, type Locale } from "@/lib/i18n/routing";
import { STATEMENTS } from "@/lib/forum/statements";

/** Vote counts for one statement from one language. */
export type CountRow = { statementId: string; locale: string; agree: number; disagree: number; pass: number };

export type GroupResult = { locale: Locale; agree: number; votes: number };
export type StatementResult = { id: string; groups: GroupResult[]; lowest: number };

export const RULES = {
  /** Every counted group must agree at this percent or more. */
  threshold: 60,
  /** A language counts toward a statement only with this many agree + disagree votes on it. */
  minVotes: 20,
  /** A statement needs at least this many languages that count. */
  minGroups: 2,
} as const;

const KNOWN = new Set(STATEMENTS.map((s) => s.id));
const LOCALES = routing.locales as readonly string[];

/**
 * Statements with broad agreement, in seed order. Passes are left out of
 * the percent, since a pass means "not sure". Percents round down, so a
 * result never looks stronger than it is.
 */
export function broadAgreement(rows: CountRow[], rules = RULES): StatementResult[] {
  const results: StatementResult[] = [];
  for (const { id } of STATEMENTS) {
    const groups: GroupResult[] = [];
    let allAgree = true;
    for (const locale of routing.locales) {
      const row = rows.find((r) => r.statementId === id && r.locale === locale);
      const votes = row ? row.agree + row.disagree : 0;
      if (!row || votes < rules.minVotes) continue;
      if (row.agree / votes < rules.threshold / 100) allAgree = false;
      groups.push({ locale, agree: Math.floor((row.agree / votes) * 100), votes });
    }
    if (allAgree && groups.length >= rules.minGroups) {
      results.push({ id, groups, lowest: Math.min(...groups.map((g) => g.agree)) });
    }
  }
  return results;
}

/** How many votes there are so far, and from how many languages. */
export function progress(rows: CountRow[]) {
  const counted = rows.filter((r) => KNOWN.has(r.statementId) && LOCALES.includes(r.locale));
  return {
    votes: counted.reduce((n, r) => n + r.agree + r.disagree + r.pass, 0),
    languages: new Set(counted.map((r) => r.locale)).size,
  };
}

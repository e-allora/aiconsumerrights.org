// Typed access to the public logs Robert writes by hand:
// content/corrections.json (what the site got wrong and what changed),
// content/we-did.json (what changed because of forum votes), and
// content/reviews.json (who reviewed which part of a help page). Nothing
// here generates entries; the site only shows what those files hold.
import correctionsFile from "@/content/corrections.json";
import reviewsFile from "@/content/reviews.json";
import weDidFile from "@/content/we-did.json";

/** Text keyed by locale. English is required; other languages fall back to it. */
export type LocalizedText = { en: string } & Partial<Record<string, string>>;

export type Correction = {
  id: string;
  /** The day the fix went live, as YYYY-MM-DD. */
  date: string;
  /** The page that was wrong, e.g. "/guide". */
  page: `/${string}`;
  wrong: LocalizedText;
  changed: LocalizedText;
  /** Only when the person asked to be credited. */
  flaggedBy?: string;
  /** The GitHub commit that made the fix. */
  commit?: string;
};

export type WeDidEntry = {
  id: string;
  date: string;
  /** The page that changed, e.g. "/guide". */
  page: `/${string}`;
  did: LocalizedText;
  /** The forum statement ids whose results led to the change. */
  statements?: string[];
  commit?: string;
};

/**
 * How a reviewer chose to be credited. Someone who wants no mention at all
 * gets no entry, so there is no "hidden" option here.
 */
export type ReviewCredit =
  | { as: "name"; name: string; organisation?: string; url?: string }
  | { as: "organisation"; organisation: string; url?: string }
  | { as: "anonymous"; description: LocalizedText };

/** One review of one part of one help guide. A review never covers the whole site. */
export type Review = {
  id: string;
  /** The day the review was finished, as YYYY-MM-DD. */
  date: string;
  /** The help guide, e.g. "credit". */
  guide: string;
  /** The region of that guide, e.g. "us". */
  region: string;
  /** The language of the page the reviewer read, e.g. "it". */
  language: string;
  /** What the reviewer looked at, e.g. "The US rights and the letter". */
  scope: LocalizedText;
  credit: ReviewCredit;
};

/** The text for a locale, and the language it is actually in. */
export function pick(text: LocalizedText, locale: string): { text: string; lang: string } {
  const own = text[locale]?.trim();
  return own ? { text: own, lang: locale } : { text: text.en, lang: "en" };
}

const newestFirst = <T extends { date: string }>(entries: T[]) =>
  [...entries].sort((a, b) => b.date.localeCompare(a.date));

export const corrections = newestFirst(correctionsFile.entries as Correction[]);
export const weDid = newestFirst(weDidFile.entries as WeDidEntry[]);
export const reviews = newestFirst(reviewsFile.entries as Review[]);

/** The reviews of one region of one guide, newest first. */
export const reviewsFor = (guide: string, region: string, entries: Review[] = reviews) =>
  entries.filter((r) => r.guide === guide && r.region === region);

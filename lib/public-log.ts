// Typed access to the two public logs Robert writes by hand:
// content/corrections.json (what the site got wrong and what changed) and
// content/we-did.json (what changed because of forum votes). Nothing here
// generates entries; the site only shows what those files hold.
import correctionsFile from "@/content/corrections.json";
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

/** The text for a locale, and the language it is actually in. */
export function pick(text: LocalizedText, locale: string): { text: string; lang: string } {
  const own = text[locale]?.trim();
  return own ? { text: own, lang: locale } : { text: text.en, lang: "en" };
}

const newestFirst = <T extends { date: string }>(entries: T[]) =>
  [...entries].sort((a, b) => b.date.localeCompare(a.date));

export const corrections = newestFirst(correctionsFile.entries as Correction[]);
export const weDid = newestFirst(weDidFile.entries as WeDidEntry[]);

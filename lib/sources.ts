// Typed access to the source registry in lib/data/sources.json.
import registry from "@/lib/data/sources.json";

export { formatDate } from "@/lib/dates";

export type SourceStatus = "confirmed" | "unopened" | "no-link";

export type Source = {
  id: string;
  title: string;
  publisher?: string;
  author?: string;
  date?: string;
  type: string;
  url?: string;
  status: SourceStatus;
  note?: string;
  primary?: boolean;
  /** Where the source applies, e.g. "Brazil (LGPD)". */
  jurisdiction?: string;
  /** One or two sentences on what the source says, shown on /sources. */
  summary?: string;
  /** The language of the title and page, when not English, e.g. "fr". */
  lang?: string;
  /** The day Robert read the source himself (YYYY-MM-DD). "confirmed" alone means an AI opened it. */
  readBy?: string;
  /** A snapshot at the Internet Archive, so anyone can see the page as it was when checked. */
  archived?: { url: string; date: string };
  /**
   * Robert's own saved copies, by SHA-256 fingerprint. "original" is the
   * publisher's file, which anyone can download and compare; "print" is his
   * browser's PDF of a web page, which only his copy will match.
   */
  copies?: { sha256: string; pages: number; kind: "original" | "print" }[];
};

export type SourceCategory = { id: string; title: string; sources: Source[] };

export type ModelCredit = {
  id: string;
  name: string;
  maker: string;
  role: string;
  confirmed: boolean;
};

export type Registry = {
  about: string;
  checkedOn: string;
  review: { reviewer: string; status: "pending" | "reviewed"; reviewedOn: string | null };
  models: ModelCredit[];
  categories: SourceCategory[];
};

export const sources = registry as Registry;

const byId = new Map(
  sources.categories.flatMap((c) => c.sources.map((s) => [s.id, s] as const))
);

/** Looks up a source. Throws on an unknown id so a bad citation fails the build. */
export function getSource(id: string): Source {
  const source = byId.get(id);
  if (!source) throw new Error(`Unknown source id: ${id}`);
  return source;
}

const order = sources.categories.flatMap((c) => c.sources.map((s) => s.id));

/** A source's number on the /sources page, the same on every page. */
export const sourceNumber = (id: string): number => {
  getSource(id);
  return order.indexOf(id) + 1;
};

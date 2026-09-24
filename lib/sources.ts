// Typed access to the source registry in lib/data/sources.json.
import registry from "@/lib/data/sources.json";

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

/** "2026-09-23" -> "23 September 2026" or "23 de septiembre de 2026" (UTC, so server and client agree). */
export function formatDate(iso: string, locale = "en"): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale === "en" ? "en-GB" : locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

const order = sources.categories.flatMap((c) => c.sources.map((s) => s.id));

/** A source's number on the /sources page, the same on every page. */
export const sourceNumber = (id: string): number => {
  getSource(id);
  return order.indexOf(id) + 1;
};

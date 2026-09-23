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

export const STATUS_LABEL: Record<SourceStatus, string> = {
  confirmed: "Link opened and matched",
  unopened: "Link not yet opened by a person",
  "no-link": "No public link yet",
};

/** "2026-09-23" -> "23 September 2026" (UTC, so server and client agree). */
export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Accessible name for an external link: title, publisher, and the new-tab warning. */
export function externalLabel(s: Source): string {
  return `${s.title}${s.publisher ? `, ${s.publisher}` : ""} (opens in a new tab)`;
}

const order = sources.categories.flatMap((c) => c.sources.map((s) => s.id));

/** A source's number on the /sources page, the same on every page. */
export const sourceNumber = (id: string): number => {
  getSource(id);
  return order.indexOf(id) + 1;
};

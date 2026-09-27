import { render, screen, within } from "@/test-utils";

import { CorrectionsLog, WeDidList } from "@/components/ui/PublicLog";
import { STATEMENTS } from "@/lib/forum/statements";
import { routing } from "@/lib/i18n/routing";
import { corrections, pick, weDid, type Correction, type WeDidEntry } from "@/lib/public-log";
import { PUBLISHED_ROUTES, REPO_URL } from "@/lib/site";
import { MESSAGES } from "@/test-utils";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const COMMIT = /^[0-9a-f]{7,40}$/;
const pages = PUBLISHED_ROUTES.map((r) => r.path as string);
const locales = routing.locales as readonly string[];

// Robert edits these files by hand, so the checks catch typos before a deploy.
describe.each([
  ["corrections", corrections as (Correction | WeDidEntry)[]],
  ["we-did", weDid as (Correction | WeDidEntry)[]],
])("content/%s.json", (_, entries) => {
  it("has unique ids, real past dates, published pages, and well-formed commits", () => {
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length);
    const today = new Date().toISOString().slice(0, 10);
    for (const e of entries) {
      expect(e.date).toMatch(ISO_DAY);
      expect(Number.isNaN(Date.parse(e.date))).toBe(false);
      expect(e.date <= today).toBe(true);
      expect(pages).toContain(e.page);
      if (e.commit) expect(e.commit).toMatch(COMMIT);
    }
  });

  it("has English for every text, and only languages the site offers", () => {
    for (const e of entries) {
      const texts = "did" in e ? [e.did] : [e.wrong, e.changed];
      for (const t of texts) {
        expect(t.en.trim()).not.toBe("");
        for (const lang of Object.keys(t)) expect(locales).toContain(lang);
      }
    }
  });
});

describe("content/we-did.json", () => {
  it("only points at forum statements that exist", () => {
    const ids = STATEMENTS.map((s) => s.id);
    for (const e of weDid) for (const s of e.statements ?? []) expect(ids).toContain(s);
  });
});

describe("pick", () => {
  it("uses the visitor's language when there is a translation, English otherwise", () => {
    expect(pick({ en: "Hello", it: "Ciao" }, "it")).toEqual({ text: "Ciao", lang: "it" });
    expect(pick({ en: "Hello", it: "  " }, "it")).toEqual({ text: "Hello", lang: "en" });
    expect(pick({ en: "Hello" }, "es")).toEqual({ text: "Hello", lang: "en" });
  });
});

const fix = (over: Partial<Correction> = {}): Correction => ({
  id: "a",
  date: "2026-09-20",
  page: "/guide",
  wrong: { en: "It said X.", es: "Decía X." },
  changed: { en: "It says Y.", es: "Dice Y." },
  ...over,
});

describe("CorrectionsLog", () => {
  it("says so plainly when there are none", () => {
    render(<CorrectionsLog entries={[]} />);
    expect(screen.getByText(MESSAGES.en.PublicLog.noCorrections)).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("shows each fix newest first: date, page, what was wrong, what changed, and the commit", () => {
    render(
      <CorrectionsLog
        entries={[
          fix({ id: "new", date: "2026-09-25", commit: "abc1234" }),
          fix({ id: "old", date: "2026-09-01", page: "/forum" }),
        ]}
      />
    );
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    const first = within(items[0]);
    expect(first.getByText("25 September 2026").closest("time")).toHaveAttribute("dateTime", "2026-09-25");
    expect(first.getByRole("link", { name: "Guide" })).toHaveAttribute("href", "/en/guide");
    expect(items[0]).toHaveTextContent("What was wrongIt said X.");
    expect(items[0]).toHaveTextContent("What we changedIt says Y.");
    expect(first.getByRole("link", { name: /See the exact change/ })).toHaveAttribute(
      "href",
      `${REPO_URL}/commit/abc1234`
    );
    expect(within(items[1]).getByRole("link", { name: "Forum" })).toHaveAttribute("href", "/en/forum");
    expect(within(items[1]).queryByRole("link", { name: /See the exact change/ })).not.toBeInTheDocument();
  });

  it("credits the person who flagged it only when the entry names them", () => {
    render(<CorrectionsLog entries={[fix({ flaggedBy: "Ana" }), fix({ id: "b" })]} />);
    const [credited, plain] = screen.getAllByRole("listitem");
    expect(credited).toHaveTextContent("Flagged by Ana");
    expect(plain).not.toHaveTextContent("Flagged by");
  });

  it("shows untranslated text in English, marked as English, and says so", () => {
    render(<CorrectionsLog entries={[fix()]} />, { locale: "it" });
    const wrong = screen.getByText("It said X.");
    expect(wrong).toHaveAttribute("lang", "en");
    expect(screen.getAllByText(MESSAGES.it.PublicLog.englishOnly)).not.toHaveLength(0);
  });

  it("uses the visitor's language when the entry has it", () => {
    render(<CorrectionsLog entries={[fix()]} />, { locale: "es" });
    expect(screen.getByText("Decía X.")).toHaveAttribute("lang", "es");
    expect(screen.queryByText(MESSAGES.es.PublicLog.englishOnly)).not.toBeInTheDocument();
  });

  it.each(locales)("renders every real entry in %s", (locale) => {
    render(<CorrectionsLog />, { locale: locale as keyof typeof MESSAGES });
    expect(screen.queryAllByRole("listitem")).toHaveLength(corrections.length);
  });
});

describe("WeDidList", () => {
  it("says nothing has changed yet when the file is empty", () => {
    render(<WeDidList entries={[]} />);
    expect(screen.getByText(MESSAGES.en.Forum.loop.didText)).toBeInTheDocument();
  });

  it("lists each change with its date and a link to the page it changed", () => {
    render(
      <WeDidList
        entries={[{ id: "x", date: "2026-10-02", page: "/guide", did: { en: "Added a step." }, commit: "abc1234" }]}
      />
    );
    const item = screen.getByRole("listitem");
    expect(item).toHaveTextContent("2 October 2026");
    expect(item).toHaveTextContent("Added a step.");
    expect(within(item).getByRole("link", { name: "Guide" })).toHaveAttribute("href", "/en/guide");
    expect(within(item).getByRole("link", { name: /See the exact change/ })).toHaveAttribute(
      "href",
      `${REPO_URL}/commit/abc1234`
    );
  });
});

import SourcesPage from "@/app/[locale]/sources/page";
import { SourceCategoryList, SourceLink } from "@/components/ui/SourceList";
import { getSource, sources } from "@/lib/sources";
import { MESSAGES, render, screen, within, ready } from "@/test-utils";

describe.each(["en", "es", "pt-PT", "pt-BR", "it", "fr", "de", "hi"] as const)("Sources page in %s", (locale) => {
  it("lists every category, including Latin American and global frameworks", () => {
    render(<SourcesPage params={ready({ locale })} />, { locale });
    for (const c of sources.categories) {
      const title = (MESSAGES[locale].Attribution.categories as Record<string, string>)[c.id];
      expect(screen.getByRole("heading", { level: 2, name: title })).toBeInTheDocument();
    }
  });
});

describe("Sources page detail", () => {
  it("shows each LGPD source with its summary and jurisdiction, anchored for citations", () => {
    render(<SourcesPage params={ready({ locale: "en" })} />);
    const lgpd = sources.categories.find((c) => c.id === "latam-global")!.sources;
    for (const s of lgpd) {
      const item = document.getElementById(s.id)!;
      expect(item).toBeInTheDocument();
      expect(within(item).getByText(s.summary!)).toHaveAttribute("lang", "en");
      if (s.jurisdiction) expect(item).toHaveTextContent(s.jurisdiction);
    }
  });

  it("opens the verified LGPD links safely in a new tab", () => {
    render(<SourcesPage params={ready({ locale: "en" })} />);
    const [anpd, archivedCopy] = within(document.getElementById("anpd-lgpd-en")!).getAllByRole("link");
    expect(archivedCopy).toHaveAttribute("href", expect.stringMatching(/^https:\/\/web\.archive\.org\/web\//));
    expect(archivedCopy).toHaveAccessibleName(/^Archived copy from .+: Brazilian Data Protection Law/);
    expect(anpd).toHaveAttribute("target", "_blank");
    expect(anpd).toHaveAttribute("rel", "noopener noreferrer");
    expect(anpd.getAttribute("aria-label")).toMatch(/opens in a new tab/);
    expect(screen.getByText("Latin American and global regulatory frameworks")).toBeInTheDocument();
  });
});

describe("Source language and Robert's own reading", () => {
  const all = sources.categories.flatMap((c) => c.sources);

  it("marks every non-English title with its language, so screen readers pronounce it right", () => {
    for (const s of all) {
      if (s.id.startsWith("fr-")) expect(s.lang).toBe("fr");
      if (s.id.startsWith("de-") && s.id !== "de-cjeu-c634-21") expect(s.lang).toBe("de");
    }
    render(<SourceLink source={getSource("fr-crpa-l311-3-1")} />);
    const link = screen.getByRole("link", { name: /Article L311-3-1/ });
    expect(link).toHaveAttribute("hrefLang", "fr");
    expect(link.querySelector("span")).toHaveAttribute("lang", "fr");
  });

  it("dates Robert's own reading only with a real past day", () => {
    const today = new Date().toISOString().slice(0, 10);
    for (const s of all.filter((x) => x.readBy)) {
      expect(s.readBy).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(s.readBy! <= today).toBe(true);
    }
  });

  it("says who read a source and when, and says nothing when no one has yet", () => {
    const base = sources.categories[0];
    const read = { ...base.sources[0], readBy: "2026-09-28" };
    const unread = { ...base.sources[1], readBy: undefined };
    render(<SourceCategoryList category={{ ...base, sources: [read, unread] }} anchors />);
    expect(screen.getByText("Read by Robert Sweetman on 28 September 2026.")).toBeInTheDocument();
    expect(screen.getAllByText(/^Read by /)).toHaveLength(1);
  });
});

describe("Archived copies and Robert's fingerprints", () => {
  const all = sources.categories.flatMap((c) => c.sources);

  it("stores well-formed snapshots and fingerprints", () => {
    for (const s of all) {
      if (s.archived) {
        expect(s.archived.url).toMatch(/^https:\/\/web\.archive\.org\/web\/\d{14}\//);
        expect(s.archived.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
      for (const c of s.copies ?? []) {
        expect(c.sha256).toMatch(/^[0-9a-f]{64}$/);
        expect(c.pages).toBeGreaterThan(0);
        expect(["original", "print"]).toContain(c.kind);
      }
    }
  });

  it("links the archived copy, and shows a fingerprint only once Robert has read the source", () => {
    const base = sources.categories[0];
    const copy = { sha256: "a".repeat(64), pages: 12, kind: "original" as const };
    const archived = { url: "https://web.archive.org/web/20260928020626/https://example.org/", date: "2026-09-28" };
    // The test sets readBy itself, so it doesn't depend on which real sources Robert has read.
    const unread = { ...base.sources[0], archived, copies: [copy], readBy: undefined };
    const read = { ...base.sources[1], archived, copies: [copy], readBy: "2026-09-29" };
    render(<SourceCategoryList category={{ ...base, sources: [unread, read] }} anchors />);
    const links = screen.getAllByRole("link", { name: /^Archived copy from 28 September 2026: / });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", archived.url);
    expect(links[0]).toHaveAttribute("target", "_blank");
    const prints = screen.getAllByText(/Robert's copy: the publisher's own file, 12 pages/);
    expect(prints).toHaveLength(1);
    expect(prints[0].querySelector("code")).toHaveTextContent("a".repeat(16));
  });
});

import SourcesPage from "@/app/[locale]/sources/page";
import { SourceCategoryList, SourceLink } from "@/components/ui/SourceList";
import { getSource, sources } from "@/lib/sources";
import { MESSAGES, render, screen, within } from "@/test-utils";

describe.each(["en", "es", "pt-PT", "pt-BR", "it", "fr", "de", "hi"] as const)("Sources page in %s", (locale) => {
  it("lists every category, including Latin American and global frameworks", () => {
    render(<SourcesPage params={{ locale }} />, { locale });
    for (const c of sources.categories) {
      const title = (MESSAGES[locale].Attribution.categories as Record<string, string>)[c.id];
      expect(screen.getByRole("heading", { level: 2, name: title })).toBeInTheDocument();
    }
  });
});

describe("Sources page detail", () => {
  it("shows each LGPD source with its summary and jurisdiction, anchored for citations", () => {
    render(<SourcesPage params={{ locale: "en" }} />);
    const lgpd = sources.categories.find((c) => c.id === "latam-global")!.sources;
    for (const s of lgpd) {
      const item = document.getElementById(s.id)!;
      expect(item).toBeInTheDocument();
      expect(within(item).getByText(s.summary!)).toHaveAttribute("lang", "en");
      if (s.jurisdiction) expect(item).toHaveTextContent(s.jurisdiction);
    }
  });

  it("opens the verified LGPD links safely in a new tab", () => {
    render(<SourcesPage params={{ locale: "en" }} />);
    const anpd = within(document.getElementById("anpd-lgpd-en")!).getByRole("link");
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
    render(<SourceCategoryList category={{ ...base, sources: [read, base.sources[1]] }} anchors />);
    expect(screen.getByText("Read by Robert Sweetman on 28 September 2026.")).toBeInTheDocument();
    expect(screen.getAllByText(/^Read by /)).toHaveLength(1);
  });
});

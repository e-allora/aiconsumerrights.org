import SourcesPage from "@/app/[locale]/sources/page";
import { sources } from "@/lib/sources";
import { MESSAGES, render, screen, within } from "@/test-utils";

describe.each(["en", "es", "pt-PT", "pt-BR"] as const)("Sources page in %s", (locale) => {
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

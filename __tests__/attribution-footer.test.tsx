import { render, screen, within } from "@/test-utils";

import { AttributionFooter } from "@/components/ui/AttributionFooter";
import registry from "@/lib/data/sources.json";
import { sources, type Registry } from "@/lib/sources";

const allSources = sources.categories.flatMap((c) => c.sources);
const linked = allSources.filter((s) => s.url);

describe("AttributionFooter", () => {
  it("is a labelled footer landmark", () => {
    render(<AttributionFooter />);
    expect(screen.getByRole("contentinfo", { name: "How this site was made" })).toBeInTheDocument();
  });

  it("reads lib/data/sources.json: every category appears as a heading", () => {
    render(<AttributionFooter />);
    expect(sources).toBe(registry);
    for (const c of registry.categories) {
      expect(screen.getByRole("heading", { level: 3, name: c.title })).toBeInTheDocument();
    }
    expect(
      screen.getByText(`See all ${allSources.length} sources in ${registry.categories.length} groups`)
    ).toBeInTheDocument();
  });

  it("renders every source title from the registry", () => {
    render(<AttributionFooter />);
    for (const s of allSources) expect(screen.getAllByText(s.title).length).toBeGreaterThan(0);
  });

  it("gives every external link an aria-label and opens it safely in a new tab", () => {
    render(<AttributionFooter />);
    const external = screen.getAllByRole("link").filter((a) => a.getAttribute("href")!.startsWith("http"));
    // primary sources appear twice: in the summary column and in the full list
    const primaryLinked = linked.filter((s) => s.primary).length;
    expect(external).toHaveLength(linked.length + primaryLinked);
    for (const a of external) {
      expect(a).toHaveAttribute("target", "_blank");
      expect(a).toHaveAttribute("rel", "noopener noreferrer");
      expect(a.getAttribute("aria-label")).toMatch(/\(opens in a new tab\)$/);
    }
  });

  it("lists the grounded primary sources", () => {
    render(<AttributionFooter />);
    const column = screen.getByRole("region", { name: "Facts rest on primary sources" });
    const names = within(column).getAllByRole("link").map((a) => a.getAttribute("aria-label"));
    for (const who of ["UNESCO", "Pew Research", "Stanford", "W3C", "FTC", "CFPB", "Artificial Intelligence Act"]) {
      expect(names.some((n) => n!.includes(who))).toBe(true);
    }
  });

  it("credits only models with a record of their work", () => {
    render(<AttributionFooter />);
    const column = screen.getByRole("region", { name: "AI helped research and draft" });
    for (const m of registry.models) {
      const shown = within(column).queryByText(`${m.name} (${m.maker})`);
      if (m.confirmed) expect(shown).toBeInTheDocument();
      else expect(shown).not.toBeInTheDocument();
    }
  });

  it("states honestly that human review is pending", () => {
    render(<AttributionFooter />);
    expect(screen.getByTestId("review-status")).toHaveTextContent(
      "Not yet complete. Robert Sweetman reviews each page before launch."
    );
    expect(screen.getByText("23 September 2026")).toBeInTheDocument();
  });

  it("thanks the family who inspired the translations", () => {
    render(<AttributionFooter />);
    expect(screen.getByTestId("translation-thanks")).toHaveTextContent(
      "These translations exist thanks to my grandparents, Giuffrido and Isolina DiCenso, and my parents, Joanne Sweetman and Robert Sweetman Sr."
    );
  });

  it("shows the reviewer and date once review is recorded", () => {
    const reviewed: Registry = {
      ...sources,
      review: { reviewer: "Robert Sweetman", status: "reviewed", reviewedOn: "2026-10-01" },
    };
    render(<AttributionFooter registry={reviewed} />);
    expect(screen.getByTestId("review-status")).toHaveTextContent(
      "Reviewed by Robert Sweetman on 1 October 2026."
    );
  });

  it("expands to the full registry and links to /sources", () => {
    render(<AttributionFooter />);
    const details = screen.getByText(/^See all/).closest("details")!;
    expect(details).not.toHaveAttribute("open");
    expect(within(details).getByRole("link", { name: "Open the full source registry" })).toHaveAttribute(
      "href",
      "/en/sources"
    );
  });
});

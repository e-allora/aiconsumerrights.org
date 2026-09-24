import { render, screen, within } from "@/test-utils";

import GuidePage from "@/app/[locale]/guide/page";
import { Cite } from "@/components/ui/Cite";
import { getSource } from "@/lib/sources";

describe("Guide page", () => {
  beforeEach(() => render(<GuidePage params={{ locale: "en" }} />));

  it("has one h1 and front-loaded, action-first section headings", () => {
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("AI you can question");

    const h2s = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(h2s).toEqual([
      "Spot the AI in your day",
      "Compare the rules in the US, the EU, Brazil, and Italy",
      "Take three calm steps when a decision seems wrong",
      "See every side of the table",
    ]);
  });

  it("opens every section with a bold lead sentence", () => {
    for (const id of ["touchpoints", "compare", "everyone"]) {
      const section = screen.getByRole("region", { name: document.getElementById(id)!.textContent! });
      const firstPara = within(section).getAllByText((_, el) => el?.tagName === "P")[0];
      expect(firstPara.firstElementChild?.tagName).toBe("STRONG");
    }
  });

  it("bolds the three AI touchpoints as scannable anchor terms", () => {
    for (const term of ["Chatbots", "Recommendation algorithms", "Automated screening"]) {
      expect(screen.getByRole("heading", { level: 3, name: term })).toBeInTheDocument();
      const bold = screen.getAllByText(term, { selector: "strong" });
      expect(bold.length).toBeGreaterThan(0);
    }
  });

  it("labels each rule as law or guidance and names the place", () => {
    const labels = screen.getAllByText(/^(Law|Guidance|Research) ?(\(.+\))?\.$/, { selector: "strong" });
    expect(labels.map((l) => l.textContent)).toEqual(
      expect.arrayContaining(["Law (EU).", "Law (US).", "Law (US, credit).", "Guidance.", "Research (2026)."])
    );
  });

  it("compares US, EU, Brazil, and Italy rules in a table with proper headers", () => {
    const table = screen.getByRole("table", { name: /US, EU, Brazil, and Italy rules compared/ });
    const cols = within(table).getAllByRole("columnheader").map((c) => c.textContent);
    expect(cols).toEqual(["Your question", "United States", "European Union", "Brazil", "Italy"]);
    expect(within(table).getAllByRole("rowheader")).toHaveLength(5);
  });

  it("cites every Italy cell to Law 132/2025, EU law, or the Garante, and names no company", () => {
    const table = screen.getByRole("table", { name: /Italy rules compared/ });
    const italy = within(table)
      .getAllByRole("row")
      .slice(1)
      .map((row) => within(row).getAllByRole("cell")[3]);
    const cited = (cell: HTMLElement) =>
      within(cell)
        .queryAllByRole("link")
        .map((a) => a.getAttribute("href")!.replace("/en/sources#", ""));
    expect(italy.map(cited)).toEqual([
      ["eu-ai-act-art50", "it-law-132-2025"],
      ["gdpr", "it-law-132-2025"],
      ["gdpr", "it-law-132-2025"],
      ["it-law-132-2025", "garante-en"],
      ["it-law-132-normattiva", "it-law-132-2025"],
    ]);
    expect(italy[3]).toHaveTextContent("Garante");
    expect(italy[4]).toHaveTextContent("in force since 10 October 2025");
  });

  it("cites every Brazil cell: the LGPD for rights in force, PL 2338/2023 for what is pending", () => {
    const table = screen.getByRole("table", { name: /rules compared/ });
    const brazil = within(table)
      .getAllByRole("row")
      .slice(1)
      .map((row) => within(row).getAllByRole("cell")[2]);
    const cited = (cell: HTMLElement) =>
      within(cell)
        .queryAllByRole("link")
        .map((a) => a.getAttribute("href")!.replace("/en/sources#", ""));
    expect(brazil.map(cited)).toEqual([
      ["pl2338-senado-2024", "pl2338-camara-status"],
      ["anpd-lgpd-en", "lawsofbrazil-2026"],
      ["anpd-lgpd-en", "iba-mariotto-2024"],
      ["anpd-lgpd-en", "lgpd-article-20"],
      ["pl2338-senado-2024", "pl2338-camara-status"],
    ]);
    // The AI bill is pending: the cells must say so, and date the status.
    expect(brazil[0]).toHaveTextContent("It is still a bill.");
    expect(brazil[4]).toHaveTextContent("As of 23 September 2026");
    expect(brazil[1]).toHaveTextContent("15 days");
    expect(brazil[2]).toHaveTextContent("no longer says a person must do the review");
  });

  it("cites only sources that exist in the registry", () => {
    const cites = screen.getAllByRole("link", { name: /^Source \d+:/ });
    expect(cites.length).toBeGreaterThan(10);
    for (const link of cites) {
      const id = link.getAttribute("href")!.replace("/en/sources#", "");
      expect(() => getSource(id)).not.toThrow();
    }
  });

  it("keeps the blameless tone: no 'we', no blame words, no em dashes, no named companies", () => {
    // Join text nodes with spaces: textContent runs blocks together ("tableWe").
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const parts: string[] = [];
    while (walker.nextNode()) parts.push(walker.currentNode.textContent!);
    const text = parts.join(" ");
    expect(text).not.toMatch(/\b(we|We|our|Our|us)\b/);
    expect(text).not.toMatch(/\b(scam|fraud|shame|greedy|evil|exploit|deceiv|trick|blame)/i);
    expect(text).not.toContain("—");
    expect(text).not.toMatch(/\b(OpenAI|Google|Meta|Amazon|Microsoft|Apple|Anthropic|Rite Aid)\b/);
  });

  it("names every stakeholder group with good faith", () => {
    for (const who of ["People using AI", "Educators", "Regulators", "Teams that build AI"]) {
      expect(screen.getByText(who, { selector: "strong" })).toBeInTheDocument();
    }
  });
});

describe("Cite", () => {
  it("throws on an unknown source id, so a bad citation cannot ship", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Cite ids={["no-such-source"]} />)).toThrow("Unknown source id");
  });
});

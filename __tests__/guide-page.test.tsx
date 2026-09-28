import { fireEvent, render, screen, within } from "@/test-utils";

import GuidePage from "@/app/[locale]/guide/page";
import { COMPARE_COUNTRIES, COMPARISON } from "@/components/guide/CompareTable";
import { Cite } from "@/components/ui/Cite";
import { MESSAGES } from "@/test-utils";
import { getSource } from "@/lib/sources";

describe("Guide page", () => {
  beforeEach(() => render(<GuidePage params={{ locale: "en" }} />));

  it("has one h1 and front-loaded, action-first section headings", () => {
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("AI you can question");

    const h2s = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(h2s).toEqual([
      "Spot the AI in your day",
      "Compare the rules in the US, the EU, and other countries",
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

  // The table's cells after the row header: US, EU, then the picked country.
  const countryCells = () =>
    within(screen.getByRole("table", { name: /Rules compared/ }))
      .getAllByRole("row")
      .slice(1)
      .map((row) => within(row).getAllByRole("cell")[2]);
  const cited = (cell: HTMLElement) =>
    within(cell)
      .queryAllByRole("link")
      .map((a) => a.getAttribute("href")!.replace("/en/sources#", ""));

  it("always shows the US and the EU, plus one country the visitor picks", () => {
    const table = screen.getByRole("table", { name: "Rules compared: US, EU, and Brazil, as of 23 September 2026" });
    const cols = within(table).getAllByRole("columnheader").map((c) => c.textContent);
    expect(cols).toEqual(["Your question", "United States", "European Union", "Brazil"]);
    expect(within(table).getAllByRole("rowheader")).toHaveLength(5);

    const picker = screen.getByRole("group", { name: "Compare with" });
    const radios = within(picker).getAllByRole("radio");
    expect(radios.map((r) => r.closest("label")!.textContent)).toEqual(["Brazil", "France", "Italy"]);
    expect(within(picker).getByRole("radio", { name: "Brazil" })).toBeChecked();

    fireEvent.click(within(picker).getByRole("radio", { name: "Italy" }));
    expect(screen.getByRole("table", { name: /US, EU, and Italy/ })).toBeInTheDocument();
    expect(within(table).getAllByRole("columnheader").at(-1)).toHaveTextContent("Italy");
    expect(screen.getByText("Italy follows EU rules and adds its own national AI law.")).toBeInTheDocument();
  });

  it("has a cell and citations for every row in every country", () => {
    for (const row of COMPARISON) {
      for (const c of COMPARE_COUNTRIES) {
        expect(MESSAGES.en.Guide.compare.rows[row.id as keyof typeof MESSAGES.en.Guide.compare.rows]).toHaveProperty(c);
        expect(row[c].length).toBeGreaterThan(0);
      }
    }
  });

  it("cites every Italy cell to Law 132/2025, EU law, or the Garante, and names no company", () => {
    fireEvent.click(screen.getByRole("radio", { name: "Italy" }));
    const italy = countryCells();
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

  it("cites every France cell, and frames its AI Act oversight as a dated bill", () => {
    fireEvent.click(screen.getByRole("radio", { name: "France" }));
    const france = countryCells();
    expect(france.map(cited)).toEqual([
      ["eu-ai-act-art50", "fr-crpa-l311-3-1", "fr-loi-2023-451-art5"],
      ["gdpr", "fr-crpa-l311-3-1", "fr-crpa-r311-3-1-2"],
      ["gdpr", "fr-loi-78-17-art47", "fr-cnil-intervention-humaine"],
      ["fr-cnil-ria-qr", "fr-conso-l511-7"],
      ["fr-ddadue-senate-text", "fr-senat-dossier-pjl25-118", "fr-an-dossier-2518"],
    ]);
    expect(france[3]).toHaveTextContent("has not yet named its EU AI Act authorities in law");
    expect(france[4]).toHaveTextContent("A bill passed by the Senate");
    expect(france[4]).toHaveTextContent("As of 27 September 2026");
  });

  it("cites every Brazil cell: the LGPD for rights in force, PL 2338/2023 for what is pending", () => {
    const brazil = countryCells();
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

describe("Guide comparison picker", () => {
  it.each([
    ["it", "Italia"],
    ["pt-BR", "Brasil"],
    ["fr", "France"],
    ["es", "Brasil"],
  ] as const)("opens in %s on %s", (locale, country) => {
    render(<GuidePage params={{ locale }} />, { locale });
    expect(screen.getByRole("radio", { name: country })).toBeChecked();
    expect(screen.getAllByRole("columnheader").at(-1)).toHaveTextContent(country);
  });
});

describe("Cite", () => {
  it("throws on an unknown source id, so a bad citation cannot ship", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Cite ids={["no-such-source"]} />)).toThrow("Unknown source id");
  });
});

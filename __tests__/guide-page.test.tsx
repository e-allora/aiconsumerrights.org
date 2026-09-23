import { render, screen, within } from "@testing-library/react";

import GuidePage from "@/app/guide/page";
import { Cite } from "@/components/ui/Cite";
import { getSource } from "@/lib/sources";

describe("Guide page", () => {
  beforeEach(() => render(<GuidePage />));

  it("has one h1 and front-loaded, action-first section headings", () => {
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("AI you can question");

    const h2s = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(h2s).toEqual([
      "Spot the AI in your day",
      "Compare the rules in the US and the EU",
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

  it("compares US and EU rules in a table with proper headers", () => {
    const table = screen.getByRole("table", { name: /US and EU rules compared/ });
    const cols = within(table).getAllByRole("columnheader").map((c) => c.textContent);
    expect(cols).toEqual(["Your question", "United States", "European Union"]);
    expect(within(table).getAllByRole("rowheader")).toHaveLength(5);
  });

  it("cites only sources that exist in the registry", () => {
    const cites = screen.getAllByRole("link", { name: /^Source \d+:/ });
    expect(cites.length).toBeGreaterThan(10);
    for (const link of cites) {
      const id = link.getAttribute("href")!.replace("/sources#", "");
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

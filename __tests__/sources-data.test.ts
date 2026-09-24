import { sources } from "@/lib/sources";

const all = sources.categories.flatMap((c) => c.sources);

describe("lib/data/sources.json", () => {
  it("has the seven source categories", () => {
    expect(sources.categories.map((c) => c.id)).toEqual([
      "governance",
      "empirical",
      "accessibility",
      "usability",
      "synthesis",
      "latam-global",
      "eu-national",
    ]);
  });

  it("anchors Brazil's LGPD on the ANPD's official English translation", () => {
    const lgpd = sources.categories.find((c) => c.id === "latam-global")!.sources;
    const anpd = lgpd.find((s) => s.id === "anpd-lgpd-en")!;
    expect(anpd).toMatchObject({ status: "confirmed", primary: true, jurisdiction: "Brazil (LGPD)" });
    expect(anpd.url).toMatch(/^https:\/\/www\.gov\.br\/anpd\//);
    // The third-party text is labeled unofficial, never "official".
    const unofficial = lgpd.find((s) => s.id === "lgpd-article-20")!;
    expect(unofficial.type).toMatch(/unofficial/i);
    for (const s of lgpd) expect(`${s.summary ?? ""} ${s.type}`).not.toMatch(/\bofficial text\b/i);
  });

  it("keeps existing source numbers stable by adding new sources at the end", () => {
    const ids = all.map((s) => s.id);
    expect(ids.indexOf("anpd-lgpd-en")).toBeGreaterThan(ids.indexOf("vercel-ai-sdk"));
  });

  it("uses unique ids", () => {
    const ids = all.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has plain text, not HTML entities, in titles", () => {
    for (const s of all) expect(s.title).not.toMatch(/&[a-z]+;/);
  });

  it("gives linked sources an https URL, and no-link sources none", () => {
    for (const s of all) {
      if (s.status === "no-link") expect(s.url).toBeUndefined();
      else expect(s.url).toMatch(/^https:\/\//);
    }
  });

  it("uses ISO dates for the check date and any review date", () => {
    expect(sources.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    if (sources.review.reviewedOn) expect(sources.review.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(sources.review.status === "reviewed").toBe(sources.review.reviewedOn !== null);
  });
});

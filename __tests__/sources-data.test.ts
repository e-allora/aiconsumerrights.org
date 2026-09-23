import { sources } from "@/lib/sources";

const all = sources.categories.flatMap((c) => c.sources);

describe("lib/data/sources.json", () => {
  it("has the five source categories", () => {
    expect(sources.categories.map((c) => c.id)).toEqual([
      "governance",
      "empirical",
      "accessibility",
      "usability",
      "synthesis",
    ]);
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

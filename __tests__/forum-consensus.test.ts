/** @jest-environment node */
import { GET } from "@/app/api/forum/results/route";
import { RULES, broadAgreement, progress, type CountRow } from "@/lib/forum/consensus";

let dbRows: Record<string, unknown>[] = [];
let dbError: Error | null = null;
jest.mock("@/lib/forum/db", () => ({
  getSql: () => async () => {
    if (dbError) throw dbError;
    return dbRows;
  },
}));

const row = (locale: string, agree: number, disagree: number, pass = 0, statementId = "t2-reasons"): CountRow => ({
  statementId,
  locale,
  agree,
  disagree,
  pass,
});

describe("broadAgreement", () => {
  it("uses the agreed rules: 60% in every group, 20 votes per group, 2 groups", () => {
    expect(RULES).toEqual({ threshold: 60, minVotes: 20, minGroups: 2 });
  });

  it("shows a statement when every counted language agrees at 60% or more", () => {
    const [result, ...rest] = broadAgreement([row("en", 18, 2), row("it", 12, 8)]);
    expect(rest).toEqual([]);
    expect(result).toEqual({
      id: "t2-reasons",
      groups: [
        { locale: "en", agree: 90, votes: 20 },
        { locale: "it", agree: 60, votes: 20 },
      ],
      lowest: 60,
    });
  });

  it("leaves it out when any counted language is below 60%, even by a hair", () => {
    // 119 of 200 is 59.5%: must not round up to 60.
    expect(broadAgreement([row("en", 100, 0), row("es", 119, 81)])).toEqual([]);
  });

  it("does not let a big majority in one language stand in for common ground", () => {
    expect(broadAgreement([row("en", 500, 10), row("es", 15, 0)])).toEqual([]);
  });

  it("ignores passes: 8 passes and 2 agrees is not enough votes, and not 100%", () => {
    expect(broadAgreement([row("en", 2, 0, 8), row("it", 2, 0, 8)])).toEqual([]);
    expect(broadAgreement([row("en", 20, 0, 500), row("it", 20, 0, 0)])[0].groups[0]).toEqual({
      locale: "en",
      agree: 100,
      votes: 20,
    });
  });

  it("skips a language below the vote minimum instead of failing the statement", () => {
    const [result] = broadAgreement([row("en", 20, 0), row("it", 20, 0), row("es", 0, 19)]);
    expect(result.groups.map((g) => g.locale)).toEqual(["en", "it"]);
  });

  it("rounds percents down so results never look stronger than they are", () => {
    const [result] = broadAgreement([row("en", 199, 1), row("it", 20, 0)]);
    expect(result.groups[0].agree).toBe(99);
  });

  it("ignores unknown statements and languages", () => {
    expect(broadAgreement([row("en", 50, 0, 0, "fake"), row("xx", 50, 0), row("en", 50, 0)])).toEqual([]);
  });

  it("lists statements in the order people vote on them", () => {
    const rows = ["t4-together", "t1-disclose"].flatMap((id) => [row("en", 20, 0, 0, id), row("es", 20, 0, 0, id)]);
    expect(broadAgreement(rows).map((r) => r.id)).toEqual(["t1-disclose", "t4-together"]);
  });
});

describe("progress", () => {
  it("counts every vote, passes included, and the languages they came from", () => {
    expect(progress([row("en", 3, 1, 2), row("it", 1, 0, 0), row("xx", 9, 9, 9)])).toEqual({ votes: 7, languages: 2 });
    expect(progress([])).toEqual({ votes: 0, languages: 0 });
  });
});

describe("GET /api/forum/results", () => {
  beforeEach(() => {
    dbRows = [];
    dbError = null;
    jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it("returns counts only, as numbers, cached at the CDN for a minute but not in browsers", async () => {
    dbRows = [{ statement_id: "t1-disclose", locale: "es", agree: 3, disagree: "1", pass: 0 }];
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      rows: [{ statementId: "t1-disclose", locale: "es", agree: 3, disagree: 1, pass: 0 }],
    });
    expect(res.headers.get("vercel-cdn-cache-control")).toBe("max-age=60, stale-while-revalidate=300");
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("returns 500 and nothing cached when the database is down", async () => {
    dbError = new Error("down");
    const res = await GET();
    expect(res.status).toBe(500);
    expect(res.headers.get("vercel-cdn-cache-control")).toBeNull();
  });
});

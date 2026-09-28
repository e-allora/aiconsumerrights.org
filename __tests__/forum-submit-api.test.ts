/** @jest-environment node */
import { NextRequest } from "next/server";

import { POST } from "@/app/api/forum/submit/route";
import { GET as getSuggestions } from "@/app/api/forum/suggestions/route";
import { precheck } from "@/lib/forum/precheck";
import { cleanText, hasContactInfo, parseSubmission, recheckSubmission } from "@/lib/forum/submissions";

const queries: { text: string; values: unknown[] }[] = [];
let dbRows: unknown[] = [];
let dbError: Error | null = null;
jest.mock("@/lib/forum/db", () => ({
  getSql: () => async (strings: TemplateStringsArray, ...values: unknown[]) => {
    if (dbError) throw dbError;
    queries.push({ text: strings.join("?").replace(/\s+/g, " ").trim(), values });
    return dbRows;
  },
}));
jest.mock("@/lib/forum/precheck", () => ({ precheck: jest.fn() }));
const mockPrecheck = precheck as jest.MockedFunction<typeof precheck>;

const SITE = "https://aiconsumerrights.org";
const CHECK = { namesCompany: false, namesPerson: false, contactInfo: false, attack: false, english: "Reasons should be plain." };

function submit(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new NextRequest(`${SITE}/api/forum/submit`, {
      method: "POST",
      headers: { host: "aiconsumerrights.org", origin: SITE, "content-type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
  );
}

beforeEach(() => {
  queries.length = 0;
  dbRows = [];
  dbError = null;
  mockPrecheck.mockReset().mockResolvedValue(CHECK);
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe("hasContactInfo", () => {
  it.each([
    "Email me at ana@example.com",
    "See https://example.org",
    "See www.example.org",
    "Visit example.com for more",
    "Ask @someone about it",
    "Call +1 555 123 4567",
    "Call +39 347 123 4567",
    "Ligue (11) 91234-5678",
    "Llama al 612 34 56 78",
  ])("catches: %s", (text) => {
    expect(hasContactInfo(text)).toBe(true);
  });

  it.each([
    "Law 13,853/2019 changed Art. 20.",
    "In 2025, 60% of people wanted reasons.",
    "Companies in the U.S. and the EU should explain AI, e.g. in plain words.",
    "Apps should say when a chat is automated.",
    "Banks should give 30 days' notice.",
  ])("lets through: %s", (text) => {
    expect(hasContactInfo(text)).toBe(false);
  });

  it("gives the same answer every time, unlike a /g regex that keeps state", () => {
    const text = "Email me at ana@example.com";
    expect([1, 2, 3].map(() => hasContactInfo(text))).toEqual([true, true, true]);
  });
});

describe("cleanText", () => {
  it("collapses spaces and line breaks, and trims", () => {
    expect(cleanText("  Plain\n\n  reasons\tplease  ")).toBe("Plain reasons please");
  });

  it("rejects empty text and text over 140 characters, counting accents as one", () => {
    expect(cleanText("   ")).toBeNull();
    expect(cleanText("é".repeat(140))).toBe("é".repeat(140));
    expect(cleanText("x".repeat(141))).toBeNull();
  });
});

describe("parseSubmission", () => {
  it("accepts clean text in a site language", () => {
    expect(parseSubmission({ text: " Reasons should be plain. ", locale: "pt-BR" })).toEqual({
      text: "Reasons should be plain.",
      locale: "pt-BR",
    });
  });

  it.each([
    [{ text: "ok", locale: "ja" }],
    [{ text: 42, locale: "en" }],
    [{ locale: "en" }],
    [null],
  ])("rejects a bad body: %j", (body) => {
    expect(parseSubmission(body)).toBe("invalid");
  });

  it("turns back contact details", () => {
    expect(parseSubmission({ text: "write to ana@example.com", locale: "en" })).toBe("contact");
  });
});

describe("POST /api/forum/submit", () => {
  it("saves a clean suggestion as pending, with the pre-check result", async () => {
    const res = await submit({ text: "Reasons should be plain.", locale: "it" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(mockPrecheck).toHaveBeenCalledWith("Reasons should be plain.", "it");
    expect(queries).toEqual([
      {
        text: "INSERT INTO submissions (text, locale, ai_check) VALUES (?, ?, ?::jsonb)",
        values: ["Reasons should be plain.", "it", JSON.stringify(CHECK)],
      },
    ]);
  });

  it("still saves the suggestion, marked unchecked, when the pre-check can't run", async () => {
    mockPrecheck.mockResolvedValue(null);
    const res = await submit({ text: "Reasons should be plain.", locale: "en" });
    expect(res.status).toBe(200);
    expect(queries[0].values).toEqual(["Reasons should be plain.", "en", null]);
  });

  it("turns back contact details with 422 and stores nothing", async () => {
    const res = await submit({ text: "Call me on +39 347 123 4567", locale: "it" });
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ ok: false, error: "contact" });
    expect(mockPrecheck).not.toHaveBeenCalled();
    expect(queries).toHaveLength(0);
  });

  it("refuses other sites, bad bodies, and over-long text", async () => {
    expect((await submit({ text: "ok", locale: "en" }, { origin: "https://example.com" })).status).toBe(403);
    expect((await submit("{nope")).status).toBe(400);
    expect((await submit({ text: "x".repeat(141), locale: "en" })).status).toBe(400);
    expect(queries).toHaveLength(0);
  });

  it("returns 500 when the database is down", async () => {
    dbError = new Error("down");
    expect((await submit({ text: "Reasons should be plain.", locale: "en" })).status).toBe(500);
  });
});

describe("recheckSubmission", () => {
  const ID = "5f0c6d6e-2f7a-4f0e-9a51-9a4c1d3f0a11";

  it("runs the check on the saved text and stores a new result", async () => {
    dbRows = [{ text: "Le ragioni devono essere chiare.", locale: "it" }];
    const run = jest.fn().mockResolvedValue(CHECK);
    await recheckSubmission(ID, run);
    expect(run).toHaveBeenCalledWith("Le ragioni devono essere chiare.", "it");
    expect(queries[1]).toEqual({
      text: "UPDATE submissions SET ai_check = ?::jsonb WHERE id = ?",
      values: [JSON.stringify(CHECK), ID],
    });
  });

  it("leaves the row alone when the check still can't run", async () => {
    dbRows = [{ text: "x", locale: "en" }];
    await recheckSubmission(ID, jest.fn().mockResolvedValue(null));
    expect(queries).toHaveLength(1);
  });

  it("ignores ids that are not UUIDs", async () => {
    const run = jest.fn();
    await recheckSubmission("1 OR 1=1", run);
    expect(run).not.toHaveBeenCalled();
    expect(queries).toHaveLength(0);
  });
});

describe("GET /api/forum/suggestions", () => {
  const get = (locale: string) => getSuggestions(new NextRequest(`${SITE}/api/forum/suggestions?locale=${locale}`));

  it("lists approved suggestions for one language as votable statements", async () => {
    dbRows = [{ id: "5f0c6d6e-2f7a-4f0e-9a51-9a4c1d3f0a11", text: "Le ragioni devono essere chiare." }];
    const res = await get("it");
    expect(await res.json()).toEqual({
      statements: [{ id: "s-5f0c6d6e-2f7a-4f0e-9a51-9a4c1d3f0a11", text: "Le ragioni devono essere chiare." }],
    });
    expect(queries[0].text).toMatch(/WHERE status = 'approved' AND locale = \?/);
    expect(queries[0].values).toEqual(["it"]);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("vercel-cdn-cache-control")).toBe("max-age=60, stale-while-revalidate=300");
  });

  it("refuses an unknown language", async () => {
    expect((await get("xx")).status).toBe(400);
    expect(queries).toHaveLength(0);
  });
});

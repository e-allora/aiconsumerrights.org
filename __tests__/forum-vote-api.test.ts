/** @jest-environment node */
import { NextRequest } from "next/server";

import { DELETE, POST } from "@/app/api/forum/vote/route";
import { VOTER_COOKIE, hashVoter, parseVote } from "@/lib/forum/votes";

// A fake Neon query function that records each query and its values.
const queries: { text: string; values: unknown[] }[] = [];
let dbError: Error | null = null;
jest.mock("@/lib/forum/db", () => ({
  getSql: () => async (strings: TemplateStringsArray, ...values: unknown[]) => {
    if (dbError) throw dbError;
    queries.push({ text: strings.join("?").replace(/\s+/g, " ").trim(), values });
    return [];
  },
}));

const SITE = "https://aiconsumerrights.org";
const VALID = { statementId: "t1-disclose", vote: "agree", locale: "it" };

function request(method: "POST" | "DELETE", body?: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(`${SITE}/api/forum/vote`, {
    method,
    headers: { host: "aiconsumerrights.org", origin: SITE, "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  queries.length = 0;
  dbError = null;
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe("parseVote", () => {
  it("accepts a known statement, a real choice, and a site language", () => {
    expect(parseVote(VALID)).toEqual(VALID);
    for (const locale of ["en", "es", "pt-PT", "pt-BR", "it"]) expect(parseVote({ ...VALID, locale })).not.toBeNull();
  });

  it.each([
    ["an unknown statement", { ...VALID, statementId: "made-up" }],
    ["an unknown choice", { ...VALID, vote: "AGREE" }],
    ["an unknown language", { ...VALID, locale: "xx".repeat(50) }],
    ["a missing field", { statementId: "t1-disclose", vote: "agree" }],
    ["no body", null],
    ["a string body", "agree"],
  ])("rejects %s", (_label, body) => {
    expect(parseVote(body)).toBeNull();
  });
});

describe("hashVoter", () => {
  it("stores a 64-character hash, never the code itself", () => {
    const code = "5f0c6d6e-2f7a-4f0e-9a51-9a4c1d3f0a11";
    expect(hashVoter(code)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashVoter(code)).not.toContain(code);
    expect(hashVoter(code)).toBe(hashVoter(code));
  });
});

describe("POST /api/forum/vote", () => {
  it("saves a new vote under a hashed code and gives the browser that code", async () => {
    const res = await POST(request("POST", VALID));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const cookie = res.cookies.get(VOTER_COOKIE)!;
    expect(cookie.value).toMatch(/^[0-9a-f-]{36}$/);
    expect(cookie).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/api/forum" });
    const header = res.headers.get("set-cookie")!;
    expect(header).toMatch(/HttpOnly/i);
    expect(header).toMatch(/Max-Age=15552000/);

    expect(queries).toHaveLength(1);
    expect(queries[0].text).toMatch(/^INSERT INTO votes .* ON CONFLICT \(statement_id, voter\) DO UPDATE/);
    expect(queries[0].values).toEqual(["t1-disclose", hashVoter(cookie.value), "agree", "it"]);
  });

  it("reuses the browser's code, so a second vote replaces the first", async () => {
    const code = "11111111-2222-4333-8444-555555555555";
    const res = await POST(request("POST", { ...VALID, vote: "disagree" }, { cookie: `${VOTER_COOKIE}=${code}` }));
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(queries[0].values).toEqual(["t1-disclose", hashVoter(code), "disagree", "it"]);
  });

  it("refuses votes sent from another site, or with no origin", async () => {
    for (const origin of ["https://example.com", "not a url"]) {
      const res = await POST(request("POST", VALID, { origin }));
      expect(res.status).toBe(403);
    }
    const noOrigin = request("POST", VALID);
    noOrigin.headers.delete("origin");
    expect((await POST(noOrigin)).status).toBe(403);
    expect(queries).toHaveLength(0);
  });

  it("returns 400 for a bad vote or a body that is not JSON", async () => {
    expect((await POST(request("POST", { ...VALID, vote: "maybe" }))).status).toBe(400);
    expect((await POST(request("POST", "{not json"))).status).toBe(400);
    expect(queries).toHaveLength(0);
  });

  it("returns 500 without a cookie when the database is down", async () => {
    dbError = new Error("connection refused");
    const res = await POST(request("POST", VALID));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: "unavailable" });
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});

describe("DELETE /api/forum/vote", () => {
  it("deletes every vote for the browser's code and expires the cookie", async () => {
    const code = "11111111-2222-4333-8444-555555555555";
    const res = await DELETE(request("DELETE", undefined, { cookie: `${VOTER_COOKIE}=${code}` }));
    expect(res.status).toBe(200);
    expect(queries).toEqual([{ text: "DELETE FROM votes WHERE voter = ?", values: [hashVoter(code)] }]);
    expect(res.headers.get("set-cookie")).toMatch(/Max-Age=0/);
  });

  it("succeeds without touching the database when the browser has no code", async () => {
    const res = await DELETE(request("DELETE"));
    expect(res.status).toBe(200);
    expect(queries).toHaveLength(0);
  });

  it("refuses deletes from another site", async () => {
    const res = await DELETE(request("DELETE", undefined, { origin: "https://example.com", cookie: `${VOTER_COOKIE}=x` }));
    expect(res.status).toBe(403);
    expect(queries).toHaveLength(0);
  });

  it("reports a failure instead of claiming the votes are gone", async () => {
    dbError = new Error("down");
    const res = await DELETE(request("DELETE", undefined, { cookie: `${VOTER_COOKIE}=x` }));
    expect(res.status).toBe(500);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});

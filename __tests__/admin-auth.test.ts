/** @jest-environment node */
import { NextRequest } from "next/server";

import { isAdmin } from "@/lib/admin-auth";
import proxy from "@/proxy";

const PASSWORD = "correct horse battery staple";
const basic = (user: string, pass: string) =>
  `Basic ${Buffer.from(`${user}:${pass}`, "utf8").toString("base64")}`;

describe("isAdmin", () => {
  it("accepts the password with any username", () => {
    expect(isAdmin(basic("robert", PASSWORD), PASSWORD)).toBe(true);
    expect(isAdmin(basic("", PASSWORD), PASSWORD)).toBe(true);
  });

  it("accepts a password with accents and colons", () => {
    const pass = "Giuffrido:Isolina-Nonno è";
    expect(isAdmin(basic("r", pass), pass)).toBe(true);
  });

  it.each([
    ["a wrong password", basic("robert", "correct horse battery stapl")],
    ["a longer password", basic("robert", PASSWORD + "!")],
    ["no header", null],
    ["another scheme", `Bearer ${PASSWORD}`],
    ["broken base64", "Basic %%%"],
    ["no colon", `Basic ${Buffer.from(PASSWORD).toString("base64")}`],
  ])("refuses %s", (_label, header) => {
    expect(isAdmin(header, PASSWORD)).toBe(false);
  });

  it("lets nobody in when the password is missing or shorter than 12 characters", () => {
    expect(isAdmin(basic("r", ""), undefined)).toBe(false);
    expect(isAdmin(basic("r", "short-pass1"), "short-pass1")).toBe(false);
  });
});

describe("proxy on /admin", () => {
  const visit = (path: string, authorization?: string) =>
    proxy(
      new NextRequest(`https://aiconsumerrights.org${path}`, {
        headers: authorization ? { authorization } : {},
      })
    );

  beforeEach(() => {
    process.env.FORUM_ADMIN_PASSWORD = PASSWORD;
  });
  afterEach(() => {
    delete process.env.FORUM_ADMIN_PASSWORD;
  });

  it("asks for the password, without adding a locale", async () => {
    for (const path of ["/admin", "/admin/anything"]) {
      const res = await visit(path);
      expect(res.status).toBe(401);
      expect(res.headers.get("www-authenticate")).toBe('Basic realm="Forum review", charset="UTF-8"');
      expect(res.headers.get("location")).toBeNull();
    }
  });

  it("refuses a wrong password and lets the right one through", async () => {
    expect((await visit("/admin", basic("r", "nope"))).status).toBe(401);
    const ok = await visit("/admin", basic("r", PASSWORD));
    expect(ok.status).toBe(200);
    expect(ok.headers.get("x-middleware-next")).toBe("1");
  });

  it("stays locked when no password is set on the server", async () => {
    delete process.env.FORUM_ADMIN_PASSWORD;
    expect((await visit("/admin", basic("r", PASSWORD))).status).toBe(401);
  });

  it("does not catch pages that only start with the same letters", async () => {
    const res = await visit("/administration");
    expect(res.status).not.toBe(401);
  });
});

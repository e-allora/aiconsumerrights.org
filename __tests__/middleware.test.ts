/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

import middleware, { config } from "@/middleware";

const visit = (path: string, acceptLanguage?: string) =>
  middleware(
    new NextRequest(`https://aiconsumerrights.org${path}`, {
      headers: acceptLanguage ? { "accept-language": acceptLanguage } : {},
    })
  );

describe("locale middleware", () => {
  it("sends a Spanish-language browser from / to /es", async () => {
    const res = await visit("/", "es-MX,es;q=0.9,en;q=0.5");
    expect(res.headers.get("location")).toBe("https://aiconsumerrights.org/es");
  });

  it.each([
    ["pt-BR,pt;q=0.9,en;q=0.5", "/pt-BR"],
    ["pt-PT,pt;q=0.9", "/pt"],
  ])("sends a Portuguese browser (%s) from / to %s", async (header, path) => {
    const res = await visit("/", header);
    expect(res.headers.get("location")).toBe(`https://aiconsumerrights.org${path}`);
  });

  it("sends an Italian browser from / to /it", async () => {
    const res = await visit("/", "it-IT,it;q=0.9,en;q=0.5");
    expect(res.headers.get("location")).toBe("https://aiconsumerrights.org/it");
  });

  it("sends an English-language browser from / to /en", async () => {
    const res = await visit("/", "en-US,en;q=0.9");
    expect(res.headers.get("location")).toBe("https://aiconsumerrights.org/en");
  });

  it("uses English when the browser prefers a language the site lacks", async () => {
    const res = await visit("/", "fr-FR,fr;q=0.9");
    expect(res.headers.get("location")).toBe("https://aiconsumerrights.org/en");
  });

  it("keeps the page when adding a locale to an old link", async () => {
    const res = await visit("/forum", "es");
    expect(res.headers.get("location")).toBe("https://aiconsumerrights.org/es/forum");
  });

  it("sends a bare Portuguese browser (pt) to Brazilian Portuguese, the most common variant", async () => {
    const res = await visit("/", "pt");
    expect(res.headers.get("location")).toBe("https://aiconsumerrights.org/pt-BR");
  });

  it.each([
    ["/pt-PT", "/pt"],
    ["/pt-PT/forum", "/pt/forum"],
    ["/pt-pt/guide", "/pt/guide"],
  ])("sends %s, typed by hand, to %s", async (path, target) => {
    const res = await visit(path, "en");
    expect(res.status).toBe(308);
    expect(res.headers.get("location")).toBe(`https://aiconsumerrights.org${target}`);
  });

  it("lets /en and /es pages through without a redirect", async () => {
    for (const path of ["/en/guide", "/es/forum", "/pt/about", "/pt-BR/guide", "/it/forum"]) {
      const res = await visit(path, "es");
      expect(res.headers.get("location")).toBeNull();
    }
  });

  it("skips files, the share image, and Next internals", () => {
    const matcher = new RegExp(`^${config.matcher[0]}$`);
    for (const path of ["/sitemap.xml", "/robots.txt", "/favicon.ico", "/opengraph-image", "/_next/static/x.js"]) {
      expect(matcher.test(path)).toBe(false);
    }
    for (const path of ["/", "/forum", "/es/guide"]) expect(matcher.test(path)).toBe(true);
  });
});

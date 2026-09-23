import { readFileSync } from "node:fs";
import { join } from "node:path";
import { XMLParser, XMLValidator } from "fast-xml-parser";
// The same serializer Next uses to turn app/sitemap.ts into /sitemap.xml.
import { resolveSitemap } from "next/dist/build/webpack/loaders/metadata/resolve-route-data";

import sitemap from "@/app/sitemap";
import { PUBLISHED_ROUTES, SITE_URL } from "@/lib/site";

describe("sitemap.xml", () => {
  const xml = resolveSitemap(sitemap());

  it("is well-formed XML", () => {
    expect(XMLValidator.validate(xml)).toBe(true);
  });

  it("uses the sitemaps.org urlset and lists every published route", () => {
    const doc = new XMLParser({ ignoreAttributes: false, isArray: (n) => n === "url" }).parse(xml);
    expect(doc.urlset["@_xmlns"]).toBe("http://www.sitemaps.org/schemas/sitemap/0.9");

    const locs: string[] = doc.urlset.url.map((u: { loc: string }) => u.loc);
    expect(locs).toHaveLength(PUBLISHED_ROUTES.length);
    for (const loc of locs) {
      expect(loc.startsWith(SITE_URL)).toBe(true);
      expect(() => new URL(loc)).not.toThrow();
    }
  });
});

describe("robots.txt", () => {
  it("allows crawling and points to the sitemap", () => {
    const robots = readFileSync(join(__dirname, "../public/robots.txt"), "utf8");
    expect(robots).toMatch(/^User-agent: \*$/m);
    expect(robots).toMatch(/^Allow: \/$/m);
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  });
});

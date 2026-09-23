import { XMLParser, XMLValidator } from "fast-xml-parser";
// The same serializer Next uses to turn app/sitemap.ts into /sitemap.xml.
import { resolveRobots, resolveSitemap } from "next/dist/build/webpack/loaders/metadata/resolve-route-data";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { NAV_ITEMS, PUBLISHED_ROUTES, SITE_URL } from "@/lib/site";

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
  const txt = resolveRobots(robots());

  it("allows crawling of every page", () => {
    expect(txt).toMatch(/^User-Agent: \*$/m);
    expect(txt).toMatch(/^Allow: \/$/m);
    expect(txt).not.toMatch(/^Disallow: \/$/m);
  });

  it("points crawlers to the sitemap and names the host", () => {
    expect(txt).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
    expect(txt).toContain(`Host: ${SITE_URL}`);
  });
});

describe("published routes", () => {
  it("list every page in the navigation", () => {
    const paths = PUBLISHED_ROUTES.map((r) => r.path);
    for (const item of NAV_ITEMS) expect(paths).toContain(item.href);
  });
});

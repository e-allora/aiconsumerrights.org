import { XMLParser, XMLValidator } from "fast-xml-parser";
// The same serializers Next uses to turn app/sitemap.ts and app/robots.ts into files.
import { resolveRobots, resolveSitemap } from "next/dist/build/webpack/loaders/metadata/resolve-route-data";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { routing } from "@/lib/i18n/routing";
import { NAV_ITEMS, PUBLISHED_ROUTES, SITE_URL } from "@/lib/site";

describe("sitemap.xml", () => {
  const xml = resolveSitemap(sitemap());
  const doc = new XMLParser({ ignoreAttributes: false, isArray: (n) => n === "url" || n === "xhtml:link" }).parse(xml);
  const urls: { loc: string; "xhtml:link": { "@_hreflang": string; "@_href": string }[] }[] = doc.urlset.url;

  it("is well-formed XML", () => {
    expect(XMLValidator.validate(xml)).toBe(true);
  });

  it("uses the sitemaps.org urlset with the xhtml namespace for translations", () => {
    expect(doc.urlset["@_xmlns"]).toBe("http://www.sitemaps.org/schemas/sitemap/0.9");
    expect(doc.urlset["@_xmlns:xhtml"]).toBe("http://www.w3.org/1999/xhtml");
  });

  it("lists every published route in every locale", () => {
    expect(urls).toHaveLength(PUBLISHED_ROUTES.length * routing.locales.length);
    for (const { path } of PUBLISHED_ROUTES) {
      for (const locale of routing.locales) {
        const loc = `${SITE_URL}/${locale}${path === "/" ? "" : path}`;
        expect(urls.map((u) => u.loc)).toContain(loc);
      }
    }
    for (const u of urls) expect(() => new URL(u.loc)).not.toThrow();
  });

  it("links each page to its translations with hreflang, plus x-default", () => {
    for (const u of urls) {
      const langs = u["xhtml:link"].map((l) => l["@_hreflang"]);
      expect(langs).toEqual(expect.arrayContaining(["en", "es", "x-default"]));
      for (const l of u["xhtml:link"]) expect(l["@_href"].startsWith(SITE_URL)).toBe(true);
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

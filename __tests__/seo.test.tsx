/**
 * @jest-environment node
 */
import { renderToStaticMarkup } from "react-dom/server";

import { metadata as aboutMeta } from "@/app/about/page";
import { metadata as forumMeta } from "@/app/forum/page";
import GuidePage, { metadata as guideMeta } from "@/app/guide/page";
import RootLayout, { metadata as rootMeta } from "@/app/layout";
import { alt as ogAlt, size as ogSize } from "@/app/opengraph-image";
import { metadata as sourcesMeta } from "@/app/sources/page";
import { SITE_URL } from "@/lib/site";

jest.mock("next/navigation", () => ({ usePathname: () => "/" }));
jest.mock("next/og", () => ({ ImageResponse: jest.fn() }));

function jsonLd(html: string) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) =>
    JSON.parse(m[1])
  );
}

describe("site metadata", () => {
  it("sets a title template, description, and social cards", () => {
    expect(rootMeta.title).toEqual({ default: "AI Consumer Rights", template: "%s | AI Consumer Rights" });
    expect(rootMeta.metadataBase?.toString()).toBe(`${SITE_URL}/`);
    expect(rootMeta.description).toMatch(/plain-language/i);
    expect(rootMeta.openGraph).toMatchObject({ type: "website", siteName: "AI Consumer Rights" });
    expect(rootMeta.twitter).toMatchObject({ card: "summary_large_image" });
    expect(rootMeta.robots).toEqual({ index: true, follow: true });
  });

  it.each([
    ["/guide", guideMeta],
    ["/forum", forumMeta],
    ["/sources", sourcesMeta],
    ["/about", aboutMeta],
  ])("%s has a title, description, canonical URL and OpenGraph URL", (path, meta) => {
    expect(meta.title).toBeTruthy();
    expect(String(meta.description).length).toBeGreaterThan(50);
    expect(meta.alternates?.canonical).toBe(path);
    expect(meta.openGraph?.url).toBe(path);
  });

  it.each([guideMeta, forumMeta, sourcesMeta, aboutMeta])("keeps the share image and its alt text", (meta) => {
    const [image] = meta.openGraph!.images as { url: string; width: number; height: number; alt: string }[];
    expect(image).toMatchObject({ url: "/opengraph-image", width: 1200, height: 630 });
    expect(image.alt).toBe(ogAlt);
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", images: ["/opengraph-image"] });
  });

  it("describes the share image in words and sizes it for OpenGraph", () => {
    expect(ogSize).toEqual({ width: 1200, height: 630 });
    expect(ogAlt).toMatch(/^AI Consumer Rights: Plain-language help/);
  });
});

describe("JSON-LD structured data", () => {
  it("declares the WebSite in the root layout", () => {
    const html = renderToStaticMarkup(<RootLayout><main /></RootLayout>);
    const [site] = jsonLd(html);
    expect(site).toMatchObject({ "@context": "https://schema.org", "@type": "WebSite", url: SITE_URL });
    expect(site.description).toMatch(/plain-language/i);
  });

  it("marks the guide as an Article with its fact-check date", () => {
    const [article] = jsonLd(renderToStaticMarkup(<GuidePage />));
    expect(article).toMatchObject({ "@type": "Article", headline: "AI you can question", dateModified: "2026-09-23" });
  });

  it("escapes '<' so data cannot close the script tag", () => {
    const html = renderToStaticMarkup(<RootLayout><main /></RootLayout>);
    const script = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1];
    expect(script).not.toContain("<");
  });
});

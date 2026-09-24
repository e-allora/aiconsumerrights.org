/**
 * @jest-environment node
 */
import { renderToStaticMarkup } from "react-dom/server";

import { generateMetadata as aboutMeta } from "@/app/[locale]/about/page";
import { generateMetadata as forumMeta } from "@/app/[locale]/forum/page";
import GuidePage, { generateMetadata as guideMeta } from "@/app/[locale]/guide/page";
import LocaleLayout, { generateMetadata as rootMeta } from "@/app/[locale]/layout";
import { size as ogSize } from "@/app/opengraph-image";
import { generateMetadata as sourcesMeta } from "@/app/[locale]/sources/page";
import { localizedPath } from "@/lib/i18n/routing";
import { SITE_URL } from "@/lib/site";
import { IntlWrapper } from "@/test-utils";

jest.mock("next/og", () => ({ ImageResponse: jest.fn() }));

const params = (locale: "en" | "es" | "pt-PT" | "pt-BR") => ({ params: { locale } });

function jsonLd(html: string) {
  return Array.from(html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)).map((m) =>
    JSON.parse(m[1])
  );
}

describe("site metadata", () => {
  it("sets a title template, description, and social cards in English", async () => {
    const meta = await rootMeta(params("en") as never);
    expect(meta.title).toEqual({ default: "AI Consumer Rights", template: "%s | AI Consumer Rights" });
    expect(meta.metadataBase?.toString()).toBe(`${SITE_URL}/`);
    expect(meta.description).toMatch(/plain-language/i);
    expect(meta.openGraph).toMatchObject({ type: "website", siteName: "AI Consumer Rights", locale: "en_US" });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
    expect(meta.robots).toEqual({ index: true, follow: true });
  });

  it("translates the title template and description into Spanish", async () => {
    const meta = await rootMeta(params("es") as never);
    expect(meta.title).toEqual({
      default: "Derechos del Consumidor frente a la IA",
      template: "%s | Derechos del Consumidor frente a la IA",
    });
    expect(meta.description).toMatch(/lenguaje claro/);
    expect(meta.openGraph).toMatchObject({ locale: "es_ES" });
  });

  it.each([
    ["/guide", guideMeta],
    ["/forum", forumMeta],
    ["/sources", sourcesMeta],
    ["/about", aboutMeta],
  ] as const)("%s has title, description, canonical, hreflang and share image in each locale", async (path, fn) => {
    for (const locale of ["en", "es", "pt-PT", "pt-BR"] as const) {
      const meta = await fn(params(locale) as never);
      expect(meta.title).toBeTruthy();
      expect(String(meta.description).length).toBeGreaterThan(50);
      expect(meta.alternates?.canonical).toBe(localizedPath(locale, path));
      expect(meta.alternates?.languages).toEqual({
        en: `/en${path}`,
        es: `/es${path}`,
        "pt-PT": `/pt${path}`,
        "pt-BR": `/pt-BR${path}`,
        "x-default": `/en${path}`,
      });
      expect(meta.openGraph?.url).toBe(localizedPath(locale, path));
      const [image] = meta.openGraph!.images as { url: string; width: number; height: number; alt: string }[];
      expect(image).toMatchObject({ url: "/opengraph-image", width: 1200, height: 630 });
      expect(meta.twitter).toMatchObject({ card: "summary_large_image", images: ["/opengraph-image"] });
    }
  });

  it("gives the Spanish pages Spanish titles and share-image text", async () => {
    const meta = await guideMeta(params("es") as never);
    expect(meta.title).toBe("Una IA a la que puedes preguntar");
    const [image] = meta.openGraph!.images as { alt: string }[];
    expect(image.alt).toMatch(/^Derechos del Consumidor frente a la IA: /);
  });

  it("gives the Portuguese pages Portuguese titles and the pt_PT OpenGraph locale", async () => {
    const site = await rootMeta(params("pt-PT") as never);
    expect(site.title).toEqual({
      default: "Direitos do Consumidor perante a IA",
      template: "%s | Direitos do Consumidor perante a IA",
    });
    expect(site.openGraph).toMatchObject({ locale: "pt_PT" });
    const guide = await guideMeta(params("pt-PT") as never);
    expect(guide.title).toBe("Uma IA a que pode fazer perguntas");
  });

  it("gives the Brazilian pages the pt_BR OpenGraph locale", async () => {
    const site = await rootMeta(params("pt-BR") as never);
    expect(site.openGraph).toMatchObject({ locale: "pt_BR" });
    const guide = await guideMeta(params("pt-BR") as never);
    expect(guide.title).toBe("Uma IA para a qual você pode perguntar");
  });

  it("sizes the share image for OpenGraph", () => {
    expect(ogSize).toEqual({ width: 1200, height: 630 });
  });
});

describe("JSON-LD structured data", () => {
  it.each([
    ["en", "en"],
    ["es", "es"],
    ["pt-PT", "pt-PT"],
    ["pt-BR", "pt-BR"],
  ] as const)("declares the WebSite in the %s layout with its language (%s)", async (locale, lang) => {
    const html = renderToStaticMarkup(await LocaleLayout({ children: <main />, params: { locale } }));
    const [site] = jsonLd(html);
    expect(site).toMatchObject({
      "@context": "https://schema.org",
      "@type": "WebSite",
      url: `${SITE_URL}${localizedPath(locale)}`,
      inLanguage: lang,
    });
  });

  it("marks the guide as an Article with its fact-check date, in each language", () => {
    for (const [locale, lang] of [["en", "en"], ["es", "es"], ["pt-PT", "pt-PT"], ["pt-BR", "pt-BR"]] as const) {
      (globalThis as unknown as { __requestLocale: string }).__requestLocale = locale;
      const html = renderToStaticMarkup(
        <IntlWrapper locale={locale}>
          <GuidePage params={{ locale }} />
        </IntlWrapper>
      );
      const [article] = jsonLd(html);
      expect(article).toMatchObject({ "@type": "Article", dateModified: "2026-09-23", inLanguage: lang });
    }
  });

  it("escapes '<' so data cannot close the script tag", async () => {
    const html = renderToStaticMarkup(await LocaleLayout({ children: <main />, params: { locale: "en" } }));
    const script = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1];
    expect(script).not.toContain("<");
  });
});

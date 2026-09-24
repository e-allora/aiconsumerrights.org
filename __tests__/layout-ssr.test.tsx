/**
 * @jest-environment node
 */
// Server render, as Next does it: no document, no window.
import { renderToStaticMarkup } from "react-dom/server";

import LocaleLayout from "@/app/[locale]/layout";

async function renderLayout(locale: string) {
  const tree = await LocaleLayout({ children: <main id="main" />, params: { locale } });
  return renderToStaticMarkup(tree);
}

describe("LocaleLayout (server render)", () => {
  it.each([
    ["en", "en"],
    ["es", "es"],
    ["pt", "pt-PT"],
  ])("renders the full %s document without errors (lang=%s)", async (locale, lang) => {
    const errors = jest.spyOn(console, "error").mockImplementation(() => {});
    const html = await renderLayout(locale);
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
    expect(html).toMatch(new RegExp(`^<html lang="${lang}">`));
    expect(html).toContain('<main id="main">');
  });

  it("includes the skip link, navigation, and provenance footer, in English", async () => {
    const html = await renderLayout("en");
    expect(html.indexOf("Skip to main content")).toBeLessThan(html.indexOf("<header"));
    expect(html).toContain('aria-label="Main"');
    expect(html).toContain('aria-label="Quick"');
    expect(html).toContain("How this site was made");
  });

  it("translates the skip link, navigation, and footer into Spanish", async () => {
    const html = await renderLayout("es");
    expect(html.indexOf("Saltar al contenido principal")).toBeLessThan(html.indexOf("<header"));
    expect(html).toContain('aria-label="Principal"');
    expect(html).toContain('aria-label="Acceso rápido"');
    expect(html).toContain("Cómo se hizo este sitio");
  });
});

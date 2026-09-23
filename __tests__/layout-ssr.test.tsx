/**
 * @jest-environment node
 */
// Server render, as Next does it: no document, no window.
import { renderToStaticMarkup } from "react-dom/server";

import RootLayout from "@/app/layout";

jest.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("RootLayout (server render)", () => {
  it("renders the full document without errors", () => {
    const errors = jest.spyOn(console, "error").mockImplementation(() => {});
    const html = renderToStaticMarkup(
      <RootLayout>
        <main>Hello</main>
      </RootLayout>
    );
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();

    expect(html).toMatch(/^<html lang="en">/);
    expect(html).toContain("<body");
    expect(html).toContain("<main>Hello</main>");
  });

  it("includes the skip link, navigation, and provenance footer", () => {
    const html = renderToStaticMarkup(<RootLayout><main id="main" /></RootLayout>);
    expect(html.indexOf("Skip to main content")).toBeLessThan(html.indexOf("<header"));
    expect(html).toContain('aria-label="Main"');
    expect(html).toContain('aria-label="Quick"');
    expect(html).toContain("How this site was made");
  });
});

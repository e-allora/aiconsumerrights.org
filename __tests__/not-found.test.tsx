import { axe } from "jest-axe";

import MissingPage, { generateMetadata } from "@/app/[locale]/missing/page";
import LocaleNotFound from "@/app/[locale]/not-found";
import { routing } from "@/lib/i18n/routing";
import { MESSAGES, ready, render, screen } from "@/test-utils";

describe("Page not found, inside a language", () => {
  it("says so in plain words and offers the home page and the help pages", () => {
    render(<LocaleNotFound />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Page not found");
    expect(screen.getByText("This page does not exist, or it has moved.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to the home page" })).toHaveAttribute("href", "/en");
    expect(screen.getByRole("link", { name: "Help" })).toHaveAttribute("href", "/en/help");
  });

  it("asks not to be indexed, and is titled in the visitor's language", async () => {
    const meta = await generateMetadata({ params: ready({ locale: "it" }) });
    expect(meta.title).toBe(MESSAGES.it.Common.notFoundTitle);
    expect(meta.robots).toEqual({ index: false, follow: true });
  });

  it.each(routing.locales)("speaks %s and has no accessibility violations", async (locale) => {
    const { container } = render(<MissingPage params={ready({ locale })} />, { locale });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(MESSAGES[locale].Common.notFoundTitle);
    // jsdom can't measure colour or size; the real-browser audit covers those.
    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false }, "target-size": { enabled: false } },
    });
    expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
  });
});

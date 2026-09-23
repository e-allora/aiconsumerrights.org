import { render } from "@testing-library/react";
import { axe } from "jest-axe";

import AboutPage from "@/app/about/page";
import ForumPage from "@/app/forum/page";
import GuidePage from "@/app/guide/page";
import HomePage from "@/app/page";
import SourcesPage from "@/app/sources/page";
import { ThemeProvider } from "@/components/theme-provider";
import { AttributionFooter } from "@/components/ui/AttributionFooter";
import { SiteNav } from "@/components/ui/SiteNav";

jest.mock("next/navigation", () => ({ usePathname: () => "/" }));

// WCAG 2.0, 2.1 and 2.2 at Levels A and AA. jsdom has no layout engine, so
// color-contrast and target-size can't be measured here; scripts/a11y-audit.mjs
// checks those in a real browser.
const RUN = {
  runOnly: { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] },
  rules: { "color-contrast": { enabled: false }, "target-size": { enabled: false } },
};

const PAGES = [
  ["/", HomePage],
  ["/guide", GuidePage],
  ["/forum", ForumPage],
  ["/sources", SourcesPage],
  ["/about", AboutPage],
] as const;

beforeEach(() => localStorage.clear());

describe("axe: zero WCAG A/AA violations", () => {
  it.each(PAGES)("%s, with navigation and footer", async (_, Page) => {
    const { container } = render(
      <ThemeProvider attribute="class" defaultTheme="light">
        <a href="#main">Skip to main content</a>
        <SiteNav />
        <Page />
        <AttributionFooter />
      </ThemeProvider>
    );
    const results = await axe(container, RUN);
    expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
  });
});

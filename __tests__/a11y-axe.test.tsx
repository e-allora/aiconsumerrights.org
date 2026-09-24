import { render } from "@/test-utils";
import { axe } from "jest-axe";

import AboutPage from "@/app/[locale]/about/page";
import ForumPage from "@/app/[locale]/forum/page";
import GuidePage from "@/app/[locale]/guide/page";
import HomePage from "@/app/[locale]/page";
import SourcesPage from "@/app/[locale]/sources/page";
import { ThemeProvider } from "@/components/theme-provider";
import { AttributionFooter } from "@/components/ui/AttributionFooter";
import { SiteNav } from "@/components/ui/SiteNav";


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

// Every page, in every language.
const CASES = (["en", "es", "pt-PT", "pt-BR", "it"] as const).flatMap((locale) =>
  PAGES.map(([path, Page]) => [`/${locale}${path === "/" ? "" : path}`, locale, Page] as const)
);

describe("axe: zero WCAG A/AA violations", () => {
  it.each(CASES)("%s, with navigation and footer", async (_, locale, Page) => {
    const { container } = render(
      <ThemeProvider attribute="class" defaultTheme="light">
        <a href="#main">Skip to main content</a>
        <SiteNav />
        <Page params={{ locale }} />
        <AttributionFooter />
      </ThemeProvider>,
      { locale }
    );
    const results = await axe(container, RUN);
    expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
  });
});

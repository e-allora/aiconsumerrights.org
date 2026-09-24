import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@/test-utils";

import { ThemeProvider } from "@/components/theme-provider";
import { contrastRatio, palette } from "@/lib/theme";

const css = readFileSync(join(__dirname, "../app/globals.css"), "utf8");

// Reads "--name: R G B;" from a CSS block and returns #RRGGBB.
function cssVarHex(block: string, name: string): string {
  const m = block.match(new RegExp(`--${name}:\\s*(\\d+) (\\d+) (\\d+);`));
  if (!m) throw new Error(`--${name} not found`);
  return (
    "#" +
    m.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, "0")).join("").toUpperCase()
  );
}
const rootBlock = css.match(/:root\s*{([^}]*)}/)![1];
const darkBlock = css.match(/\.dark\s*{([^}]*)}/)![1];

describe("RootLayout", () => {
  it("starts children on the light, warm neutral theme", () => {
    // Same provider settings as the layout, rendered into the jsdom body.
    render(
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <p>Content</p>
      </ThemeProvider>
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(document.documentElement).toHaveClass("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("uses cream as the light canvas and charcoal as text", () => {
    expect(cssVarHex(rootBlock, "background")).toBe(palette.cream);
    expect(cssVarHex(rootBlock, "foreground")).toBe(palette.charcoal);
  });

  it("swaps to a charcoal canvas in dark mode", () => {
    expect(cssVarHex(darkBlock, "background")).toBe(palette.charcoal);
    expect(cssVarHex(darkBlock, "foreground")).toBe(palette.cream);
  });

  it("keeps focus rings at 3:1 or better in both themes (SC 2.4.13)", () => {
    for (const block of [rootBlock, darkBlock]) {
      const ratio = contrastRatio(cssVarHex(block, "ring"), cssVarHex(block, "background"));
      expect(ratio).toBeGreaterThanOrEqual(3);
    }
  });
});

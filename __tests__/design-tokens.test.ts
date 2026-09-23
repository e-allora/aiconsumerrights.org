/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import resolveConfig from "tailwindcss/resolveConfig";

import tailwindConfig from "@/tailwind.config";
import { contrastRatio, palette } from "@/lib/theme";

const css = readFileSync(join(__dirname, "../app/globals.css"), "utf8");
// Loosely typed: the resolved theme type only knows Tailwind's built-in keys.
const theme = resolveConfig(tailwindConfig).theme as unknown as Record<string, Record<string, any>>;

function block(selector: RegExp): string {
  const m = css.match(selector);
  if (!m) throw new Error(`${selector} not found in globals.css`);
  return m[1];
}
function varHex(scope: string, name: string): string {
  const m = scope.match(new RegExp(`--${name}:\\s*(\\d+) (\\d+) (\\d+);`));
  if (!m) throw new Error(`--${name} not found`);
  return "#" + m.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, "0")).join("").toUpperCase();
}

const light = block(/:root\s*{([\s\S]*?)\n  }/);
const dark = block(/\.dark\s*{([\s\S]*?)\n  }/);

describe("color tokens", () => {
  it("map the brand palette in light and dark", () => {
    expect(varHex(light, "background")).toBe(palette.cream);
    expect(varHex(light, "foreground")).toBe(palette.charcoal);
    expect(varHex(light, "secondary")).toBe(palette.coral);
    expect(varHex(dark, "background")).toBe(palette.charcoal);
    expect(varHex(dark, "foreground")).toBe(palette.cream);
    expect(varHex(dark, "primary")).toBe(palette.teal);
  });

  it("define every color token in both themes", () => {
    const names = Array.from(light.matchAll(/--([a-z-]+):\s*\d+ \d+ \d+;/g)).map((m) => m[1]);
    for (const name of names) expect(() => varHex(dark, name)).not.toThrow();
  });

  it.each([
    ["light", light],
    ["dark", dark],
  ])("meet contrast minimums in %s mode", (_, scope) => {
    const bg = varHex(scope, "background");
    expect(contrastRatio(varHex(scope, "foreground"), bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(varHex(scope, "muted-foreground"), bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(varHex(scope, "card-foreground"), varHex(scope, "card"))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(varHex(scope, "primary-foreground"), varHex(scope, "primary"))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(varHex(scope, "secondary-foreground"), varHex(scope, "secondary"))).toBeGreaterThanOrEqual(4.5);
    // SC 2.4.13 focus ring
    expect(contrastRatio(varHex(scope, "ring"), bg)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(varHex(scope, "ring"), varHex(scope, "card"))).toBeGreaterThanOrEqual(3);
  });
});

describe("typography tokens", () => {
  it("pair a display font for headings with a body font", () => {
    expect(theme.fontFamily.display[0]).toBe("var(--font-display)");
    expect(theme.fontFamily.sans[0]).toBe("var(--font-body)");
  });

  it("have a bold layer-cake heading scale", () => {
    for (const size of ["display-xl", "display-lg", "display-md", "display-sm"]) {
      const [, opts] = theme.fontSize[size] as [string, { fontWeight: string }];
      expect(Number(opts.fontWeight)).toBeGreaterThanOrEqual(700);
    }
  });
});

describe("touch and focus targets", () => {
  it("set 24px by default and 44px on coarse pointers (SC 2.5.8)", () => {
    expect(css).toMatch(/\.tap-target\s*{\s*min-width: 24px;\s*min-height: 24px;/);
    expect(css).toMatch(
      /@media \(pointer: coarse\)\s*{\s*\.tap-target\s*{\s*min-width: 44px;\s*min-height: 44px;/
    );
    expect(theme.spacing["tap-web"]).toBe("24px");
    expect(theme.spacing["tap-touch"]).toBe("44px");
  });

  it("draw a 3px focus outline on every focusable element", () => {
    expect(css).toMatch(/:focus-visible\s*{\s*@apply outline outline-\[3px\] outline-offset-2 outline-ring;/);
  });
});

describe("motion and depth", () => {
  it("define three depth shadow levels", () => {
    for (const level of [1, 2, 3]) {
      expect(theme.boxShadow[`depth-${level}`]).toBe(`var(--depth-${level})`);
      expect(light).toContain(`--depth-${level}:`);
    }
  });

  it("switch off transitions, animation and 3D tilt under prefers-reduced-motion", () => {
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reduced).toContain("transition-duration: 0.01ms !important");
    expect(reduced).toContain("animation-duration: 0.01ms !important");
    expect(reduced).toMatch(/\.depth-card-interactive:hover[\s\S]*transform: none;/);
    expect(reduced).toMatch(/\.press:active:not\(:disabled\)[\s\S]*transform: none;/);
  });
});

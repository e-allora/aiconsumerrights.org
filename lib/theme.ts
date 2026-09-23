// Brand palette from CLAUDE.md. globals.css holds the same values as RGB
// triplets; the theme tests keep the two in sync.

export const palette = {
  cream: "#FBF7EE", // warm neutral canvas (light)
  charcoal: "#12232E", // text (light) / canvas (dark)
  teal: "#00A896", // accent
  coral: "#FF6B6B", // highlight
  // Brand teal is 2.79:1 on cream, below the 3:1 focus-ring minimum
  // (SC 2.4.13), so light mode uses this deeper teal for rings and buttons.
  tealDeep: "#007A6D",
} as const;

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio between two #RRGGBB colors. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

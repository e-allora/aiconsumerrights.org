import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

// Design tokens. Color values live in app/globals.css as "R G B" triplets
// (light on :root, dark on .dark) so opacity modifiers work: bg-primary/90.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: token("background"),
        foreground: token("foreground"),
        card: { DEFAULT: token("card"), foreground: token("card-foreground") },
        muted: { DEFAULT: token("muted"), foreground: token("muted-foreground") },
        // Teal role. Light mode uses deep teal: brand teal is under 3:1 on cream.
        primary: { DEFAULT: token("primary"), foreground: token("primary-foreground") },
        // Coral role. Fill only; never coral text on cream (2.6:1).
        secondary: { DEFAULT: token("secondary"), foreground: token("secondary-foreground") },
        border: token("border"),
        ring: token("ring"),
        // Raw brand colors for decoration that carries no meaning.
        teal: "#00A896",
        coral: "#FF6B6B",
        cream: "#FBF7EE",
        charcoal: "#12232E",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-body)", "sans-serif"],
      },
      // Layer-cake scale: big, bold headings a reader can scan down the page.
      fontSize: {
        "display-xl": ["clamp(2.5rem, 1.5rem + 5vw, 4.5rem)", { lineHeight: "1.05", fontWeight: "800" }],
        "display-lg": ["clamp(2rem, 1.25rem + 3.5vw, 3.25rem)", { lineHeight: "1.1", fontWeight: "800" }],
        "display-md": ["clamp(1.5rem, 1.1rem + 1.8vw, 2.25rem)", { lineHeight: "1.15", fontWeight: "700" }],
        "display-sm": ["1.25rem", { lineHeight: "1.3", fontWeight: "700" }],
        body: ["1.125rem", { lineHeight: "1.65" }],
      },
      spacing: {
        "tap-web": "24px", // SC 2.5.8 minimum
        "tap-touch": "44px", // mobile / coarse pointer minimum
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "depth-1": "var(--depth-1)",
        "depth-2": "var(--depth-2)",
        "depth-3": "var(--depth-3)",
      },
      transitionTimingFunction: {
        "out-soft": "cubic-bezier(0.22, 1, 0.36, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      transitionDuration: {
        fast: "150ms",
        base: "250ms",
      },
    },
  },
  plugins: [animate],
};
export default config;

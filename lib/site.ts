// One place for the site's public URL and the routes it has published.
// Add a route here only once its page ships, so Search Console never sees a 404.

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://aiconsumerrights.org"
).replace(/\/+$/, "");

export const SITE_NAME = "AI Consumer Rights";

export const SITE_DESCRIPTION =
  "Plain-language help with your rights when AI makes decisions about you, built through open, respectful dialogue.";

export type PublishedRoute = {
  path: `/${string}`;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
};

export const PUBLISHED_ROUTES: PublishedRoute[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/guide", changeFrequency: "monthly", priority: 0.9 },
  { path: "/forum", changeFrequency: "weekly", priority: 0.8 },
  { path: "/sources", changeFrequency: "monthly", priority: 0.5 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
];

export type NavKey = "home" | "guide" | "forum" | "sources" | "about";
export type NavItem = { href: `/${string}`; key: NavKey };

// One list drives the header, the drawer, and the mobile bottom bar.
// Labels and hints live in messages/*.json under Navigation.<key> and <key>Hint.
export const NAV_ITEMS: NavItem[] = [
  { href: "/", key: "home" },
  { href: "/guide", key: "guide" },
  { href: "/forum", key: "forum" },
  { href: "/sources", key: "sources" },
  { href: "/about", key: "about" },
];

// One place for the site's public URL and the routes it has published.
// Add a route here only once its page ships, so Search Console never sees a 404.

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://aiconsumerrights.org"
).replace(/\/+$/, "");

export const SITE_NAME = "AI Consumer Rights";

export const SITE_DESCRIPTION =
  "Plain-language help with your rights when AI makes decisions about you, built through open, respectful dialogue.";

// Where people send criticism and corrections, and where legal and language
// reviewers write. Both are on the site's own domain, kept apart from any
// business of Robert's.
export const CONTACT_EMAIL = "feedback@aiconsumerrights.org";
export const REVIEW_EMAIL = "reviewers@aiconsumerrights.org";
export const REPO_URL = "https://github.com/e-allora/aiconsumerrights.org";
export const MISSION_URL = `${REPO_URL}/blob/main/docs/MISSION.md`;

export type PublishedRoute = {
  path: `/${string}`;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
};

export const PUBLISHED_ROUTES: PublishedRoute[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/help", changeFrequency: "monthly", priority: 0.9 },
  { path: "/help/credit", changeFrequency: "monthly", priority: 0.8 },
  { path: "/help/job", changeFrequency: "monthly", priority: 0.8 },
  { path: "/help/housing", changeFrequency: "monthly", priority: 0.8 },
  { path: "/help/insurance", changeFrequency: "monthly", priority: 0.8 },
  { path: "/help/chatbot", changeFrequency: "monthly", priority: 0.8 },
  { path: "/help/account", changeFrequency: "monthly", priority: 0.8 },
  { path: "/help/deepfake", changeFrequency: "monthly", priority: 0.8 },
  { path: "/guide", changeFrequency: "monthly", priority: 0.9 },
  { path: "/forum", changeFrequency: "weekly", priority: 0.8 },
  { path: "/sources", changeFrequency: "monthly", priority: 0.5 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.5 },
];

export type NavKey = "home" | "help" | "guide" | "forum" | "sources" | "about";
export type NavItem = { href: `/${string}`; key: NavKey };

// One list drives the header, the drawer, and the mobile bottom bar.
// Labels and hints live in messages/*.json under Navigation.<key> and <key>Hint.
export const NAV_ITEMS: NavItem[] = [
  { href: "/", key: "home" },
  { href: "/help", key: "help" },
  { href: "/guide", key: "guide" },
  { href: "/forum", key: "forum" },
  { href: "/sources", key: "sources" },
  { href: "/about", key: "about" },
];

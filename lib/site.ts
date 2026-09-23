// One place for the site's public URL and the routes it has published.
// Add a route here only once its page ships, so Search Console never sees a 404.

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://aiconsumerrights.org"
).replace(/\/+$/, "");

export const SITE_NAME = "AI Consumer Rights";

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
];

// Date formatting shared by server pages and client widgets. It lives apart
// from lib/sources.ts so client code can use it without bundling the
// source registry.

/** "2026-09-23" -> "23 September 2026" or "23 de septiembre de 2026" (UTC, so server and client agree). */
export function formatDate(iso: string, locale = "en"): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale === "en" ? "en-GB" : locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Today on the visitor's own clock, as "YYYY-MM-DD". */
export function localToday(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

import createNextIntlPlugin from "next-intl/plugin";

// Points next-intl at the per-request config that loads messages/{locale}.json.
const withNextIntl = createNextIntlPlugin("./i18n.ts");

const dev = process.env.NODE_ENV !== "production";
// Vercel's comment toolbar on preview deploys loads from vercel.live.
const preview = process.env.VERCEL_ENV === "preview" ? " https://vercel.live" : "";

/**
 * The site loads nothing from other domains: fonts are self-hosted and there
 * are no trackers. Scripts still need 'unsafe-inline', because Next.js and
 * the theme switcher write small inline scripts; a nonce would remove that
 * but would make every page render per request instead of from the cache.
 * The rest still stops framing, plugins, and forms posting elsewhere.
 * Vercel already sends Strict-Transport-Security.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}${preview}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${preview}`,
  `frame-src 'self'${preview}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(dev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

export const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);

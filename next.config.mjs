import createNextIntlPlugin from "next-intl/plugin";

// Points next-intl at the per-request config that loads messages/{locale}.json.
const withNextIntl = createNextIntlPlugin("./i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withNextIntl(nextConfig);

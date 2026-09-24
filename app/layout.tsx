import type { Metadata } from "next";

import { SITE_URL } from "@/lib/site";
import "./globals.css";

// The share image lives at the app root, so its absolute URL is resolved
// here, before the locale layout runs.
export const metadata: Metadata = { metadataBase: new URL(SITE_URL) };

// The real layout lives in app/[locale]/layout.tsx, which sets <html lang>.
// This root layout only passes children through, as next-intl recommends.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}

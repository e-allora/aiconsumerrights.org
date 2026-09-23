import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Bricolage_Grotesque } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { AttributionFooter } from "@/components/ui/AttributionFooter";
import { JsonLd } from "@/components/ui/JsonLd";
import { SiteNav } from "@/components/ui/SiteNav";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const body = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
  display: "swap",
});

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "AI consumer rights",
    "automated decisions",
    "human review",
    "EU AI Act",
    "plain language",
    "AI transparency",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESCRIPTION },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF7EE" },
    { media: "(prefers-color-scheme: dark)", color: "#12232E" },
  ],
};

const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "en",
  about: [
    { "@type": "Thing", name: "Consumer rights and artificial intelligence" },
    { "@type": "Thing", name: "Plain-language explanations of automated decisions" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // next-themes sets the class on <html> before hydration.
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${body.variable} ${display.variable} pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0`}
      >
        <JsonLd data={WEBSITE_LD} />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:font-semibold"
          >
            Skip to main content
          </a>
          <SiteNav />
          {children}
          <AttributionFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}

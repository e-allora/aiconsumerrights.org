import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Bricolage_Grotesque } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { AttributionFooter } from "@/components/ui/AttributionFooter";
import { SITE_NAME, SITE_URL } from "@/lib/site";
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
  description:
    "Plain-language help with your rights when AI makes decisions about you, built through open, respectful dialogue.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF7EE" },
    { media: "(prefers-color-scheme: dark)", color: "#12232E" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // next-themes sets the class on <html> before hydration.
    <html lang="en" suppressHydrationWarning>
      <body className={`${body.variable} ${display.variable}`}>
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
          {children}
          <AttributionFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}

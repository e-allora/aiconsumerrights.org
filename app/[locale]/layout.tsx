import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Bricolage_Grotesque } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import { ThemeProvider } from "@/components/theme-provider";
import { AttributionFooter } from "@/components/ui/AttributionFooter";
import { JsonLd } from "@/components/ui/JsonLd";
import { SiteNav } from "@/components/ui/SiteNav";
import { LOCALE_TAGS, isLocale, localizedPath, routing, type Locale } from "@/lib/i18n/routing";
import { languageAlternates, ogImage } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

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

type Props = { children: React.ReactNode; params: { locale: string } };

// Prerender every locale; any other first segment is a 404.
export const dynamicParams = false;
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Common" });
  const name = t("siteName");
  const description = t("siteDescription");
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: name, template: `%s | ${name}` },
    description,
    applicationName: name,
    keywords: [
      "AI consumer rights",
      "automated decisions",
      "human review",
      "EU AI Act",
      "plain language",
      "AI transparency",
    ],
    alternates: { canonical: localizedPath(locale as Locale), languages: languageAlternates("/") },
    openGraph: {
      type: "website",
      siteName: name,
      title: name,
      description,
      url: localizedPath(locale as Locale),
      locale: LOCALE_TAGS[locale as Locale].og,
      images: [ogImage(`${name}: ${description}`)],
    },
    twitter: { card: "summary_large_image", title: name, description },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF7EE" },
    { media: "(prefers-color-scheme: dark)", color: "#12232E" },
  ],
};

export default async function LocaleLayout({ children, params: { locale } }: Props) {
  if (!isLocale(locale)) notFound();
  // Lets server components read the locale during static rendering.
  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations("Common");

  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: t("siteName"),
    url: `${SITE_URL}${localizedPath(locale)}`,
    description: t("siteDescription"),
    inLanguage: LOCALE_TAGS[locale].lang,
    about: [
      { "@type": "Thing", name: "Consumer rights and artificial intelligence" },
      { "@type": "Thing", name: "Plain-language explanations of automated decisions" },
    ],
  };

  return (
    // next-themes sets the class on <html> before hydration.
    <html lang={LOCALE_TAGS[locale].lang} suppressHydrationWarning>
      <body
        className={`${body.variable} ${display.variable} pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0`}
      >
        <JsonLd data={websiteLd} />
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:font-semibold"
            >
              {t("skipToContent")}
            </a>
            <SiteNav />
            {children}
            <AttributionFooter />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

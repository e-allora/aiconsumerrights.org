import { use } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { NotFoundContent } from "@/components/ui/NotFoundContent";
import type { Locale } from "@/lib/i18n/routing";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Common" });
  return { title: t("notFoundTitle"), robots: { index: false, follow: true } };
}

/**
 * The "page not found" page, built ahead of time in every language. proxy.ts
 * serves it, with status 404, for any address under a language that matches
 * no page. Being ready-made HTML, it works without JavaScript and keeps the
 * site's navigation. It is not in the sitemap and asks not to be indexed.
 */
export default function MissingPage({ params }: Props) {
  const { locale } = use(params);
  setRequestLocale(locale);
  return <NotFoundContent />;
}

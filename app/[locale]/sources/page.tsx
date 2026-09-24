import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SourceCategoryList } from "@/components/ui/SourceList";
import type { Locale } from "@/lib/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { formatDate, sources } from "@/lib/sources";

type Props = { params: { locale: Locale } };

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Sources" });
  const c = await getTranslations({ locale, namespace: "Common" });
  return pageMetadata({
    locale,
    title: t("metaTitle"),
    description: t("metaDescription"),
    siteName: c("siteName"),
    imageAlt: `${c("siteName")}: ${c("siteDescription")}`,
    path: "/sources",
  });
}

export default function SourcesPage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  const t = useTranslations("Sources");
  const ta = useTranslations("Attribution");
  const total = sources.categories.reduce((n, c) => n + c.sources.length, 0);
  const languageNote = ta("sourcesLanguageNote");
  return (
    <main id="main" className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-12 sm:py-16">
      <header className="flex flex-col gap-4">
        <h1>{t("title")}</h1>
        <p className="text-xl">
          {t.rich("lead", {
            total,
            groups: sources.categories.length,
            date: formatDate(sources.checkedOn, locale),
            b: (c) => <strong>{c}</strong>,
          })}
        </p>
        <p className="text-base text-muted-foreground">{ta("registryAbout")}</p>
        {languageNote && <p className="text-base text-muted-foreground">{languageNote}</p>}
      </header>
      {sources.categories.map((c) => (
        <SourceCategoryList key={c.id} category={c} headingLevel="h2" anchors />
      ))}
    </main>
  );
}

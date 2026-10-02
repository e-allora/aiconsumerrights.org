import { use } from "react";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { COMING, SITUATIONS } from "@/lib/help";
import { reviews } from "@/lib/public-log";
import { pageMetadata } from "@/lib/seo";
import { REVIEW_EMAIL } from "@/lib/site";

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Help" });
  const c = await getTranslations({ locale, namespace: "Common" });
  return pageMetadata({
    locale,
    title: t("metaTitle"),
    description: t("metaDescription"),
    siteName: c("siteName"),
    imageAlt: `${c("siteName")}: ${c("siteDescription")}`,
    path: "/help",
  });
}

const linkClass = "font-semibold text-link underline underline-offset-4";

/** "What happened to you?": one card per situation, and the ones still being written. */
export default function HelpPage({ params }: Props) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("Help");
  const tc = useTranslations("Common");
  return (
    <main
      id="main"
      className="mx-auto flex max-w-3xl flex-col gap-14 px-4 py-12 sm:py-16"
    >
      <header className="flex flex-col gap-5">
        <p className="font-display text-lg font-bold text-link">
          {t("eyebrow")}
        </p>
        <h1>{t("title")}</h1>
        <p className="text-xl">{t("lead")}</p>
        <p className="rounded-md border-l-4 border-primary bg-muted/70 p-4 text-base">
          {t.rich(reviews.length > 0 ? "pendingPartly" : "pending", {
            b: (c) => <strong>{c}</strong>,
            contact: (c) => (
              <a href={`mailto:${REVIEW_EMAIL}`} className={linkClass}>
                {c}
              </a>
            ),
          })}
        </p>
        <p className="text-base text-muted-foreground">{tc("legalNotice")}</p>
      </header>

      <ul className="flex flex-col gap-4">
        {SITUATIONS.map(({ id }) => (
          <li key={id}>
            <Link
              href={`/help/${id}`}
              className="depth-card depth-card-interactive tap-target flex items-center justify-between gap-4 p-6 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="flex flex-col gap-1">
                <span className="font-display text-xl font-bold">
                  {t(`${id}.title`)}
                </span>
                <span className="text-base">{t(`${id}.summary`)}</span>
              </span>
              <ArrowRight aria-hidden="true" className="size-6 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>

      {COMING.length > 0 && (
        <section aria-labelledby="coming" className="flex flex-col gap-4">
          <h2 id="coming">{t("comingHeading")}</h2>
          <ul className="flex list-disc flex-col gap-2 pl-6">
            {COMING.map((id) => (
              <li key={id}>{t(`coming.${id}`)}</li>
            ))}
          </ul>
          <p>
            {t.rich("comingLead", {
              forum: (c) => (
                <Link href="/forum" className={linkClass}>
                  {c}
                </Link>
              ),
            })}
          </p>
        </section>
      )}
    </main>
  );
}

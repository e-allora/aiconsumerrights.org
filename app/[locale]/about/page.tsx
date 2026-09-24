import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { JsonLd } from "@/components/ui/JsonLd";
import { Link } from "@/lib/i18n/navigation";
import { LOCALE_TAGS, localizedPath, type Locale } from "@/lib/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

type Props = { params: { locale: Locale } };

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "About" });
  const c = await getTranslations({ locale, namespace: "Common" });
  return pageMetadata({
    locale,
    title: t("metaTitle"),
    description: t("metaDescription"),
    siteName: c("siteName"),
    imageAlt: `${c("siteName")}: ${c("siteDescription")}`,
    path: "/about",
  });
}

const SAFEGUARDS = ["trace", "isolated", "access", "common", "sturdy"] as const;
const bold = (c: React.ReactNode) => <strong>{c}</strong>;
const linkClass = "font-semibold text-link underline underline-offset-4";

export default function AboutPage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  const t = useTranslations("About");
  const tc = useTranslations("Common");
  return (
    <main id="main" className="mx-auto flex max-w-3xl flex-col gap-16 px-4 py-12 sm:py-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: `${t("title")} | ${tc("siteName")}`,
          url: `${SITE_URL}${localizedPath(locale, "/about")}`,
          description: t("metaDescription"),
          inLanguage: LOCALE_TAGS[locale].lang,
        }}
      />
      <header className="flex flex-col gap-5">
        <h1>{t("title")}</h1>
        <p className="text-xl">{t.rich("lead", { b: bold })}</p>
      </header>

      <section aria-labelledby="mission" className="flex flex-col gap-4">
        <h2 id="mission">{t("missionHeading")}</h2>
        <p>{t.rich("mission", { b: bold })}</p>
      </section>

      <section aria-labelledby="safeguards" className="flex flex-col gap-6">
        <h2 id="safeguards">{t("safeguardsHeading")}</h2>
        <p>
          <strong>{t("safeguardsLead")}</strong>
        </p>
        <ol className="flex flex-col gap-4">
          {SAFEGUARDS.map((s, i) => (
            <li key={s} className="depth-card flex gap-4 p-5">
              <span aria-hidden="true" className="font-display text-2xl font-extrabold text-link">
                {i + 1}
              </span>
              <span className="flex flex-col gap-1">
                <strong className="font-display text-lg">{t(`safeguards.${s}`)}</strong>
                <span className="text-base">{t(`safeguards.${s}Text`)}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="who" className="flex flex-col gap-4">
        <h2 id="who">{t("whoHeading")}</h2>
        <p>{t.rich("who", { b: bold })}</p>
        <p>
          <Link href="/sources" className={linkClass}>
            {t("whoLink")}
          </Link>
          .
        </p>
      </section>

      <section aria-labelledby="join" className="flex flex-col gap-4">
        <h2 id="join">{t("joinHeading")}</h2>
        <p>
          <strong>{t("joinLead")}</strong>{" "}
          <Link href="/forum" className={linkClass}>
            {t("joinLink")}
          </Link>
          {t("joinAfter")}
        </p>
      </section>
    </main>
  );
}

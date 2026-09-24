import type { Metadata } from "next";
import { useLocale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AlgorithmExplorer } from "@/components/guide/AlgorithmExplorer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cite } from "@/components/ui/Cite";
import { JsonLd } from "@/components/ui/JsonLd";
import { Link } from "@/lib/i18n/navigation";
import { LOCALE_TAGS, localizedPath, type Locale } from "@/lib/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { formatDate, sources } from "@/lib/sources";

type Props = { params: { locale: Locale } };

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Guide" });
  const c = await getTranslations({ locale, namespace: "Common" });
  return pageMetadata({
    locale,
    title: t("metaTitle"),
    description: t("metaDescription"),
    siteName: c("siteName"),
    imageAlt: `${c("siteName")}: ${c("siteDescription")}`,
    path: "/guide",
    type: "article",
  });
}

// Citations sit beside the translated sentences, so every language keeps
// the same numbered sources.
const TOUCHPOINTS = [
  { id: "chatbots", cites: [["eu-ai-act-art50", "eu-ai-act"], ["ncsl-ai-database"]] },
  { id: "recommendations", cites: [["unesco-ethics-2021"], ["ostp-blueprint-2022"]] },
  { id: "screening", cites: [["cfpb-reg-b"], ["gdpr"]] },
] as const;

const COMPARISON = [
  { id: "told", us: ["ncsl-ai-database"], eu: ["eu-ai-act-art50"] },
  { id: "reasons", us: ["cfpb-reg-b"], eu: ["gdpr"] },
  { id: "review", us: ["ostp-blueprint-2022"], eu: ["gdpr"] },
  { id: "enforce", us: ["ftc-ai-comply-2024", "cfpb-reg-b"], eu: ["eu-ai-act"] },
  { id: "changing", us: ["eo-14365-2025"], eu: ["eu-digital-omnibus-2026"] },
] as const;

const STAKEHOLDERS = ["people", "educators", "regulators", "builders"] as const;

const bold = (c: React.ReactNode) => <strong>{c}</strong>;

export default function GuidePage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  const t = useTranslations("Guide");
  const tc = useTranslations("Common");
  const activeLocale = useLocale();
  const checked = formatDate(sources.checkedOn, activeLocale);

  return (
    <main id="main" className="mx-auto flex max-w-5xl flex-col gap-20 px-4 py-12 sm:py-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: t("title"),
          description: t("metaDescription"),
          url: `${SITE_URL}${localizedPath(activeLocale as Locale, "/guide")}`,
          inLanguage: LOCALE_TAGS[activeLocale as Locale].lang,
          dateModified: sources.checkedOn,
          publisher: { "@type": "Organization", name: tc("siteName"), url: SITE_URL },
          about: ["Consumer rights", "Automated decision-making", "EU AI Act", "Human review"],
        }}
      />
      <header className="flex max-w-3xl flex-col gap-5">
        <p className="font-display text-lg font-bold text-link">{t("eyebrow")}</p>
        <h1>{t("title")}</h1>
        <p className="text-xl">{t.rich("lead", { b: bold })}</p>
        <p className="text-base text-muted-foreground">
          {tc("factsChecked", { date: checked })} {tc("legalNotice")}
        </p>
      </header>

      <section aria-labelledby="touchpoints" className="flex flex-col gap-8">
        <div className="flex max-w-3xl flex-col gap-3">
          <h2 id="touchpoints">{t("touchpoints.heading")}</h2>
          <p>{t.rich("touchpoints.lead", { b: bold })}</p>
        </div>
        <ul className="grid gap-6 md:grid-cols-3">
          {TOUCHPOINTS.map(({ id, cites }) => {
            const k = (key: string) => t(`touchpoints.${id}.${key}`);
            return (
              <li key={id} className="flex">
                <Card interactive className="flex w-full flex-col">
                  <CardHeader>
                    <CardTitle>{k("term")}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4 text-base">
                    <p>
                      <strong>{k("term")}</strong> {k("what")}
                    </p>
                    <p>
                      <strong>{t("touchpoints.askLabel")}</strong> &ldquo;{k("ask")}&rdquo;
                    </p>
                    <p className="mt-auto border-t-2 border-border/10 pt-4">
                      {k("rule1Label") && <strong>{k("rule1Label")}</strong>} {k("rule1")}
                      <Cite ids={[...cites[0]]} />{" "}
                      {k("rule2Label") && <strong>{k("rule2Label")}</strong>} {k("rule2")}
                      <Cite ids={[...cites[1]]} />
                    </p>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="compare" className="flex flex-col gap-6">
        <div className="flex max-w-3xl flex-col gap-3">
          <h2 id="compare">{t("compare.heading")}</h2>
          <p>{t.rich("compare.lead", { b: bold })}</p>
        </div>
        <div className="depth-card overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left text-base">
            <caption className="sr-only">{t("compare.caption", { date: checked })}</caption>
            <thead>
              <tr className="border-b-2 border-border/15">
                <th scope="col" className="p-4 font-display">{t("compare.colQuestion")}</th>
                <th scope="col" className="p-4 font-display">{t("compare.colUS")}</th>
                <th scope="col" className="p-4 font-display">{t("compare.colEU")}</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.id} className="border-b border-border/10 last:border-0 align-top">
                  <th scope="row" className="p-4 font-bold">{t(`compare.rows.${row.id}.question`)}</th>
                  <td className="p-4">
                    {t(`compare.rows.${row.id}.us`)}
                    <Cite ids={[...row.us]} />
                  </td>
                  <td className="p-4">
                    {t(`compare.rows.${row.id}.eu`)}
                    <Cite ids={[...row.eu]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="steps" className="flex flex-col gap-6">
        <div className="flex max-w-3xl flex-col gap-3">
          <h2 id="steps">{t("steps.heading")}</h2>
          <p>{t.rich("steps.lead", { b: bold })}</p>
        </div>
        <AlgorithmExplorer />
      </section>

      <section aria-labelledby="everyone" className="flex max-w-3xl flex-col gap-5">
        <h2 id="everyone">{t("everyone.heading")}</h2>
        <p>{t.rich("everyone.lead", { b: bold })}</p>
        <ul className="flex flex-col gap-3">
          {STAKEHOLDERS.map((s) => (
            <li key={s}>
              <strong>{t(`everyone.${s}`)}</strong> {t(`everyone.${s}Text`)}
            </li>
          ))}
        </ul>
        <p>
          <strong>{t("everyone.researchLabel")}</strong> {t("everyone.research1")}
          <Cite ids={["stanford-ai-index-2026"]} /> {t("everyone.research2")}
          <Cite ids={["pew-2026"]} /> {t("everyone.research3")}
        </p>
        <p>
          <strong>{t("everyone.voiceLabel")}</strong>{" "}
          <Link href="/forum" className="font-semibold text-link underline underline-offset-4">
            {t("everyone.voiceLink")}
          </Link>
          {t("everyone.voiceAfter")}
        </p>
      </section>
    </main>
  );
}

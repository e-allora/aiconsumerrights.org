import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ConsensusCluster, type ConsensusItem } from "@/components/forum/ConsensusCluster";
import { StatementSubmission } from "@/components/forum/StatementSubmission";
import { VotingEngine } from "@/components/forum/VotingEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Locale } from "@/lib/i18n/routing";
import { STATEMENTS, TRACKS } from "@/lib/forum/statements";
import { pageMetadata } from "@/lib/seo";

type Props = { params: { locale: Locale } };

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Forum" });
  const c = await getTranslations({ locale, namespace: "Common" });
  return pageMetadata({
    locale,
    title: t("metaTitle"),
    description: t("metaDescription"),
    siteName: c("siteName"),
    imageAlt: `${c("siteName")}: ${c("siteDescription")}`,
    path: "/forum",
  });
}

const PRINCIPLES = ["critique", "goodFaith", "positivity", "ethics", "lift"] as const;
const LOOP = ["asked", "said", "did"] as const;
const bold = (c: React.ReactNode) => <strong>{c}</strong>;

export default function ForumPage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  const t = useTranslations("Forum");

  // Illustration only. The ConsensusCluster labels it as example data.
  const exampleConsensus: ConsensusItem[] = [
    {
      id: "example-reasons",
      statement: t("consensus.exampleStatement"),
      groups: [
        { group: t("consensus.exampleGroup", { letter: "A" }), agree: 91 },
        { group: t("consensus.exampleGroup", { letter: "B" }), agree: 86 },
        { group: t("consensus.exampleGroup", { letter: "C" }), agree: 87 },
      ],
    },
  ];
  const counts = { count: STATEMENTS.length, tracks: TRACKS.length };

  return (
    <main id="main" className="mx-auto flex max-w-5xl flex-col gap-20 px-4 py-12 sm:py-16">
      <header className="flex max-w-3xl flex-col gap-5">
        <p className="font-display text-lg font-bold text-link">{t("eyebrow")}</p>
        <h1>{t("title")}</h1>
        <p className="text-xl">{t.rich("lead", { b: bold })}</p>
        <p
          data-testid="preview-notice"
          className="rounded-md border-2 border-border/20 bg-muted px-4 py-3 text-base"
        >
          {t.rich("preview", { b: bold })}
        </p>
      </header>

      <section aria-labelledby="principles" className="flex flex-col gap-6">
        <div className="flex max-w-3xl flex-col gap-3">
          <h2 id="principles">{t("principles.heading")}</h2>
          <p>{t.rich("principles.lead", { b: bold })}</p>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((p, i) => (
            <li key={p} className="depth-card flex flex-col gap-2 p-5">
              <span aria-hidden="true" className="font-display text-2xl font-extrabold text-link">
                {i + 1}
              </span>
              <strong className="font-display text-lg">{t(`principles.${p}`)}</strong>
              <span className="text-base">{t(`principles.${p}Text`)}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="vote" className="flex flex-col gap-6">
        <div className="flex max-w-3xl flex-col gap-3">
          <h2 id="vote">{t("vote.heading", counts)}</h2>
          <p>
            {t.rich("vote.lead", {
              ...counts,
              trackList: TRACKS.map((id) => t(`tracks.${id}`).toLowerCase()).join(", "),
              b: bold,
            })}
          </p>
          <p className="text-base text-muted-foreground">{t("civility")}</p>
        </div>
        <VotingEngine />
      </section>

      <section aria-labelledby="suggest" className="flex max-w-3xl flex-col gap-6">
        <h2 id="suggest">{t("suggest.heading")}</h2>
        <StatementSubmission />
      </section>

      <section aria-labelledby="results" className="flex flex-col gap-6">
        <div className="flex max-w-3xl flex-col gap-3">
          <h2 id="results">{t("results.heading")}</h2>
          <p>{t.rich("results.lead", { b: bold })}</p>
        </div>
        <ConsensusCluster items={exampleConsensus} example />
      </section>

      <section aria-labelledby="loop" className="flex flex-col gap-6">
        <div className="flex max-w-3xl flex-col gap-3">
          <h2 id="loop">{t("loop.heading")}</h2>
          <p>{t.rich("loop.lead", { b: bold })}</p>
        </div>
        <Card as="section" aria-describedby="loop-status">
          <CardHeader>
            <CardTitle>{t("loop.title")}</CardTitle>
            <p id="loop-status" className="text-base text-muted-foreground">
              {t("loop.status")}
            </p>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-6 md:grid-cols-3">
              {LOOP.map((k) => (
                <div key={k} className="flex flex-col gap-1">
                  <dt className="font-display text-lg font-bold">{t(`loop.${k}`)}</dt>
                  <dd className="text-base">{t(`loop.${k}Text`, counts)}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

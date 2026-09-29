import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Handshake } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { LetterBuilder } from "@/components/help/LetterBuilder";
import { RegionPicker } from "@/components/help/RegionPicker";
import { Cite } from "@/components/ui/Cite";
import { HelpLink, PhoneLink } from "@/components/ui/HelpLink";
import { EU_AUTHORITY, REGIONS, SITUATIONS, getSituation, homeRegion, type Region, type Situation } from "@/lib/help";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { getSource } from "@/lib/sources";

type Props = { params: { locale: Locale; situation: string } };

export const dynamicParams = false;
export const generateStaticParams = () => SITUATIONS.map(({ id }) => ({ situation: id }));

export async function generateMetadata({ params: { locale, situation } }: Props): Promise<Metadata> {
  if (!getSituation(situation)) return {};
  const t = await getTranslations({ locale, namespace: `Help.${situation}` });
  const c = await getTranslations({ locale, namespace: "Common" });
  return pageMetadata({
    locale,
    title: t("metaTitle"),
    description: t("metaDescription"),
    siteName: c("siteName"),
    imageAlt: `${c("siteName")}: ${c("siteDescription")}`,
    path: `/help/${situation}`,
    type: "article",
  });
}

const bold = (c: React.ReactNode) => <strong>{c}</strong>;
const linkClass = "font-semibold text-link underline underline-offset-4";

/** One region's rights, letter, and next steps. Rendered on the server; RegionPicker shows one. */
function RegionPanel({ situation, region, locale }: { situation: Situation; region: Region; locale: Locale }) {
  const t = useTranslations("Help");
  const help = situation.regions[region];
  const k = `${situation.id}.${region}`;
  const tags = Object.fromEntries(
    Object.entries(help.complain).map(([tag, id]) => [
      tag,
      (c: React.ReactNode) => <HelpLink source={getSource(id)}>{c}</HelpLink>,
    ])
  );
  const home = region === "eu" ? EU_AUTHORITY[locale] : undefined;
  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby={`rights-${region}`} className="flex flex-col gap-4">
        <h3 id={`rights-${region}`}>{t("rightsHeading")}</h3>
        <ul className="flex list-disc flex-col gap-3 pl-6">
          {help.rights.map((ids, i) => (
            <li key={i}>
              {t.rich(`${k}.rights.${i + 1}`, { b: bold })}
              {ids.length > 0 && <Cite ids={ids} />}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby={`letter-${region}`} className="depth-card flex flex-col gap-4 p-6 sm:p-8">
        <h3 id={`letter-${region}`}>{t("letterHeading")}</h3>
        <p>{t("letterLead")}</p>
        <LetterBuilder situation={situation.id} kind={help.letter} />
      </section>

      <section aria-labelledby={`noreply-${region}`} className="flex flex-col gap-4">
        <h3 id={`noreply-${region}`}>{t("noReplyHeading")}</h3>
        <p>
          {t.rich(`${k}.noReply`, {
            ...tags,
            tel: (c) => <PhoneLink phone={help.phone ?? ""}>{c}</PhoneLink>,
          })}
        </p>
        {home && (
          <p>
            <strong>{t("euHomeLabel")}</strong>{" "}
            <HelpLink source={getSource(home)}>{getSource(home).publisher}</HelpLink>
          </p>
        )}
      </section>
    </div>
  );
}

/**
 * A "What happened to you?" guide: what probably happened, rights where the
 * visitor lives, a letter to fill in, and where to turn if nobody answers.
 */
export default function SituationPage({ params: { locale, situation: id } }: Props) {
  setRequestLocale(locale);
  const situation = getSituation(id);
  if (!situation) notFound();
  const t = useTranslations("Help");
  const tc = useTranslations("Common");
  const k = (key: string) => t(`${situation.id}.${key}`);
  const panels = Object.fromEntries(
    REGIONS.map((r) => [r, <RegionPanel key={r} situation={situation} region={r} locale={locale} />])
  ) as Record<Region, React.ReactNode>;

  return (
    <main id="main" className="mx-auto flex max-w-3xl flex-col gap-14 px-4 py-12 sm:py-16">
      <header className="flex flex-col gap-5">
        <Link href="/help" className={`tap-target inline-flex items-center gap-2 self-start ${linkClass}`}>
          <ArrowLeft aria-hidden="true" className="size-5" />
          {t("backToHelp")}
        </Link>
        <h1>{k("title")}</h1>
        <p className="text-xl">{k("lead")}</p>
        <p className="text-base text-muted-foreground">
          {t("pending")} {tc("legalNotice")}
        </p>
      </header>

      <section aria-labelledby="happened" className="flex flex-col gap-4">
        <h2 id="happened">{t("happenedHeading")}</h2>
        <ul className="flex list-disc flex-col gap-3 pl-6">
          {situation.happened.map((key) => (
            <li key={key}>{k(`happened.${key}`)}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="where" className="flex flex-col gap-4">
        <h2 id="where">{t("whereHeading")}</h2>
        <RegionPicker initial={homeRegion(locale)} panels={panels} />
      </section>

      <section aria-labelledby="company" className="depth-card flex flex-col gap-4 p-6 sm:p-8">
        <h2 id="company" className="flex items-start gap-3">
          <Handshake aria-hidden="true" className="mt-2 size-8 shrink-0 text-link" />
          {t("companyHeading")}
        </h2>
        <p>{t("companyLead")}</p>
        <ul className="flex list-disc flex-col gap-3 pl-6">
          {situation.company.map(({ key, cites }) => (
            <li key={key}>
              {t.rich(`${situation.id}.company.${key}`, { b: bold })}
              {cites && <Cite ids={cites} />}
            </li>
          ))}
        </ul>
        <p>
          {t.rich("companyClose", {
            forum: (c) => (
              <Link href="/forum" className={linkClass}>
                {c}
              </Link>
            ),
          })}
        </p>
      </section>

      <section aria-labelledby="urgent" className="flex flex-col gap-4">
        <h2 id="urgent">{t("urgentHeading")}</h2>
        <p>{t("urgent")}</p>
      </section>

      <section aria-labelledby="record" className="flex flex-col gap-4">
        <h2 id="record">{t("recordHeading")}</h2>
        <p>{t("record")}</p>
        <p>
          {t.rich("forum", {
            forum: (c) => (
              <Link href="/forum" className={linkClass}>
                {c}
              </Link>
            ),
          })}
        </p>
      </section>
    </main>
  );
}

import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/lib/i18n/navigation";
import {
  corrections,
  pick,
  reviews,
  weDid,
  type Correction,
  type LocalizedText,
  type Review,
  type WeDidEntry,
} from "@/lib/public-log";
import { REPO_URL } from "@/lib/site";
import { formatDate } from "@/lib/dates";

const linkClass = "font-semibold text-link underline underline-offset-4";
// These links stand alone, not inside a sentence, so they get full-size touch targets (SC 2.5.8).
const standaloneLink = `${linkClass} tap-target inline-flex items-center self-start`;

/** A page's name in the visitor's language: "/guide" -> "Guide". */
function usePageName() {
  const nav = useTranslations("Navigation");
  const how = useTranslations("HowItWorks");
  return (page: string) => {
    if (page === "/how-it-works") return how("title");
    const key = page === "/" ? "home" : page.slice(1);
    return nav.has(key) ? nav(key) : page;
  };
}

/** The date, the page link, and (if any) the commit link that every entry starts or ends with. */
function EntryMeta({ date, page }: { date: string; page: `/${string}` }) {
  const locale = useLocale();
  const pageName = usePageName();
  return (
    <p className="flex flex-wrap items-center gap-x-3 text-base text-muted-foreground">
      <time dateTime={date} className="font-semibold text-foreground">
        {formatDate(date, locale)}
      </time>
      <Link href={page} className={standaloneLink}>
        {pageName(page)}
      </Link>
    </p>
  );
}

function CommitLink({ commit }: { commit?: string }) {
  const t = useTranslations("PublicLog");
  if (!commit) return null;
  return (
    <a href={`${REPO_URL}/commit/${commit}`} className={`${standaloneLink} text-base`}>
      {t("commit")}
    </a>
  );
}

/** Text in the visitor's language, or in English marked lang="en". */
function useLocalized() {
  const locale = useLocale();
  return (text: LocalizedText) => pick(text, locale);
}

/** "Only in English for now", when a non-English visitor sees English text. */
function EnglishOnlyNote({ langs }: { langs: string[] }) {
  const t = useTranslations("PublicLog");
  const locale = useLocale();
  const show = locale !== "en" && langs.includes("en");
  return show ? <p className="text-sm text-muted-foreground">{t("englishOnly")}</p> : null;
}

/**
 * The public corrections log: each error the site made, what changed, and
 * who flagged it if they asked for credit. Entries come only from
 * content/corrections.json, which Robert writes by hand.
 */
export function CorrectionsLog({ entries = corrections }: { entries?: Correction[] }) {
  const t = useTranslations("PublicLog");
  const localized = useLocalized();
  if (entries.length === 0) return <p>{t("noCorrections")}</p>;
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <ol className="flex flex-col gap-6">
      {sorted.map((c) => {
        const wrong = localized(c.wrong);
        const changed = localized(c.changed);
        return (
          <li key={c.id} className="depth-card flex flex-col gap-3 p-5 sm:p-6">
            <EntryMeta date={c.date} page={c.page} />
            <dl className="flex flex-col gap-3">
              <div>
                <dt className="font-display font-bold">{t("wrong")}</dt>
                <dd lang={wrong.lang}>{wrong.text}</dd>
              </div>
              <div>
                <dt className="font-display font-bold">{t("changed")}</dt>
                <dd lang={changed.lang}>{changed.text}</dd>
              </div>
            </dl>
            {c.flaggedBy && <p className="text-base">{t("flaggedBy", { name: c.flaggedBy })}</p>}
            <EnglishOnlyNote langs={[wrong.lang, changed.lang]} />
            <CommitLink commit={c.commit} />
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The "We did" column of the forum's traceability card: what changed on the
 * site because of votes. Entries come only from content/we-did.json, which
 * Robert writes by hand; until then the column says nothing has changed yet.
 */
export function WeDidList({ entries = weDid }: { entries?: WeDidEntry[] }) {
  const t = useTranslations("Forum.loop");
  const localized = useLocalized();
  if (entries.length === 0) return <>{t("didText")}</>;
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <ul className="flex flex-col gap-4">
      {sorted.map((e) => {
        const did = localized(e.did);
        return (
          <li key={e.id} className="flex flex-col gap-1">
            <EntryMeta date={e.date} page={e.page} />
            <span lang={did.lang}>{did.text}</span>
            <EnglishOnlyNote langs={[did.lang]} />
            <CommitLink commit={e.commit} />
          </li>
        );
      })}
    </ul>
  );
}

/** Who reviewed, shown the way they chose: by name, as an organisation, or described without a name. */
function Reviewer({ credit }: { credit: Review["credit"] }) {
  const localized = useLocalized();
  const tc = useTranslations("Common");
  if (credit.as === "anonymous") {
    const description = localized(credit.description);
    return <span lang={description.lang}>{description.text}</span>;
  }
  const label = credit.as === "name" ? [credit.name, credit.organisation].filter(Boolean).join(", ") : credit.organisation;
  if (!credit.url) return <>{label}</>;
  return (
    <a
      href={credit.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} ${tc("opensInNewTab")}`}
      className={linkClass}
    >
      {label}
    </a>
  );
}

/** One review: when, who, what they looked at, and in which language they read the page. */
function ReviewFacts({ review }: { review: Review }) {
  const t = useTranslations("PublicLog");
  const locale = useLocale();
  const localized = useLocalized();
  const scope = localized(review.scope);
  const language = new Intl.DisplayNames([locale], { type: "language" }).of(review.language) ?? review.language;
  return (
    <>
      <p className="font-display font-bold">
        <time dateTime={review.date}>{t("reviewedOn", { date: formatDate(review.date, locale) })}</time>
      </p>
      <dl className="flex flex-col gap-1 text-base">
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-bold">{t("reviewBy")} </dt>
          <dd>
            <Reviewer credit={review.credit} />
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-bold">{t("reviewScope")} </dt>
          <dd lang={scope.lang}>{scope.text}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-bold">{t("reviewLanguage")} </dt>
          <dd>{language}</dd>
        </div>
      </dl>
    </>
  );
}

/**
 * The reviews of one part of a help page, shown at the top of that part.
 * Renders nothing when there are none. Every note ends by saying that a
 * review covers only the part named, so it never reads as approval of more.
 */
export function ReviewNotes({ entries }: { entries: Review[] }) {
  const t = useTranslations("PublicLog");
  if (entries.length === 0) return null;
  return (
    <ul className="flex flex-col gap-4" data-testid="review-notes">
      {entries.map((r) => (
        <li key={r.id} className="flex flex-col gap-2 rounded-md border-l-4 border-primary bg-muted/70 p-4">
          <ReviewFacts review={r} />
          <p className="text-sm text-muted-foreground">{t("reviewLimit")}</p>
        </li>
      ))}
    </ul>
  );
}

/**
 * Every review on the site, newest first, for How this site works. Entries
 * come only from content/reviews.json, which Robert writes by hand after the
 * reviewer has agreed to the exact words.
 */
export function ReviewList({ entries = reviews }: { entries?: Review[] }) {
  const t = useTranslations("PublicLog");
  const help = useTranslations("Help");
  if (entries.length === 0) return <p>{t("noReviews")}</p>;
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-col gap-6">
        {sorted.map((r) => (
          <li key={r.id} className="depth-card flex flex-col gap-2 p-5 sm:p-6">
            <Link href={`/help/${r.guide}?where=${r.region}`} className={standaloneLink}>
              {help(`${r.guide}.title`)} · {help(`regions.${r.region}`)}
            </Link>
            <ReviewFacts review={r} />
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted-foreground">{t("reviewLimit")}</p>
    </div>
  );
}

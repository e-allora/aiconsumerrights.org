import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/lib/i18n/navigation";
import { corrections, pick, weDid, type Correction, type LocalizedText, type WeDidEntry } from "@/lib/public-log";
import { REPO_URL } from "@/lib/site";
import { formatDate } from "@/lib/sources";

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

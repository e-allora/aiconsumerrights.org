import { useTranslations } from "next-intl";

import { RULES, type StatementResult } from "@/lib/forum/consensus";
import { LOCALE_TAGS } from "@/lib/i18n/routing";

/**
 * Highlights what different language groups agree on, not where they split.
 * `items` holds only statements with broad agreement (see broadAgreement);
 * every number shown comes from real votes.
 */
export function ConsensusCluster({
  items,
  progress,
}: {
  items: StatementResult[];
  progress: { votes: number; languages: number };
}) {
  const t = useTranslations("Forum.consensus");
  const tf = useTranslations("Forum");
  const tn = useTranslations("Navigation");
  return (
    <section aria-labelledby="consensus-heading" className="depth-card flex flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-col gap-2">
        <h3 id="consensus-heading" className="text-display-md">
          {t("heading")}
        </h3>
        <p className="text-base">{t.rich("lead", { ...RULES, b: (c) => <strong>{c}</strong> })}</p>
        <p data-testid="progress" className="text-base text-muted-foreground">
          {progress.votes === 0 ? t("noVotes") : t("progress", progress)}
        </p>
      </div>
      {items.length === 0 ? (
        <p className="text-base">{t("none")}</p>
      ) : (
        <ul className="flex flex-col gap-6">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col gap-3">
              <p className="text-lg">
                <strong>{t("summary", { percent: item.lowest })}</strong> {tf(`statements.${item.id}`)}
              </p>
              <dl className="grid gap-2 sm:grid-cols-3">
                {item.groups.map((g) => (
                  <div key={g.locale} className="flex flex-col gap-1">
                    <dt className="text-sm font-bold" lang={LOCALE_TAGS[g.locale].lang}>
                      {tn(`languageNames.${g.locale}`)}
                    </dt>
                    <dd className="flex items-center gap-2 text-sm">
                      <span aria-hidden="true" className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                        <span className="block h-full bg-primary" style={{ width: `${g.agree}%` }} />
                      </span>
                      <span>{t("groupAgree", { percent: g.agree, votes: g.votes })}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

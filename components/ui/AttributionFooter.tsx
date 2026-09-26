import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { SourceCategoryList, SourceLink } from "@/components/ui/SourceList";
import { Link } from "@/lib/i18n/navigation";
import { formatDate, sources, type Registry } from "@/lib/sources";

/**
 * Content provenance for every page: which AI models helped, which primary
 * sources ground the facts, and where human review stands. Everything shown
 * comes from lib/data/sources.json, so the footer can't claim more than the
 * record holds.
 */
export function AttributionFooter({ registry = sources }: { registry?: Registry }) {
  const t = useTranslations("Attribution");
  const locale = useLocale();
  // Only models with a record of their work are credited.
  const models = registry.models.filter((m) => m.confirmed);
  const primary = registry.categories.flatMap((c) => c.sources.filter((s) => s.primary));
  const total = registry.categories.reduce((n, c) => n + c.sources.length, 0);
  const { review } = registry;
  const modelName = (id: string, fallback: string) =>
    t.has(`modelNames.${id}`) ? t(`modelNames.${id}`) : fallback;
  const maker = (m: string) => (m === "Various" ? t("variousMakers") : m);
  const languageNote = t("sourcesLanguageNote");

  return (
    <footer
      aria-labelledby="provenance-heading"
      className="mt-24 border-t-2 border-border/10 bg-muted/60"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12">
        <h2 id="provenance-heading" className="text-display-md">
          {t("heading")}
        </h2>

        <div className="grid gap-8 md:grid-cols-3">
          <section aria-labelledby="provenance-ai">
            <h3 id="provenance-ai" className="text-display-sm">
              {t("aiHeading")}
            </h3>
            <p className="mt-2 text-base">{t("aiLead")}</p>
            <ul className="mt-3 flex flex-col gap-2 text-base">
              {models.map((m) => (
                <li key={m.id}>
                  <strong>
                    {modelName(m.id, m.name)} ({maker(m.maker)})
                  </strong>
                  . {t(`models.${m.id}`)}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="provenance-primary">
            <h3 id="provenance-primary" className="text-display-sm">
              {t("primaryHeading")}
            </h3>
            <ul className="mt-3 flex flex-col gap-2 text-base">
              {primary.map((s) => (
                <li key={s.id}>
                  <SourceLink source={s} />
                  {s.publisher && (
                    <span lang="en" className="block text-sm text-muted-foreground">
                      {s.publisher}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="provenance-review">
            <h3 id="provenance-review" className="text-display-sm">
              {t("reviewHeading")}
            </h3>
            <dl className="mt-3 flex flex-col gap-2 text-base">
              <div>
                <dt className="font-bold">{t("reviewLabel")}</dt>
                <dd data-testid="review-status">
                  {review.status === "reviewed" && review.reviewedOn
                    ? t("reviewDone", {
                        reviewer: review.reviewer,
                        date: formatDate(review.reviewedOn, locale),
                      })
                    : t("reviewPending", { reviewer: review.reviewer })}
                </dd>
                <dd data-testid="translation-thanks" className="mt-2 italic">
                  {t("translationThanks")}
                </dd>
              </div>
              <div>
                <dt className="font-bold">{t("checkedLabel")}</dt>
                <dd>{formatDate(registry.checkedOn, locale)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <details className="group depth-card p-0">
          <summary className="tap-target flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-6 py-4 font-display text-lg font-bold [&::-webkit-details-marker]:hidden">
            {t("seeAll", { total, groups: registry.categories.length })}
            <ChevronDown
              aria-hidden="true"
              className="size-5 shrink-0 transition-transform duration-base ease-out-soft group-open:rotate-180"
            />
          </summary>
          <div className="flex flex-col gap-8 px-6 pb-6">
            <p className="text-base">{t("registryAbout")}</p>
            {languageNote && <p className="text-base">{languageNote}</p>}
            {registry.categories.map((c) => (
              <SourceCategoryList key={c.id} category={c} />
            ))}
            <Link
              href="/sources"
              className="tap-target self-start font-semibold text-link underline underline-offset-4"
            >
              {t("openRegistry")}
            </Link>
          </div>
        </details>
      </div>
    </footer>
  );
}

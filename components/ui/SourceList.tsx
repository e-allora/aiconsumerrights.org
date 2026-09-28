import { ExternalLink as ExternalIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { formatDate, sourceNumber, sources, type Source, type SourceCategory } from "@/lib/sources";
import { cn } from "@/lib/utils";

// Source titles stay in their original language, marked with lang so screen
// readers pronounce them correctly (SC 3.1.2). Most are English; French,
// German, Italian and Portuguese laws carry their own language.

/** An external source link: new tab, no opener access, and a full accessible name. */
export function SourceLink({ source, className }: { source: Source; className?: string }) {
  const t = useTranslations("Common");
  const lang = source.lang ?? "en";
  if (!source.url) {
    return (
      <span lang={lang} className={className}>
        {source.title}
      </span>
    );
  }
  const name = source.publisher ? `${source.title}, ${source.publisher}` : source.title;
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      hrefLang={lang}
      aria-label={`${name} ${t("opensInNewTab")}`}
      className={cn(
        "tap-target inline-flex items-center gap-1 font-semibold text-link underline underline-offset-4 hover:decoration-2",
        className
      )}
    >
      <span lang={lang}>{source.title}</span>
      <ExternalIcon aria-hidden="true" className="size-4 shrink-0 self-center" />
    </a>
  );
}

function SourceMeta({ source, detailed }: { source: Source; detailed: boolean }) {
  const t = useTranslations("Attribution.status");
  const ta = useTranslations("Attribution");
  const locale = useLocale();
  const bits = [source.author, source.publisher, source.date, source.type, source.jurisdiction].filter(Boolean);
  return (
    <p className="text-base text-muted-foreground">
      <span lang="en">{bits.join(" · ")}</span>
      {detailed && source.summary && (
        <span lang="en" className="mt-1 block text-foreground">
          {source.summary}
        </span>
      )}
      <span className="block text-sm">
        {t(source.status)}
        {source.note ? (
          <>
            . <span lang="en">{source.note}</span>
          </>
        ) : null}
      </span>
      {source.readBy && (
        <span className="block text-sm font-semibold text-foreground">
          {ta("readBy", { name: sources.review.reviewer, date: formatDate(source.readBy, locale) })}
        </span>
      )}
    </p>
  );
}

/** One category of the registry. `anchors` gives each item an id for /sources#id links. */
export function SourceCategoryList({
  category,
  headingLevel = "h3",
  anchors = false,
}: {
  category: SourceCategory;
  headingLevel?: "h2" | "h3";
  anchors?: boolean;
}) {
  const t = useTranslations("Attribution.categories");
  const Heading = headingLevel;
  const headingId = `${anchors ? "" : "footer-"}cat-${category.id}`;
  return (
    <section aria-labelledby={headingId}>
      <Heading id={headingId} className="text-display-sm">
        {t(category.id)}
      </Heading>
      <ul className="mt-3 flex flex-col gap-4">
        {category.sources.map((s) => (
          <li key={s.id} id={anchors ? s.id : undefined} className="scroll-mt-24">
            <span className="mr-2 font-display font-bold text-muted-foreground">
              {sourceNumber(s.id)}.
            </span>
            <SourceLink source={s} />
            <SourceMeta source={s} detailed={anchors} />
          </li>
        ))}
      </ul>
    </section>
  );
}

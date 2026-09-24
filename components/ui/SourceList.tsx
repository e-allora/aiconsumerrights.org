import { ExternalLink as ExternalIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { sourceNumber, type Source, type SourceCategory } from "@/lib/sources";
import { cn } from "@/lib/utils";

// Source titles and details stay in their original language (English), so
// they carry lang="en" and screen readers pronounce them correctly (SC 3.1.2).

/** An external source link: new tab, no opener access, and a full accessible name. */
export function SourceLink({ source, className }: { source: Source; className?: string }) {
  const t = useTranslations("Common");
  if (!source.url) {
    return (
      <span lang="en" className={className}>
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
      hrefLang="en"
      aria-label={`${name} ${t("opensInNewTab")}`}
      className={cn(
        "tap-target inline-flex items-center gap-1 font-semibold text-link underline underline-offset-4 hover:decoration-2",
        className
      )}
    >
      <span lang="en">{source.title}</span>
      <ExternalIcon aria-hidden="true" className="size-4 shrink-0 self-center" />
    </a>
  );
}

function SourceMeta({ source }: { source: Source }) {
  const t = useTranslations("Attribution.status");
  const bits = [source.author, source.publisher, source.date, source.type].filter(Boolean);
  return (
    <p className="text-base text-muted-foreground">
      <span lang="en">{bits.join(" · ")}</span>
      <span className="block text-sm">
        {t(source.status)}
        {source.note ? (
          <>
            . <span lang="en">{source.note}</span>
          </>
        ) : null}
      </span>
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
            <SourceMeta source={s} />
          </li>
        ))}
      </ul>
    </section>
  );
}

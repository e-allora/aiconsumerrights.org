import { ExternalLink as ExternalIcon } from "lucide-react";

import {
  STATUS_LABEL,
  externalLabel,
  sourceNumber,
  type Source,
  type SourceCategory,
} from "@/lib/sources";
import { cn } from "@/lib/utils";

/** An external source link: new tab, no opener access, and a full accessible name. */
export function SourceLink({ source, className }: { source: Source; className?: string }) {
  if (!source.url) return <span className={className}>{source.title}</span>;
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={externalLabel(source)}
      className={cn(
        "inline-flex items-baseline gap-1 font-semibold text-primary underline underline-offset-4 hover:decoration-2",
        className
      )}
    >
      {source.title}
      <ExternalIcon aria-hidden="true" className="size-4 shrink-0 self-center" />
    </a>
  );
}

function SourceMeta({ source }: { source: Source }) {
  const bits = [source.author, source.publisher, source.date, source.type].filter(Boolean);
  return (
    <p className="text-base text-muted-foreground">
      {bits.join(" · ")}
      <span className="block text-sm">
        {STATUS_LABEL[source.status]}
        {source.note ? `. ${source.note}` : ""}
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
  const Heading = headingLevel;
  const headingId = `${anchors ? "" : "footer-"}cat-${category.id}`;
  return (
    <section aria-labelledby={headingId}>
      <Heading id={headingId} className="text-display-sm">
        {category.title}
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

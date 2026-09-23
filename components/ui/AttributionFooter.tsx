import { ChevronDown } from "lucide-react";

import { SourceCategoryList, SourceLink } from "@/components/ui/SourceList";
import { formatDate, sources, type Registry } from "@/lib/sources";

/**
 * Content provenance for every page: which AI models helped, which primary
 * sources ground the facts, and where human review stands. Everything shown
 * comes from lib/data/sources.json, so the footer can't claim more than the
 * record holds.
 */
export function AttributionFooter({ registry = sources }: { registry?: Registry }) {
  // Only models with a record of their work are credited.
  const models = registry.models.filter((m) => m.confirmed);
  const primary = registry.categories.flatMap((c) => c.sources.filter((s) => s.primary));
  const total = registry.categories.reduce((n, c) => n + c.sources.length, 0);
  const { review } = registry;

  return (
    <footer
      aria-labelledby="provenance-heading"
      className="mt-24 border-t-2 border-border/10 bg-muted/60"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12">
        <h2 id="provenance-heading" className="text-display-md">
          How this site was made
        </h2>

        <div className="grid gap-8 md:grid-cols-3">
          <section aria-labelledby="provenance-ai">
            <h3 id="provenance-ai" className="text-display-sm">
              AI helped research and draft
            </h3>
            <p className="mt-2 text-base">
              This site was researched and drafted with help from several AI models. A person
              decides what is published.
            </p>
            <ul className="mt-3 flex flex-col gap-2 text-base">
              {models.map((m) => (
                <li key={m.id}>
                  <strong>
                    {m.name} ({m.maker})
                  </strong>
                  . {m.role}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="provenance-primary">
            <h3 id="provenance-primary" className="text-display-sm">
              Facts rest on primary sources
            </h3>
            <ul className="mt-3 flex flex-col gap-2 text-base">
              {primary.map((s) => (
                <li key={s.id}>
                  <SourceLink source={s} />
                  {s.publisher && <span className="block text-sm text-muted-foreground">{s.publisher}</span>}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="provenance-review">
            <h3 id="provenance-review" className="text-display-sm">
              A person reviews every page
            </h3>
            <dl className="mt-3 flex flex-col gap-2 text-base">
              <div>
                <dt className="font-bold">Human review</dt>
                <dd data-testid="review-status">
                  {review.status === "reviewed" && review.reviewedOn
                    ? `Reviewed by ${review.reviewer} on ${formatDate(review.reviewedOn)}.`
                    : `Not yet complete. ${review.reviewer} reviews each page before launch.`}
                </dd>
              </div>
              <div>
                <dt className="font-bold">Sources checked</dt>
                <dd>{formatDate(registry.checkedOn)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <details className="group depth-card p-0">
          <summary className="tap-target flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-6 py-4 font-display text-lg font-bold [&::-webkit-details-marker]:hidden">
            See all {total} sources in {registry.categories.length} groups
            <ChevronDown
              aria-hidden="true"
              className="size-5 shrink-0 transition-transform duration-base ease-out-soft group-open:rotate-180"
            />
          </summary>
          <div className="flex flex-col gap-8 px-6 pb-6">
            <p className="text-base">{registry.about}</p>
            {registry.categories.map((c) => (
              <SourceCategoryList key={c.id} category={c} />
            ))}
            <a
              href="/sources"
              className="tap-target self-start font-semibold text-primary underline underline-offset-4"
            >
              Open the full source registry
            </a>
          </div>
        </details>
      </div>
    </footer>
  );
}

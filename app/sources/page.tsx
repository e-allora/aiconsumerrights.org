import type { Metadata } from "next";

import { SourceCategoryList } from "@/components/ui/SourceList";
import { formatDate, sources } from "@/lib/sources";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Sources",
  description: "Every source this site draws on, grouped by topic, with how well each link has been checked and when.",
  path: "/sources",
});

export default function SourcesPage() {
  const total = sources.categories.reduce((n, c) => n + c.sources.length, 0);
  return (
    <main id="main" className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-12 sm:py-16">
      <header className="flex flex-col gap-4">
        <h1>Sources</h1>
        <p className="text-xl">
          <strong>
            All {total} sources in {sources.categories.length} groups, checked on{" "}
            {formatDate(sources.checkedOn)}.
          </strong>{" "}
          Numbers match the small source markers on every page.
        </p>
        <p className="text-base text-muted-foreground">{sources.about}</p>
      </header>
      {sources.categories.map((c) => (
        <SourceCategoryList key={c.id} category={c} headingLevel="h2" anchors />
      ))}
    </main>
  );
}

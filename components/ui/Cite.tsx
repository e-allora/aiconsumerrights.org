import { useTranslations } from "next-intl";

import { Link } from "@/lib/i18n/navigation";
import { getSource, sourceNumber } from "@/lib/sources";

/**
 * A footnote-style marker linking to the source on /sources, in the current
 * locale. An unknown id throws, so a bad citation fails the build and tests.
 */
export function Cite({ ids }: { ids: string[] }) {
  const t = useTranslations("Common");
  return (
    <sup className="ml-0.5 whitespace-nowrap text-sm">
      {ids.map((id, i) => {
        const source = getSource(id);
        const n = sourceNumber(id);
        return (
          <span key={id}>
            {i > 0 && ","}
            <Link
              href={`/sources#${id}`}
              aria-label={t("sourceMarker", { number: n, title: source.title })}
              className="font-semibold text-link underline underline-offset-2"
            >
              {n}
            </Link>
          </span>
        );
      })}
    </sup>
  );
}

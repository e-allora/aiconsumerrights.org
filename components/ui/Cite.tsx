import { getSource, sourceNumber } from "@/lib/sources";

/**
 * A footnote-style marker linking to the source on /sources.
 * An unknown id throws, so a bad citation fails the build and the tests.
 */
export function Cite({ ids }: { ids: string[] }) {
  return (
    <sup className="ml-0.5 whitespace-nowrap text-sm">
      {ids.map((id, i) => {
        const source = getSource(id);
        const n = sourceNumber(id);
        return (
          <span key={id}>
            {i > 0 && ","}
            <a
              href={`/sources#${id}`}
              aria-label={`Source ${n}: ${source.title}`}
              className="font-semibold text-link underline underline-offset-2"
            >
              {n}
            </a>
          </span>
        );
      })}
    </sup>
  );
}

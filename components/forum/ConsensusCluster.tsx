import { cn } from "@/lib/utils";

export type GroupAgreement = { group: string; agree: number };
export type ConsensusItem = { id: string; statement: string; groups: GroupAgreement[] };

/** Broad agreement means every group agrees at or above the threshold. */
export const BROAD_AGREEMENT = 60;

export const lowestAgreement = (item: ConsensusItem) => Math.min(...item.groups.map((g) => g.agree));
export const averageAgreement = (item: ConsensusItem) =>
  Math.round(item.groups.reduce((n, g) => n + g.agree, 0) / item.groups.length);

/**
 * Highlights what different groups agree on, not where they split.
 * `example` must be set whenever the numbers are not real votes; the card
 * then says so at the top, in words, before any number.
 */
export function ConsensusCluster({ items, example }: { items: ConsensusItem[]; example: boolean }) {
  const broad = items.filter((i) => lowestAgreement(i) >= BROAD_AGREEMENT);
  return (
    <section aria-labelledby="consensus-heading" className="depth-card flex flex-col gap-6 p-6 sm:p-8">
      {example && (
        <p
          data-testid="example-banner"
          className="rounded-md border-2 border-dashed border-foreground/40 bg-muted px-4 py-3 text-base font-bold"
        >
          Example data. No votes have been counted yet. These numbers only show how results
          will look.
        </p>
      )}
      <div className="flex flex-col gap-2">
        <h3 id="consensus-heading" className="text-display-md">
          Where groups agree
        </h3>
        <p className="text-base">
          <strong>Common ground comes first.</strong> A statement shows here only when every group
          agrees at {BROAD_AGREEMENT}% or more.
        </p>
      </div>
      {broad.length === 0 ? (
        <p className="text-base">No statement has broad agreement yet.</p>
      ) : (
        <ul className="flex flex-col gap-6">
          {broad.map((item) => (
            <li key={item.id} className="flex flex-col gap-3">
              <p className="text-lg">
                <strong>
                  {averageAgreement(item)}% of participants across all groups agree
                </strong>{" "}
                that {item.statement}
                {example && <span className="text-muted-foreground"> (example)</span>}
              </p>
              <dl className="grid gap-2 sm:grid-cols-3">
                {item.groups.map((g) => (
                  <div key={g.group} className="flex flex-col gap-1">
                    <dt className="text-sm font-bold">{g.group}</dt>
                    <dd className="flex items-center gap-2 text-sm">
                      <span
                        aria-hidden="true"
                        className="h-3 flex-1 overflow-hidden rounded-full bg-muted"
                      >
                        <span
                          className={cn("block h-full bg-primary")}
                          style={{ width: `${g.agree}%` }}
                        />
                      </span>
                      <span>{g.agree}% agree</span>
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

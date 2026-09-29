"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { REGIONS, isRegion, type Region } from "@/lib/help";

/**
 * "Where do you live?" The panels are rendered on the server, one per
 * region; this only chooses which one shows. The choice is kept in the
 * address as ?where=, so a visitor can share or bookmark their answer.
 */
export function RegionPicker({
  initial,
  panels,
}: {
  initial?: Region;
  panels: Record<Region, React.ReactNode>;
}) {
  const t = useTranslations("Help.regions");
  const name = React.useId();
  const [region, setRegion] = React.useState<Region | undefined>(initial);

  React.useEffect(() => {
    const where = new URLSearchParams(window.location.search).get("where");
    if (isRegion(where)) setRegion(where);
  }, []);

  function choose(next: Region) {
    setRegion(next);
    const url = new URL(window.location.href);
    url.searchParams.set("where", next);
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 font-display text-lg font-bold">{t("question")}</legend>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r) => (
            <label
              key={r}
              className="tap-target inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-border/20 bg-card px-4 py-2 font-semibold has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2"
            >
              <input
                type="radio"
                name={name}
                value={r}
                checked={region === r}
                onChange={() => choose(r)}
                className="sr-only"
              />
              {t(r)}
            </label>
          ))}
        </div>
      </fieldset>
      {region ? panels[region] : <p className="text-base text-muted-foreground">{t("pickFirst")}</p>}
    </div>
  );
}

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

// Order matters: the letters spell PAUSE in English and PAUSA in Spanish.
// Each step's letter, title, and body live in messages/*.json.
export const PAUSE_STEPS = ["protect", "assess", "understand", "seek", "exit"] as const;

/**
 * The PAUSE Strategy as five letter tabs that spell the word, each opening
 * its step on a depth card. WAI-ARIA tabs pattern: Tab reaches the letters,
 * arrow keys move between them, Home and End jump to the ends.
 */
export function PAUSEStrategy() {
  const t = useTranslations("PAUSEStrategy");
  const baseId = React.useId();
  const [active, setActive] = React.useState(0);
  const [announcement, setAnnouncement] = React.useState("");
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const total = PAUSE_STEPS.length;
  const step = (i: number, key: "letter" | "title" | "body") => t(`steps.${PAUSE_STEPS[i]}.${key}`);
  const tabId = (i: number) => `${baseId}-tab-${i}`;
  const panelId = `${baseId}-panel`;

  function select(i: number, focus = false) {
    setActive(i);
    setAnnouncement(t("announce", { current: i + 1, total, title: step(i, "title") }));
    if (focus) tabRefs.current[i]?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent, i: number) {
    const last = total - 1;
    const target =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? (i === last ? 0 : i + 1)
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i === 0 ? last : i - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (target === null) return;
    e.preventDefault();
    select(target, true);
  }

  return (
    <section aria-labelledby={`${baseId}-title`} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 id={`${baseId}-title`}>{t("title")}</h2>
        <p className="text-xl">
          <strong>{t("subtitle")}</strong>
        </p>
        <p className="text-base text-muted-foreground">{t("hint")}</p>
      </div>

      <div role="tablist" aria-label={t("tablistLabel")} className="grid grid-cols-5 gap-2 sm:gap-3 [perspective:900px]">
        {PAUSE_STEPS.map((id, i) => {
          const selected = i === active;
          return (
            <button
              key={id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              id={tabId(i)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              aria-label={t("tabName", { letter: step(i, "letter"), title: step(i, "title") })}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "depth-card depth-card-interactive tap-target press flex min-h-20 flex-col items-center justify-center gap-1 p-2 text-center sm:min-h-28 sm:p-3",
                "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                selected && "border-primary bg-primary text-primary-foreground shadow-depth-3"
              )}
            >
              <span aria-hidden="true" className="font-display text-4xl font-extrabold leading-none sm:text-5xl">
                {step(i, "letter")}
              </span>
              <span aria-hidden="true" className="hidden text-xs font-semibold leading-tight sm:block">
                {step(i, "title")}
              </span>
            </button>
          );
        })}
      </div>

      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={tabId(active)}
        tabIndex={0}
        className="depth-card flex flex-col gap-5 p-6 sm:flex-row focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-8"
      >
        <span
          aria-hidden="true"
          className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary font-display text-4xl font-extrabold text-primary-foreground shadow-depth-2"
        >
          {step(active, "letter")}
        </span>
        <div className="flex flex-col gap-3">
          <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            {t("stepOf", { current: active + 1, total })}
          </p>
          <h3 className="text-display-md">{step(active, "title")}</h3>
          <p className="text-lg">{step(active, "body")}</p>
        </div>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}

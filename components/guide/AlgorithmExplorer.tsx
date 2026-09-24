"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Cite } from "@/components/ui/Cite";
import { SourceLink } from "@/components/ui/SourceList";
import { getSource } from "@/lib/sources";
import { cn } from "@/lib/utils";

// Each step asks a little more of both sides, and each starts from good faith.
// Text lives in messages/*.json under Guide.explorer.steps.<id>.
export const STEPS = [
  { id: "ask", cites: [["cfpb-reg-b"], ["gdpr"]] },
  { id: "review", cites: [["gdpr"], ["ostp-blueprint-2022"]] },
  { id: "dialogue", cites: [["ftc-ai-comply-2024"], []] },
] as const;

type View = { kind: "step"; index: number } | { kind: "resolved"; index: number } | { kind: "agency" };

export function AlgorithmExplorer() {
  const t = useTranslations("Guide.explorer");
  const tc = useTranslations("Common");
  const baseId = React.useId();
  const [view, setView] = React.useState<View>({ kind: "step", index: 0 });
  const [announcement, setAnnouncement] = React.useState("");
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const panelHeadingRef = React.useRef<HTMLHeadingElement>(null);
  const moveFocusToPanel = React.useRef(false);

  const total = STEPS.length;
  const active = view.kind === "agency" ? total - 1 : view.index;
  const tabId = (i: number) => `${baseId}-tab-${i}`;
  const panelId = `${baseId}-panel`;
  const s = (i: number, key: string) => t(`steps.${STEPS[i].id}.${key}`);
  const stepAnnouncement = (i: number) => t("announceStep", { current: i + 1, total, title: s(i, "title") });

  // After a button inside the panel changes the view, move focus to the new
  // heading so screen-reader and keyboard users land on what changed.
  React.useEffect(() => {
    if (moveFocusToPanel.current) {
      moveFocusToPanel.current = false;
      panelHeadingRef.current?.focus();
    }
  }, [view]);

  function go(next: View, message: string, focusPanel = true) {
    moveFocusToPanel.current = focusPanel;
    setView(next);
    setAnnouncement(message);
  }

  function selectStep(i: number, focusTab = false) {
    go({ kind: "step", index: i }, stepAnnouncement(i), false);
    if (focusTab) tabRefs.current[i]?.focus();
  }

  // WAI-ARIA tabs pattern: arrow keys move between steps, Home and End jump.
  function onTabKeyDown(e: React.KeyboardEvent, i: number) {
    const last = total - 1;
    const target =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? (i === last ? 0 : i + 1)
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i === 0 ? last : i - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (target === null) return;
    e.preventDefault();
    selectStep(target, true);
  }

  const restart = () => go({ kind: "step", index: 0 }, stepAnnouncement(0));

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label={t("tablistLabel")}
        className="grid grid-cols-3 gap-3 [perspective:900px]"
      >
        {STEPS.map((step, i) => {
          const selected = i === active;
          return (
            <button
              key={step.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              id={tabId(i)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectStep(i)}
              onKeyDown={(e) => onTabKeyDown(e, i)}
              className={cn(
                "depth-card depth-card-interactive tap-target press flex flex-col items-start gap-1 p-3 text-left focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-4",
                selected && "border-primary shadow-depth-3"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-8 place-items-center rounded-full font-display text-base font-extrabold",
                  selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                )}
              >
                {i + 1}
              </span>
              <span className="font-display text-sm font-bold leading-tight sm:text-base">
                <span className="sr-only">{t("stepPrefix", { number: i + 1 })}</span>
                {s(i, "short")}
              </span>
            </button>
          );
        })}
      </div>

      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={tabId(active)}
        className="depth-card p-6 sm:p-8"
      >
        {view.kind === "step" && (
          <div className="flex flex-col gap-5">
            <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              {t("stepOf", { current: active + 1, total })}
            </p>
            <h3 ref={panelHeadingRef} tabIndex={-1} className="text-display-md focus:outline-none">
              {s(active, "title")}
            </h3>
            <p>
              <strong>{s(active, "lead")}</strong>
            </p>
            <p>{s(active, "why")}</p>

            <figure className="rounded-md border-l-4 border-primary bg-muted/70 p-4">
              <figcaption className="mb-2 text-sm font-bold">{t("wordsYouCanUse")}</figcaption>
              <blockquote className="text-base">{s(active, "sample")}</blockquote>
            </figure>

            <ul className="flex flex-col gap-2 text-base">
              {STEPS[active].cites.map((ids, r) => (
                <li key={r}>
                  <strong>{s(active, `rule${r + 1}Label`)}.</strong> {s(active, `rule${r + 1}`)}
                  {ids.length > 0 && <Cite ids={[...ids]} />}
                </li>
              ))}
            </ul>

            <fieldset className="flex flex-col gap-3 border-t-2 border-border/10 pt-5">
              <legend className="pt-5 font-display text-lg font-bold">{t("settledQuestion")}</legend>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => go({ kind: "resolved", index: active }, t("announceSettled"))}
                >
                  <Check aria-hidden="true" />
                  {t("yesSettled")}
                </Button>
                {active < total - 1 ? (
                  <Button onClick={() => go({ kind: "step", index: active + 1 }, stepAnnouncement(active + 1))}>
                    {t("noNext", { number: active + 2 })}
                    <ArrowRight aria-hidden="true" />
                  </Button>
                ) : (
                  <Button onClick={() => go({ kind: "agency" }, t("announceAgency"))}>
                    {t("noWhereElse")}
                    <ArrowRight aria-hidden="true" />
                  </Button>
                )}
                {active > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => go({ kind: "step", index: active - 1 }, stepAnnouncement(active - 1))}
                  >
                    <ArrowLeft aria-hidden="true" />
                    {t("backTo", { number: active })}
                  </Button>
                )}
              </div>
            </fieldset>
          </div>
        )}

        {view.kind === "resolved" && (
          <div className="flex flex-col gap-4">
            <h3 ref={panelHeadingRef} tabIndex={-1} className="text-display-md focus:outline-none">
              {t("resolvedTitle")}
            </h3>
            <p>{t.rich("resolvedBody", { b: (c) => <strong>{c}</strong> })}</p>
            <Button variant="outline" className="self-start" onClick={restart}>
              <RotateCcw aria-hidden="true" />
              {tc("startOver")}
            </Button>
          </div>
        )}

        {view.kind === "agency" && (
          <div className="flex flex-col gap-4">
            <h3 ref={panelHeadingRef} tabIndex={-1} className="text-display-md focus:outline-none">
              {t("agencyTitle")}
            </h3>
            <p>{t.rich("agencyBody", { b: (c) => <strong>{c}</strong> })}</p>
            <ul className="flex flex-col gap-3 text-base">
              <li>
                <strong>{t("agencyUS")}</strong> <SourceLink source={getSource("ftc-reportfraud")} />.{" "}
                {t("agencyUSCredit")} <SourceLink source={getSource("cfpb-complaint")} />.
              </li>
              <li>
                <strong>{t("agencyEU")}</strong> {t("agencyEUText")}
              </li>
              <li>
                <strong>{t("agencyElsewhere")}</strong> {t("agencyElsewhereText")}
              </li>
            </ul>
            <Button variant="outline" className="self-start" onClick={restart}>
              <RotateCcw aria-hidden="true" />
              {tc("startOver")}
            </Button>
          </div>
        )}
      </div>

      <p aria-live="polite" role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Cite } from "@/components/ui/Cite";
import { SourceLink } from "@/components/ui/SourceList";
import { getSource } from "@/lib/sources";
import { cn } from "@/lib/utils";

type Step = {
  id: string;
  short: string;
  title: string;
  lead: string;
  why: string;
  sample: string;
  rules: { label: string; text: string; cite?: string[] }[];
};

// Each step asks a little more of both sides, and each starts from good faith.
export const STEPS: Step[] = [
  {
    id: "ask",
    short: "Ask in writing",
    title: "Ask in writing",
    lead: "Send a short, polite note. Ask whether software helped make the decision, what information it used, and the main reasons.",
    why: "A written question gives you and the company the same clear record. It also gives their team a chance to spot a mistake early.",
    sample:
      "Hello. I received a decision about [my application] on [date]. Could you tell me whether an automated system helped make it, what information about me it used, and the main reasons? Thank you for your help.",
    rules: [
      { label: "Law (US, credit)", text: "A lender that turns you down must give the specific main reasons, or tell you how to ask for them. (Regulation B)", cite: ["cfpb-reg-b"] },
      { label: "Law (EU)", text: "You can ask for your data and for meaningful information about how an automated decision was made. (GDPR, Article 15)", cite: ["gdpr"] },
    ],
  },
  {
    id: "review",
    short: "Ask for a person",
    title: "Request human review",
    lead: "Ask for a person to look at your case. Add any facts the system may not have had.",
    why: "A person can weigh details that software may miss, such as a recent change in your situation or an error in your records.",
    sample:
      "Thank you for your reply. I would like a person to review this decision. Here is information that may help: [details]. Please let me know what else you need from me.",
    rules: [
      { label: "Law (EU)", text: "When a machine alone makes a decision with a legal or similarly serious effect on you, you can ask for a person to step in. (GDPR, Article 22)", cite: ["gdpr"] },
      { label: "Guidance (US)", text: "The 2022 Blueprint for an AI Bill of Rights recommends a way to reach a person. It is not law, and it has been archived.", cite: ["ostp-blueprint-2022"] },
    ],
  },
  {
    id: "dialogue",
    short: "Talk it through",
    title: "Keep the conversation constructive",
    lead: "If you still disagree, say what you think went wrong and what would fix it. Keep it specific and calm.",
    why: "Clear, specific feedback is easier to act on. It can help fix the process for the next person too.",
    sample:
      "Thank you for looking at this again. I still think [the specific issue]. A fair fix would be [what you are asking for]. Can we find a way forward together?",
    rules: [
      { label: "Law (US)", text: "Existing consumer-protection law applies to AI. The FTC has said there is no AI exemption. (FTC, 2024)", cite: ["ftc-ai-comply-2024"] },
      { label: "Everywhere", text: "Almost every country bans misleading business practices. Your consumer agency can tell you what applies to you." },
    ],
  },
];

type View = { kind: "step"; index: number } | { kind: "resolved"; index: number } | { kind: "agency" };

export function AlgorithmExplorer() {
  const baseId = React.useId();
  const [view, setView] = React.useState<View>({ kind: "step", index: 0 });
  const [announcement, setAnnouncement] = React.useState("");
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const panelHeadingRef = React.useRef<HTMLHeadingElement>(null);
  const moveFocusToPanel = React.useRef(false);

  const active = view.kind === "agency" ? STEPS.length - 1 : view.index;
  const tabId = (i: number) => `${baseId}-tab-${i}`;
  const panelId = `${baseId}-panel`;

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
    go({ kind: "step", index: i }, `Step ${i + 1} of ${STEPS.length}: ${STEPS[i].title}`, false);
    if (focusTab) tabRefs.current[i]?.focus();
  }

  // WAI-ARIA tabs pattern: arrow keys move between steps, Home and End jump.
  function onTabKeyDown(e: React.KeyboardEvent, i: number) {
    const last = STEPS.length - 1;
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

  const step = STEPS[active];

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label="Three steps when a decision seems wrong"
        className="grid grid-cols-3 gap-3 [perspective:900px]"
      >
        {STEPS.map((s, i) => {
          const selected = i === active;
          return (
            <button
              key={s.id}
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
                <span className="sr-only">Step {i + 1}: </span>
                {s.short}
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
              Step {active + 1} of {STEPS.length}
            </p>
            <h3 ref={panelHeadingRef} tabIndex={-1} className="text-display-md focus:outline-none">
              {step.title}
            </h3>
            <p>
              <strong>{step.lead}</strong>
            </p>
            <p>{step.why}</p>

            <figure className="rounded-md border-l-4 border-primary bg-muted/70 p-4">
              <figcaption className="mb-2 text-sm font-bold">Words you can use</figcaption>
              <blockquote className="text-base">{step.sample}</blockquote>
            </figure>

            <ul className="flex flex-col gap-2 text-base">
              {step.rules.map((r) => (
                <li key={r.label + r.text}>
                  <strong>{r.label}.</strong> {r.text}
                  {r.cite && <Cite ids={r.cite} />}
                </li>
              ))}
            </ul>

            <fieldset className="flex flex-col gap-3 border-t-2 border-border/10 pt-5">
              <legend className="pt-5 font-display text-lg font-bold">Did this step settle it?</legend>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => go({ kind: "resolved", index: active }, "Settled. Keep a copy of your messages.")}
                >
                  <Check aria-hidden="true" />
                  Yes, it is settled
                </Button>
                {active < STEPS.length - 1 ? (
                  <Button
                    onClick={() =>
                      go(
                        { kind: "step", index: active + 1 },
                        `Step ${active + 2} of ${STEPS.length}: ${STEPS[active + 1].title}`
                      )
                    }
                  >
                    No, go to step {active + 2}
                    <ArrowRight aria-hidden="true" />
                  </Button>
                ) : (
                  <Button onClick={() => go({ kind: "agency" }, "Where to get more help")}>
                    No, where else can I turn?
                    <ArrowRight aria-hidden="true" />
                  </Button>
                )}
                {active > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      go(
                        { kind: "step", index: active - 1 },
                        `Step ${active} of ${STEPS.length}: ${STEPS[active - 1].title}`
                      )
                    }
                  >
                    <ArrowLeft aria-hidden="true" />
                    Back to step {active}
                  </Button>
                )}
              </div>
            </fieldset>
          </div>
        )}

        {view.kind === "resolved" && (
          <div className="flex flex-col gap-4">
            <h3 ref={panelHeadingRef} tabIndex={-1} className="text-display-md focus:outline-none">
              Good. Keep a record.
            </h3>
            <p>
              <strong>Save a copy of your messages and the reply.</strong> If the same issue comes
              up again, you can point to what was agreed.
            </p>
            <Button variant="outline" className="self-start" onClick={() => go({ kind: "step", index: 0 }, "Step 1 of 3: Ask in writing")}>
              <RotateCcw aria-hidden="true" />
              Start over
            </Button>
          </div>
        )}

        {view.kind === "agency" && (
          <div className="flex flex-col gap-4">
            <h3 ref={panelHeadingRef} tabIndex={-1} className="text-display-md focus:outline-none">
              Ask a consumer agency for help
            </h3>
            <p>
              <strong>Consumer agencies exist for this moment.</strong> Share your messages and
              the replies. They can tell you which rules apply where you live.
            </p>
            <ul className="flex flex-col gap-3 text-base">
              <li>
                <strong>United States:</strong> <SourceLink source={getSource("ftc-reportfraud")} />.
                For credit, loans, and banking: <SourceLink source={getSource("cfpb-complaint")} />.
              </li>
              <li>
                <strong>European Union:</strong> your national consumer authority or
                data-protection authority.
              </li>
              <li>
                <strong>Elsewhere:</strong> your national consumer agency.
              </li>
            </ul>
            <Button variant="outline" className="self-start" onClick={() => go({ kind: "step", index: 0 }, "Step 1 of 3: Ask in writing")}>
              <RotateCcw aria-hidden="true" />
              Start over
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

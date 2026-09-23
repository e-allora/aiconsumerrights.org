"use client";

import * as React from "react";
import { ArrowRight, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATEMENTS, trackOf, type Statement } from "@/lib/forum/statements";
import { cn } from "@/lib/utils";

export type Vote = "agree" | "disagree" | "pass";
export type Votes = Record<string, Vote>;

const CHOICES: { vote: Vote; label: string; tip: string; icon: React.ElementType; variant: "default" | "secondary" | "outline" }[] = [
  { vote: "agree", label: "Agree", tip: "You support this statement.", icon: ThumbsUp, variant: "default" },
  { vote: "disagree", label: "Disagree", tip: "You do not support this statement.", icon: ThumbsDown, variant: "secondary" },
  { vote: "pass", label: "Pass", tip: "Skip it. You are unsure, or it does not apply to you.", icon: ArrowRight, variant: "outline" },
];

const STORAGE_KEY = "forum-votes-v1";

function loadVotes(): Votes {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Votes) : {};
  } catch {
    return {};
  }
}

function saveVotes(votes: Votes) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
  } catch {
    // Private windows can block storage. Votes still work for this visit.
  }
}

/** Tallies are derived from one vote per statement, so a count can never double. */
export function tally(votes: Votes): Record<Vote, number> {
  const counts = { agree: 0, disagree: 0, pass: 0 };
  for (const v of Object.values(votes)) counts[v] += 1;
  return counts;
}

const firstOpen = (votes: Votes, from = 0, list = STATEMENTS) => {
  for (let i = 0; i < list.length; i++) {
    const idx = (from + i) % list.length;
    if (!votes[list[idx].id]) return idx;
  }
  return -1;
};

/**
 * Pol.is-style voting: one isolated statement at a time, no replies, no
 * threads. Agree, Disagree, or Pass, once per statement.
 */
export function VotingEngine({
  statements = STATEMENTS,
  onVote,
}: {
  statements?: Statement[];
  onVote?: (id: string, vote: Vote) => void;
}) {
  const [votes, setVotes] = React.useState<Votes>({});
  // Mirrors `votes` synchronously, so two clicks in the same tick can't
  // both pass the one-vote check before React re-renders.
  const votesRef = React.useRef<Votes>({});
  const [current, setCurrent] = React.useState(0);
  const [announcement, setAnnouncement] = React.useState("");
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const buttonRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const focusHeading = React.useRef(false);
  const tipBase = React.useId();

  // Restore earlier votes after mount so server and client HTML match.
  React.useEffect(() => {
    const saved = loadVotes();
    if (Object.keys(saved).length) {
      votesRef.current = saved;
      setVotes(saved);
      setCurrent(Math.max(firstOpen(saved, 0, statements), 0));
    }
  }, [statements]);

  React.useEffect(() => {
    if (focusHeading.current) {
      focusHeading.current = false;
      headingRef.current?.focus();
    }
  }, [current, votes]);

  const done = statements.every((s) => votes[s.id]);
  const statement = statements[current];
  const counts = tally(votes);
  const answered = statements.filter((s) => votes[s.id]).length;

  function cast(vote: Vote) {
    if (!statement || votesRef.current[statement.id]) return; // one vote per statement
    const next = { ...votesRef.current, [statement.id]: vote };
    votesRef.current = next;
    const nextIdx = firstOpen(next, current + 1, statements);
    saveVotes(next);
    setVotes(next);
    onVote?.(statement.id, vote);
    focusHeading.current = true;
    if (nextIdx >= 0) setCurrent(nextIdx);
    const label = CHOICES.find((c) => c.vote === vote)!.label;
    setAnnouncement(
      nextIdx >= 0
        ? `Recorded: ${label}. Statement ${nextIdx + 1} of ${statements.length}.`
        : `Recorded: ${label}. You have answered all ${statements.length} statements.`
    );
  }

  function reset() {
    saveVotes({});
    votesRef.current = {};
    setVotes({});
    setCurrent(0);
    focusHeading.current = true;
    setAnnouncement(`Votes cleared. Statement 1 of ${statements.length}.`);
  }

  // Toolbar pattern: arrow keys move between the three vote buttons.
  function onToolbarKeyDown(e: React.KeyboardEvent) {
    const i = buttonRefs.current.findIndex((b) => b === document.activeElement);
    if (i < 0) return;
    const last = CHOICES.length - 1;
    const target =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? (i === last ? 0 : i + 1)
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i === 0 ? last : i - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (target === null) return;
    e.preventDefault();
    buttonRefs.current[target]?.focus();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 text-base">
        <p>
          <strong>
            {answered} of {statements.length} answered
          </strong>
        </p>
        <p data-testid="tally" className="text-muted-foreground">
          Your votes: {counts.agree} agree, {counts.disagree} disagree, {counts.pass} pass
        </p>
      </div>
      <div
        role="progressbar"
        aria-label="Statements answered"
        aria-valuemin={0}
        aria-valuemax={statements.length}
        aria-valuenow={answered}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full bg-primary transition-[width] duration-base ease-out-soft"
          style={{ width: `${(answered / statements.length) * 100}%` }}
        />
      </div>

      {!done && statement ? (
        <Card
          key={statement.id}
          as="section"
          className="animate-in fade-in slide-in-from-right-4 duration-base"
        >
          <CardHeader>
            <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              {trackOf(statement).name} · Statement {current + 1} of {statements.length}
            </p>
            <CardTitle ref={headingRef} tabIndex={-1} className="text-display-md focus:outline-none">
              {statement.text}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              role="toolbar"
              aria-label="Your vote"
              onKeyDown={onToolbarKeyDown}
              className="flex flex-wrap gap-3"
            >
              {CHOICES.map((c, i) => {
                const Icon = c.icon;
                const tipId = `${tipBase}-${c.vote}`;
                return (
                  <span key={c.vote} className="group relative">
                    <Button
                      ref={(el) => {
                        buttonRefs.current[i] = el;
                      }}
                      variant={c.variant}
                      size="lg"
                      tabIndex={i === 0 ? 0 : -1}
                      aria-describedby={tipId}
                      onClick={() => cast(c.vote)}
                      className="min-w-32"
                    >
                      <Icon aria-hidden="true" />
                      {c.label}
                    </Button>
                    <span
                      id={tipId}
                      role="tooltip"
                      className={cn(
                        "pointer-events-none absolute left-0 top-full z-10 mt-2 w-56 rounded-md bg-foreground px-3 py-2 text-sm text-background shadow-depth-2",
                        "invisible opacity-0 transition-opacity duration-fast group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
                      )}
                    >
                      {c.tip}
                    </span>
                  </span>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card as="section" className="animate-in fade-in duration-base">
          <CardHeader>
            <CardTitle ref={headingRef} tabIndex={-1} className="text-display-md focus:outline-none">
              Thank you. You answered every statement.
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-base">
            <ul className="flex flex-col gap-2">
              {statements.map((s) => (
                <li key={s.id}>
                  <strong>{CHOICES.find((c) => c.vote === votes[s.id])?.label}:</strong> {s.text}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="self-start" onClick={reset}>
              <RotateCcw aria-hidden="true" />
              Clear my votes and start over
            </Button>
          </CardContent>
        </Card>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

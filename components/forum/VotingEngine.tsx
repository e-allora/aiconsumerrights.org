"use client";

import * as React from "react";
import { ArrowRight, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clearVotes, loadSuggestions, sendVote } from "@/lib/forum/client";
import { STATEMENTS, type Statement } from "@/lib/forum/statements";
import { cn } from "@/lib/utils";

export type Vote = "agree" | "disagree" | "pass";
export type Votes = Record<string, Vote>;

// Labels and tips live in messages/*.json under Forum.voting.<vote> and <vote>Tip.
const CHOICES: { vote: Vote; icon: React.ElementType; variant: "default" | "secondary" | "outline" }[] = [
  { vote: "agree", icon: ThumbsUp, variant: "default" },
  { vote: "disagree", icon: ThumbsDown, variant: "secondary" },
  { vote: "pass", icon: ArrowRight, variant: "outline" },
];

// v1 held votes from the preview, when the page promised nothing was sent.
// They are left behind, never sent; everyone votes fresh.
const STORAGE_KEY = "forum-votes-v2";
// Statement ids whose vote has not reached the server yet.
const UNSENT_KEY = "forum-unsent-v2";

function load<T>(key: string, empty: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : empty;
  } catch {
    return empty;
  }
}

function save(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
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
 * threads. Agree, Disagree, or Pass, once per statement. The seed
 * statements come first, then any approved suggestions in this language.
 */
export function VotingEngine({
  statements: seeds = STATEMENTS,
  onVote,
}: {
  statements?: Statement[];
  onVote?: (id: string, vote: Vote) => void;
}) {
  const t = useTranslations("Forum.voting");
  const tf = useTranslations("Forum");
  const locale = useLocale();
  const [suggested, setSuggested] = React.useState<Statement[]>([]);
  const statements = React.useMemo(() => [...seeds, ...suggested], [seeds, suggested]);
  const textOf = (s: Statement) => s.text ?? tf(`statements.${s.id}`);
  const [votes, setVotes] = React.useState<Votes>({});
  // Mirrors `votes` synchronously, so two clicks in the same tick can't
  // both pass the one-vote check before React re-renders.
  const votesRef = React.useRef<Votes>({});
  const [current, setCurrent] = React.useState(0);
  const [announcement, setAnnouncement] = React.useState("");
  const [unsent, setUnsent] = React.useState<string[]>([]);
  const unsentRef = React.useRef<string[]>([]);
  const [clearFailed, setClearFailed] = React.useState(false);
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const buttonRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const focusHeading = React.useRef(false);
  const tipBase = React.useId();

  function markUnsent(ids: string[]) {
    unsentRef.current = ids;
    save(UNSENT_KEY, ids);
  }

  // Sends every vote that hasn't reached the server. A vote that fails stays
  // on the list and is tried again on the next vote or visit. The notice
  // updates only after trying, so it never flashes during a normal send.
  const flush = React.useCallback(async () => {
    for (const id of unsentRef.current) {
      const vote = votesRef.current[id];
      const ok = !vote || (await sendVote(id, vote, locale));
      if (ok) markUnsent(unsentRef.current.filter((x) => x !== id));
    }
    const left = unsentRef.current;
    setUnsent((prev) => (prev.join() === left.join() ? prev : left));
  }, [locale]);

  React.useEffect(() => {
    let live = true;
    loadSuggestions(locale).then((list) => {
      if (live && list.length) setSuggested(list.map((s) => ({ id: s.id, text: s.text, track: "community" })));
    });
    return () => {
      live = false;
    };
  }, [locale]);

  // Restore earlier votes after mount so server and client HTML match. Runs
  // again when suggestions arrive, moving to the first unanswered card.
  React.useEffect(() => {
    const saved = load<Votes>(STORAGE_KEY, {});
    if (Object.keys(saved).length) {
      votesRef.current = saved;
      setVotes(saved);
      setCurrent(Math.max(firstOpen(saved, 0, statements), 0));
    }
    unsentRef.current = load<string[]>(UNSENT_KEY, []);
    void flush();
  }, [statements, flush]);

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
    save(STORAGE_KEY, next);
    setVotes(next);
    markUnsent([...unsentRef.current, statement.id]);
    void flush();
    onVote?.(statement.id, vote);
    focusHeading.current = true;
    if (nextIdx >= 0) setCurrent(nextIdx);
    const choice = t(vote);
    setAnnouncement(
      nextIdx >= 0
        ? t("recorded", { choice, next: nextIdx + 1, total: statements.length })
        : t("recordedAll", { choice, total: statements.length })
    );
  }

  // Clears the votes on the server first. If that fails, nothing is cleared
  // here either, so the page never says votes are gone when they are not.
  async function reset() {
    if (!(await clearVotes())) {
      setClearFailed(true);
      setAnnouncement(t("clearFailed"));
      return;
    }
    setClearFailed(false);
    save(STORAGE_KEY, {});
    markUnsent([]);
    setUnsent([]);
    votesRef.current = {};
    setVotes({});
    setCurrent(0);
    focusHeading.current = true;
    setAnnouncement(t("cleared", { total: statements.length }));
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
          <strong>{t("answered", { answered, total: statements.length })}</strong>
        </p>
        <p data-testid="tally" className="text-muted-foreground">
          {t("tally", counts)}
        </p>
      </div>
      <div
        role="progressbar"
        aria-label={t("progressLabel")}
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
              {t("cardMeta", {
                track: tf(`tracks.${statement.track}`),
                current: current + 1,
                total: statements.length,
              })}
            </p>
            <CardTitle ref={headingRef} tabIndex={-1} className="text-display-md focus:outline-none">
              {textOf(statement)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              role="toolbar"
              aria-label={t("toolbarLabel")}
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
                      {t(c.vote)}
                    </Button>
                    <span
                      id={tipId}
                      role="tooltip"
                      className={cn(
                        "pointer-events-none absolute left-0 top-full z-10 mt-2 w-56 rounded-md bg-foreground px-3 py-2 text-sm text-background shadow-depth-2",
                        "invisible opacity-0 transition-opacity duration-fast group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
                      )}
                    >
                      {t(`${c.vote}Tip`)}
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
              {t("doneTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-base">
            <ul className="flex flex-col gap-2">
              {statements.map((s) => (
                <li key={s.id}>
                  <strong>{votes[s.id] ? t(votes[s.id]) : ""}:</strong> {textOf(s)}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="self-start" onClick={reset}>
              <RotateCcw aria-hidden="true" />
              {t("clear")}
            </Button>
            {clearFailed && <p className="font-bold">{t("clearFailed")}</p>}
          </CardContent>
        </Card>
      )}

      {unsent.length > 0 && (
        <p data-testid="unsent" className="text-base text-muted-foreground">
          {t("unsent", { count: unsent.length })}
        </p>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

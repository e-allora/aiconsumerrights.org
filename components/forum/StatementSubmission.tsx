"use client";

import * as React from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MAX_STATEMENT_LENGTH } from "@/lib/forum/statements";
import { cn } from "@/lib/utils";

export const PLACEHOLDER =
  "e.g., 'Customer service portals should always let you request a human representative with one tap.'";

/**
 * One short statement, no account needed. `onSubmit` sends it for review;
 * without one (no server yet) the box says plainly that nothing was sent.
 */
export function StatementSubmission({ onSubmit }: { onSubmit?: (text: string) => Promise<void> | void }) {
  const [text, setText] = React.useState("");
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState<"" | "sent" | "kept">("");
  const ids = { input: React.useId(), count: React.useId(), note: React.useId(), error: React.useId() };

  const remaining = MAX_STATEMENT_LENGTH - text.length;
  const nearLimit = remaining <= 20;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = text.trim();
    if (!clean) {
      setError("Please write a statement first.");
      return;
    }
    setError("");
    if (onSubmit) {
      await onSubmit(clean);
      setResult("sent");
    } else {
      setResult("kept");
    }
    setText("");
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <label htmlFor={ids.input} className="font-display text-lg font-bold">
        Suggest a statement for others to vote on
      </label>
      <p id={ids.note} className="text-base text-muted-foreground">
        <strong className="text-foreground">A person reads every statement before it is shown.</strong>{" "}
        Statements that single out a person, company, or group are not published. Your input is
        reviewed for civil discourse standards. We critique ideas, not people.
      </p>
      <textarea
        id={ids.input}
        name="statement"
        rows={3}
        maxLength={MAX_STATEMENT_LENGTH}
        value={text}
        placeholder={PLACEHOLDER}
        aria-describedby={`${ids.note} ${ids.count}${error ? ` ${ids.error}` : ""}`}
        aria-invalid={error ? true : undefined}
        onChange={(e) => {
          setText(e.target.value.slice(0, MAX_STATEMENT_LENGTH));
          setResult("");
          if (error) setError("");
        }}
        className="tap-target w-full resize-y rounded-md border-2 border-border/30 bg-card p-3 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          id={ids.count}
          aria-live={nearLimit ? "polite" : "off"}
          className={cn("text-sm", nearLimit ? "font-bold text-foreground" : "text-muted-foreground")}
        >
          {remaining} of {MAX_STATEMENT_LENGTH} characters left
        </p>
        <Button type="submit">
          <Send aria-hidden="true" />
          Submit for review
        </Button>
      </div>
      {error && (
        <p id={ids.error} role="alert" className="text-base font-bold">
          {error}
        </p>
      )}
      <p role="status" className="text-base">
        {result === "sent" && "Thank you. Your statement is waiting for review."}
        {result === "kept" &&
          "Thank you. This forum is still in preview, so your statement was not sent anywhere yet."}
      </p>
    </form>
  );
}

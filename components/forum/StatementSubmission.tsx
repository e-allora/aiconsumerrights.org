"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { submitStatement, type SubmitResult } from "@/lib/forum/client";
import { MAX_STATEMENT_LENGTH } from "@/lib/forum/statements";
import { cn } from "@/lib/utils";

/**
 * One short statement, no account needed. It goes to the review queue; a
 * person approves it before anyone sees it. If sending fails, the text
 * stays in the box so nothing typed is lost.
 */
export function StatementSubmission({ onSubmit }: { onSubmit?: (text: string) => Promise<SubmitResult> }) {
  const t = useTranslations("Forum.submission");
  const locale = useLocale();
  const [text, setText] = React.useState("");
  const [error, setError] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const ids = { input: React.useId(), count: React.useId(), note: React.useId(), error: React.useId() };

  const remaining = MAX_STATEMENT_LENGTH - text.length;
  const nearLimit = remaining <= 20;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = text.trim();
    if (!clean) {
      setError(t("empty"));
      return;
    }
    if (busy) return;
    setError("");
    setBusy(true);
    const result = await (onSubmit ?? ((s: string) => submitStatement(s, locale)))(clean);
    setBusy(false);
    if (result === "sent") {
      setSent(true);
      setText("");
    } else {
      setError(t(result));
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <label htmlFor={ids.input} className="font-display text-lg font-bold">
        {t("label")}
      </label>
      <p id={ids.note} className="text-base text-muted-foreground">
        {t.rich("disclosure", { b: (c) => <strong className="text-foreground">{c}</strong> })}
      </p>
      <textarea
        id={ids.input}
        name="statement"
        rows={3}
        maxLength={MAX_STATEMENT_LENGTH}
        value={text}
        placeholder={t("placeholder")}
        aria-describedby={`${ids.note} ${ids.count}${error ? ` ${ids.error}` : ""}`}
        aria-invalid={error ? true : undefined}
        onChange={(e) => {
          setText(e.target.value.slice(0, MAX_STATEMENT_LENGTH));
          setSent(false);
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
          {t("remaining", { remaining, max: MAX_STATEMENT_LENGTH })}
        </p>
        <Button type="submit" disabled={busy}>
          <Send aria-hidden="true" />
          {t("submit")}
        </Button>
      </div>
      {error && (
        <p id={ids.error} role="alert" className="text-base font-bold">
          {error}
        </p>
      )}
      <p role="status" className="text-base">
        {sent && t("sent")}
      </p>
    </form>
  );
}

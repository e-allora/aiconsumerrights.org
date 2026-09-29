"use client";

import * as React from "react";
import { Copy, Mail, Printer } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { formatDate, localToday } from "@/lib/dates";
import type { LetterKind } from "@/lib/help";

const FIELDS = [
  { key: "name", type: "text", autoComplete: "name" },
  { key: "company", type: "text", autoComplete: "off" },
  { key: "decisionDate", type: "date", autoComplete: "off" },
  { key: "reference", type: "text", autoComplete: "off" },
] as const;
type Field = (typeof FIELDS)[number]["key"];

const inputClass =
  "tap-target w-full rounded-md border-2 border-border/30 bg-card p-3 text-base focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/**
 * A letter the visitor fills in and then copies, prints, or opens in their
 * own email app. Everything happens in the browser: nothing typed here is
 * sent to the site or saved.
 */
export function LetterBuilder({ situation, kind }: { situation: string; kind: LetterKind }) {
  const t = useTranslations("Help.letter");
  const tl = useTranslations(`Help.${situation}.letters.${kind}`);
  const locale = useLocale();
  const baseId = React.useId();
  const [fields, setFields] = React.useState<Record<Field, string>>({
    name: "",
    company: "",
    decisionDate: "",
    reference: "",
  });
  // Today's date is filled in on the visitor's device, not when the page was built.
  const [today, setToday] = React.useState("");
  const [status, setStatus] = React.useState("");
  React.useEffect(() => setToday(formatDate(localToday(), locale)), [locale]);

  const value = (k: Field) => fields[k].trim() || t(`blank.${k}`);
  const decisionDate = fields.decisionDate ? formatDate(fields.decisionDate, locale) : t("blank.decisionDate");
  const values = {
    name: value("name"),
    company: value("company"),
    decisionDate,
    reference: fields.reference.trim(),
    hasReference: fields.reference.trim() ? "yes" : "no",
  };
  const subject = tl("subject", values);
  const body = tl("body", values);
  const letter = [today || t("blank.today"), t("to", values), t("subjectLine", { subject }), "", body].join("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(letter);
      setStatus(t("copied"));
    } catch {
      setStatus(t("copyFailed"));
    }
  }

  // Prints only the letter: the class hides the rest of the page (see globals.css).
  function print() {
    const root = document.documentElement;
    root.classList.add("printing-letter");
    const done = () => root.classList.remove("printing-letter");
    window.addEventListener("afterprint", done, { once: true });
    window.print();
  }

  const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-display text-lg font-bold">{t("fieldsHeading")}</legend>
        {FIELDS.map(({ key, type, autoComplete }) => (
          <div key={key} className="flex flex-col gap-2">
            <label htmlFor={`${baseId}-${key}`} className="text-base font-semibold">
              {t(`fields.${key}`)}
            </label>
            <input
              id={`${baseId}-${key}`}
              name={key}
              type={type}
              autoComplete={autoComplete}
              value={fields[key]}
              onChange={(e) => {
                setFields((f) => ({ ...f, [key]: e.target.value }));
                setStatus("");
              }}
              className={inputClass}
            />
          </div>
        ))}
      </fieldset>

      <p className="text-base text-muted-foreground">{t("privacy")}</p>

      <section aria-labelledby={`${baseId}-letter`} className="flex flex-col gap-3">
        <h4 id={`${baseId}-letter`} className="font-display text-lg font-bold">
          {t("previewHeading")}
        </h4>
        <div className="letter-print whitespace-pre-wrap rounded-md border-2 border-border/30 bg-card p-5 text-base leading-relaxed">
          {letter}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button onClick={copy}>
          <Copy aria-hidden="true" />
          {t("copy")}
        </Button>
        <Button variant="outline" onClick={print}>
          <Printer aria-hidden="true" />
          {t("print")}
        </Button>
        <Button variant="outline" asChild>
          <a href={mailto}>
            <Mail aria-hidden="true" />
            {t("email")}
          </a>
        </Button>
      </div>
      <p role="status" className="text-base font-semibold">
        {status}
      </p>
    </div>
  );
}

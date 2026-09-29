import { useTranslations } from "next-intl";

import type { Source } from "@/lib/sources";

const inlineLink = "font-semibold text-link underline underline-offset-4";

/** An external link inside a sentence, in the visitor's words, to a registry source. */
export function HelpLink({ source, children }: { source: Source; children: React.ReactNode }) {
  const tc = useTranslations("Common");
  return (
    <a href={source.url} target="_blank" rel="noopener noreferrer" hrefLang={source.lang ?? "en"} className={inlineLink}>
      {children}
      <span className="sr-only"> {tc("opensInNewTab")}</span>
    </a>
  );
}

/** A phone link inside a sentence. */
export function PhoneLink({ phone, children }: { phone: string; children: React.ReactNode }) {
  return (
    <a href={`tel:${phone}`} className={inlineLink}>
      {children}
    </a>
  );
}

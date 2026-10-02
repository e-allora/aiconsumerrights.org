// Test helpers: RTL's render, wrapped in the translation provider.
// A missing or broken message key throws, so no test can pass on a fallback.
import { render as rtlRender, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import en from "@/messages/en.json";
import es from "@/messages/es.json";
import ptPT from "@/messages/pt-PT.json";
import ptBR from "@/messages/pt-BR.json";
import it from "@/messages/it.json";
import fr from "@/messages/fr.json";
import de from "@/messages/de.json";
import hi from "@/messages/hi.json";

export const MESSAGES = { en, es, "pt-PT": ptPT, "pt-BR": ptBR, it, fr, de, hi } as const;
export type TestLocale = keyof typeof MESSAGES;

export function IntlWrapper({ locale = "en", children }: { locale?: TestLocale; children: React.ReactNode }) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={MESSAGES[locale]}
      timeZone="UTC"
      onError={(error) => {
        throw error;
      }}
    >
      {children}
    </NextIntlClientProvider>
  );
}

export function render(ui: React.ReactElement, { locale = "en", ...options }: RenderOptions & { locale?: TestLocale } = {}) {
  (globalThis as unknown as { __requestLocale?: string }).__requestLocale = locale;
  return rtlRender(ui, {
    wrapper: ({ children }) => <IntlWrapper locale={locale}>{children}</IntlWrapper>,
    ...options,
  });
}

export * from "@testing-library/react";
export { render as default };

/**
 * Page params as Next.js passes them: a promise. React's use() reads this one
 * without suspending, because it is already marked as fulfilled, so a page
 * renders in one pass in a test just as it does once Next has resolved it.
 */
export function ready<T>(value: T): Promise<T> {
  return Object.assign(Promise.resolve(value), { status: "fulfilled" as const, value });
}

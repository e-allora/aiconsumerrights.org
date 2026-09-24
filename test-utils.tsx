// Test helpers: RTL's render, wrapped in the translation provider.
// A missing or broken message key throws, so no test can pass on a fallback.
import { render as rtlRender, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import en from "@/messages/en.json";
import es from "@/messages/es.json";
import pt from "@/messages/pt.json";

export const MESSAGES = { en, es, pt } as const;
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

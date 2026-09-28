import type { Locale } from "@/lib/i18n/routing";

// The countries the guide covers beyond the US and the EU, in picker order.
export const COUNTRIES = ["br", "fr", "de", "in", "it"] as const;
export type Country = (typeof COUNTRIES)[number];

// Each language opens on the country its speakers most likely live in.
// Languages without a country of their own get none.
const HOME_COUNTRY: Partial<Record<Locale, Country>> = { "pt-BR": "br", it: "it", fr: "fr", de: "de", hi: "in" };

export const homeCountry = (locale: string): Country | undefined => HOME_COUNTRY[locale as Locale];

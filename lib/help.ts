import type { Locale } from "@/lib/i18n/routing";

// "What happened to you?" help pages. Each situation page walks through
// what probably happened, the visitor's rights where they live, a letter
// they can fill in, and where to turn if nobody answers. Text lives in
// messages/*.json under Help.<situation>; the citations live here, so every
// language keeps the same numbered sources.

/** Where the visitor lives, as far as the help pages can tell them their rights. */
export const REGIONS = ["us", "uk", "eu", "br", "in", "other"] as const;
export type Region = (typeof REGIONS)[number];

// Each language opens on the region its speakers most likely live in.
// English and Spanish are spoken in too many places to guess, so those
// visitors pick first.
const HOME_REGION: Partial<Record<Locale, Region>> = {
  "pt-PT": "eu",
  "pt-BR": "br",
  it: "eu",
  fr: "eu",
  de: "eu",
  hi: "in",
};

export const homeRegion = (locale: string): Region | undefined => HOME_REGION[locale as Locale];

export const isRegion = (value: unknown): value is Region =>
  typeof value === "string" && (REGIONS as readonly string[]).includes(value);

/**
 * The data protection authority for a visitor's own EU country, when the
 * site knows it from their language. Everyone else gets the EDPB's list of
 * every EU authority, which is always shown too.
 */
export const EU_AUTHORITY: Partial<Record<Locale, string>> = {
  es: "es-aepd-reclamacion-derechos",
  "pt-PT": "pt-cnpd-participacoes",
  it: "it-garante-reclamo",
  fr: "fr-cnil-plaintes",
  de: "de-bfdi-beschwerde",
};

/** Which letter a region uses. Regions without their own law get a plain request. */
export type LetterKind = "us" | "uk" | "eu" | "br" | "plain";

export type RegionHelp = {
  /** One citation list per right, in order: Help.<situation>.<region>.rights.<n>. */
  rights: string[][];
  letter: LetterKind;
  /** Registry sources linked in the "if they don't answer" step, as <tag>s in the message. */
  complain: Record<string, string>;
  /** A phone number for the <tel> tag, if the message has one. */
  phone?: string;
};

export type Situation = {
  id: string;
  /** Keys under Help.<id>.happened: what probably happened, in order. */
  happened: readonly string[];
  /**
   * "If this letter reaches you at work": how a company team can answer
   * well. Keys under Help.<id>.company, with citations where a tip rests on
   * a rule. It invites companies in; it never blames them.
   */
  company: readonly { key: string; cites?: string[] }[];
  regions: Record<Region, RegionHelp>;
};

export const SITUATIONS: Situation[] = [
  {
    id: "credit",
    happened: ["score", "automatic", "mistakes"],
    company: [
      { key: "answer" },
      { key: "reasons", cites: ["cfpb-reg-b"] },
      { key: "person" },
      { key: "data" },
      { key: "patterns" },
    ],
    regions: {
      us: {
        rights: [["cfpb-reg-b"], ["cfpb-reg-b"], ["fcra-1681m"], ["fcra-1681i"]],
        letter: "us",
        complain: { cfpb: "cfpb-complaint" },
      },
      // The UK left the EU: since 5 February 2026 its own Articles 22A to 22D
      // apply, and lending complaints can go to the Financial Ombudsman.
      uk: {
        rights: [["uk-ico-sar"], ["uk-duaa-s80"], ["uk-duaa-s80"], ["uk-fos-complain"]],
        letter: "uk",
        complain: { fos: "uk-fos-complain", ico: "uk-ico-complaint" },
      },
      eu: {
        rights: [["gdpr"], ["gdpr"], ["de-cjeu-c634-21"], ["gdpr"]],
        letter: "eu",
        complain: { edpb: "edpb-members" },
      },
      br: {
        rights: [["lgpd-article-20"], ["lgpd-article-20"], ["anpd-lgpd-en"], ["iba-mariotto-2024"]],
        letter: "br",
        complain: { anpd: "br-anpd-peticao-denuncia", consumidor: "br-consumidor-gov", procon: "br-sndc-procon" },
      },
      in: {
        rights: [["in-dpdp-act-2023", "in-dpdp-commencement-2025"], []],
        letter: "plain",
        complain: { nch: "in-nch" },
        phone: "1915",
      },
      other: {
        rights: [[]],
        letter: "plain",
        complain: {},
      },
    },
  },
  {
    id: "job",
    happened: ["screening", "unread", "mistakes"],
    company: [
      { key: "answer" },
      { key: "feedback" },
      { key: "person" },
      { key: "access", cites: ["ada-12112"] },
      { key: "patterns" },
    ],
    regions: {
      us: {
        rights: [["fcra-1681b"], ["ada-12112"], ["nyc-aedt"], []],
        letter: "us",
        complain: { cfpb: "cfpb-complaint", eeoc: "eeoc-charge" },
      },
      uk: {
        rights: [["uk-ico-sar"], ["uk-duaa-s80"]],
        letter: "uk",
        complain: { ico: "uk-ico-complaint" },
      },
      eu: {
        rights: [["gdpr"], ["gdpr"], ["eu-digital-omnibus-2026"], ["gdpr"]],
        letter: "eu",
        complain: { edpb: "edpb-members" },
      },
      br: {
        rights: [["lgpd-article-20"], ["lgpd-article-20"], ["anpd-lgpd-en"], ["iba-mariotto-2024"]],
        letter: "br",
        complain: { anpd: "br-anpd-peticao-denuncia" },
      },
      in: {
        rights: [["in-dpdp-act-2023", "in-dpdp-commencement-2025"], []],
        letter: "plain",
        complain: {},
      },
      other: {
        rights: [[]],
        letter: "plain",
        complain: {},
      },
    },
  },
  {
    id: "housing",
    happened: ["screening", "score", "mistakes"],
    company: [
      { key: "answer" },
      { key: "reasons", cites: ["ftc-landlords"] },
      { key: "person" },
      { key: "data" },
      { key: "patterns" },
    ],
    regions: {
      us: {
        rights: [["ftc-landlords", "fcra-1681m"], ["fcra-1681i"], ["hud-fha-overview"], []],
        letter: "us",
        complain: { cfpb: "cfpb-complaint", hud: "hud-fheo-intake" },
      },
      uk: {
        rights: [["uk-ico-sar"], ["uk-duaa-s80"]],
        letter: "uk",
        complain: { ico: "uk-ico-complaint" },
      },
      eu: {
        rights: [["gdpr"], ["gdpr"], ["gdpr"], ["gdpr"]],
        letter: "eu",
        complain: { edpb: "edpb-members" },
      },
      br: {
        rights: [["lgpd-article-20"], ["lgpd-article-20"], ["anpd-lgpd-en"], ["iba-mariotto-2024"]],
        letter: "br",
        complain: { anpd: "br-anpd-peticao-denuncia" },
      },
      in: {
        rights: [["in-dpdp-act-2023", "in-dpdp-commencement-2025"], []],
        letter: "plain",
        complain: {},
      },
      other: {
        rights: [[]],
        letter: "plain",
        complain: {},
      },
    },
  },
  {
    id: "insurance",
    happened: ["pricing", "reports", "claims"],
    company: [
      { key: "answer" },
      { key: "reasons", cites: ["fcra-1681m"] },
      { key: "person" },
      { key: "data" },
      { key: "patterns" },
    ],
    regions: {
      us: {
        rights: [["fcra-1681a", "fcra-1681m"], ["fcra-1681i"], ["naic-complaint"]],
        letter: "us",
        complain: { naic: "naic-complaint", cfpb: "cfpb-complaint" },
      },
      uk: {
        rights: [["uk-ico-sar"], ["uk-duaa-s80"], ["uk-fos-complain"]],
        letter: "uk",
        complain: { fos: "uk-fos-complain", ico: "uk-ico-complaint" },
      },
      // Annex III 5(c) of the AI Act lists AI for pricing life and health
      // insurance as high-risk; the Digital Omnibus moved the start to 2 Dec 2027.
      eu: {
        rights: [["gdpr"], ["gdpr"], ["eu-ai-act", "eu-digital-omnibus-2026"], ["gdpr"]],
        letter: "eu",
        complain: { edpb: "edpb-members" },
      },
      br: {
        rights: [["lgpd-article-20"], ["lgpd-article-20"], ["anpd-lgpd-en"], ["iba-mariotto-2024"]],
        letter: "br",
        complain: { anpd: "br-anpd-peticao-denuncia", consumidor: "br-consumidor-gov", procon: "br-sndc-procon" },
      },
      in: {
        rights: [["in-dpdp-act-2023", "in-dpdp-commencement-2025"], ["in-bima-bharosa"]],
        letter: "plain",
        complain: { bima: "in-bima-bharosa" },
      },
      other: {
        rights: [[]],
        letter: "plain",
        complain: {},
      },
    },
  },
];

/** Situations planned but not written yet, shown as "coming next" on /help. */
export const COMING = ["chatbot", "account", "deepfake"] as const;

export const getSituation = (id: string): Situation | undefined => SITUATIONS.find((s) => s.id === id);

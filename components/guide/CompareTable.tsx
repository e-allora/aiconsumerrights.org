"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";

import { Cite } from "@/components/ui/Cite";
import { COUNTRIES, homeCountry, type Country } from "@/lib/countries";

type Row = { id: string; us: readonly string[]; eu: readonly string[] } & Record<Country, readonly string[]>;

// The countries a visitor can compare with the US and the EU, in picker order.
export const COMPARE_COUNTRIES = COUNTRIES;

// Citations sit beside the translated cells, so every language keeps the
// same numbered sources.
// Brazil's AI bill (PL 2338/2023) fills two cells. It is not law, and the
// text says so; the Chamber status is dated because it will change.
// Italy is an EU member: EU rules apply there too, and Law No. 132/2025 adds
// national rules. No company is named; enforcement is described by powers.
// France's AI Act oversight is still a bill (Senate-adopted, 18 Feb 2026);
// its rights in force are about algorithms used by public bodies.
// Germany's credit-score rights (new BDSG § 37a) start on 20 Nov 2026, so
// those cells say "From 20 November 2026"; update them once it passes.
// India has no AI law and no right to reasons or human review; its data
// rights start in May 2027, so those cells say "From May 2027".
export const COMPARISON: readonly Row[] = [
  {
    id: "told",
    us: ["ncsl-ai-database"],
    eu: ["eu-ai-act-art50"],
    br: ["pl2338-senado-2024", "pl2338-camara-status"],
    de: ["eu-ai-act-art50", "de-egbgb-246a", "de-bgbl-2026-139"],
    fr: ["eu-ai-act-art50", "fr-crpa-l311-3-1", "fr-loi-2023-451-art5"],
    in: ["in-it-amendment-rules-2026", "in-it-rules-2021-consolidated", "in-ai-governance-guidelines-2025"],
    it: ["eu-ai-act-art50", "it-law-132-2025"],
  },
  {
    id: "reasons",
    us: ["cfpb-reg-b"],
    eu: ["gdpr"],
    br: ["anpd-lgpd-en", "lawsofbrazil-2026"],
    de: ["gdpr", "de-bgbl-2026-139", "de-bt-21-5381"],
    fr: ["gdpr", "fr-crpa-l311-3-1", "fr-crpa-r311-3-1-2"],
    in: ["in-dpdp-act-2023", "in-dpdp-commencement-2025", "in-pib-dpdp-rules-2025"],
    it: ["gdpr", "it-law-132-2025"],
  },
  {
    id: "review",
    us: ["ostp-blueprint-2022"],
    eu: ["gdpr"],
    br: ["anpd-lgpd-en", "iba-mariotto-2024"],
    de: ["gdpr", "de-cjeu-c634-21", "de-bgbl-2026-139"],
    fr: ["gdpr", "fr-loi-78-17-art47", "fr-cnil-intervention-humaine"],
    in: ["in-dpdp-act-2023", "in-dpdp-commencement-2025"],
    it: ["gdpr", "it-law-132-2025"],
  },
  {
    id: "enforce",
    us: ["ftc-ai-comply-2024", "cfpb-reg-b"],
    eu: ["eu-ai-act"],
    br: ["anpd-lgpd-en", "lgpd-article-20"],
    de: ["de-ki-mig", "de-bnetza-ki-beschwerde", "de-bdsg"],
    fr: ["fr-cnil-ria-qr", "fr-conso-l511-7"],
    in: ["in-dpdp-act-2023", "in-dpbi-appointments-2026", "in-gac-portal"],
    it: ["it-law-132-2025", "garante-en"],
  },
  {
    id: "changing",
    us: ["eo-14365-2025"],
    eu: ["eu-digital-omnibus-2026"],
    br: ["pl2338-senado-2024", "pl2338-camara-status"],
    de: ["de-ki-mig", "de-bgbl-2026-223", "de-bgbl-2026-139"],
    fr: ["fr-ddadue-senate-text", "fr-senat-dossier-pjl25-118", "fr-an-dossier-2518"],
    in: ["in-dpdp-commencement-2025", "in-it-draft-notice-2026-04", "in-ai-governance-guidelines-2025"],
    it: ["it-law-132-normattiva", "it-law-132-2025"],
  },
];

/**
 * The guide's comparison table. The US and the EU are always shown; the
 * visitor picks one more country, so the table never grows past four
 * columns. Phones get the same content as one card per question.
 */
export function CompareTable({ checked }: { checked: { from: string; to: string } }) {
  const t = useTranslations("Guide.compare");
  // Languages without a country of their own open on the first one.
  const [country, setCountry] = useState<Country>(homeCountry(useLocale()) ?? COMPARE_COUNTRIES[0]);
  const pickerId = useId();
  const name = (c: Country) => t(`countries.${c}.name`);

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 font-display text-lg font-bold">{t("pickLabel")}</legend>
        <div className="flex flex-wrap gap-2">
          {COMPARE_COUNTRIES.map((c) => (
            <label
              key={c}
              className="tap-target inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-border/20 bg-card px-4 py-2 font-semibold has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2"
            >
              <input
                type="radio"
                name={pickerId}
                value={c}
                checked={country === c}
                onChange={() => setCountry(c)}
                className="sr-only"
              />
              {name(c)}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="max-w-3xl">{t(`countries.${country}.intro`)}</p>

      <div className="depth-card hidden overflow-x-auto md:block">
        <table className="w-full min-w-[44rem] border-collapse text-left text-base">
          <caption className="sr-only">{t("caption", { country: name(country), ...checked })}</caption>
          <thead>
            <tr className="border-b-2 border-border/15">
              <th scope="col" className="p-4 font-display">{t("colQuestion")}</th>
              <th scope="col" className="p-4 font-display">{t("colUS")}</th>
              <th scope="col" className="p-4 font-display">{t("colEU")}</th>
              <th scope="col" className="p-4 font-display">{name(country)}</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row) => (
              <tr key={row.id} className="border-b border-border/10 align-top last:border-0">
                <th scope="row" className="p-4 font-bold">{t(`rows.${row.id}.question`)}</th>
                <td className="p-4">
                  {t(`rows.${row.id}.us`)}
                  <Cite ids={[...row.us]} />
                </td>
                <td className="p-4">
                  {t(`rows.${row.id}.eu`)}
                  <Cite ids={[...row.eu]} />
                </td>
                <td className="p-4">
                  {t(`rows.${row.id}.${country}`)}
                  {row[country].length > 0 && <Cite ids={[...row[country]]} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Phones get one card per question, the picked country first: a
          four-column table would push that column off screen. */}
      <ol className="flex flex-col gap-4 md:hidden">
        {COMPARISON.map((row) => (
          <li key={row.id} className="depth-card flex flex-col gap-3 p-5">
            <h3 className="text-lg font-bold">{t(`rows.${row.id}.question`)}</h3>
            <dl className="flex flex-col gap-3 text-base">
              {([
                [name(country), `rows.${row.id}.${country}`, row[country]],
                [t("colEU"), `rows.${row.id}.eu`, row.eu],
                [t("colUS"), `rows.${row.id}.us`, row.us],
              ] as const).map(([label, key, cites]) => (
                <div key={key}>
                  <dt className="font-display font-bold">{label}</dt>
                  <dd>
                    {t(key)}
                    {cites.length > 0 && <Cite ids={[...cites]} />}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ol>
    </div>
  );
}

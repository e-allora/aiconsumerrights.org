import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CorrectionsLog } from "@/components/ui/PublicLog";
import { RULES } from "@/lib/forum/consensus";
import { DAILY_LIMITS } from "@/lib/forum/submissions";
import { VOTER_COOKIE_DAYS } from "@/lib/forum/votes";
import type { Locale } from "@/lib/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { CONTACT_EMAIL, MISSION_URL, REPO_URL } from "@/lib/site";

type Props = { params: { locale: Locale } };

export async function generateMetadata({ params: { locale } }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "HowItWorks" });
  const c = await getTranslations({ locale, namespace: "Common" });
  return pageMetadata({
    locale,
    title: t("metaTitle"),
    description: t("metaDescription"),
    siteName: c("siteName"),
    imageAlt: `${c("siteName")}: ${c("siteDescription")}`,
    path: "/how-it-works",
  });
}

const SERVICES = ["vercel", "neon", "openrouter", "models", "github"] as const;
const KEEP = ["votes", "suggestions", "never"] as const;
const UNFINISHED = ["review", "translations", "language", "results", "ai", "limits", "twice"] as const;

const bold = (c: React.ReactNode) => <strong>{c}</strong>;
const linkClass = "font-semibold text-link underline underline-offset-4";
function external(href: string) {
  return function ExternalLink(c: React.ReactNode) {
    return (
      <a href={href} className={linkClass}>
        {c}
      </a>
    );
  };
}

/**
 * The site's own transparency page: who runs it, every service it uses and
 * what each one sees, what is kept, what isn't finished, and every error
 * that has been fixed. Numbers come
 * from the code, so the page can't drift from what the site does.
 */
export default function HowItWorksPage({ params: { locale } }: Props) {
  setRequestLocale(locale);
  const t = useTranslations("HowItWorks");
  const list = (keys: readonly string[], ns: string, values: Record<string, number> = {}) => (
    <ul className="flex list-disc flex-col gap-3 pl-6">
      {keys.map((k) => (
        <li key={k}>{t.rich(`${ns}.${k}`, { ...values, b: bold })}</li>
      ))}
    </ul>
  );
  return (
    <main id="main" className="mx-auto flex max-w-3xl flex-col gap-14 px-4 py-12 sm:py-16">
      <header className="flex flex-col gap-5">
        <h1>{t("title")}</h1>
        <p className="text-xl">{t("lead")}</p>
      </header>

      <section aria-labelledby="who" className="flex flex-col gap-4">
        <h2 id="who">{t("whoHeading")}</h2>
        <p>{t.rich("who", { b: bold })}</p>
        <p>{t.rich("open", { b: bold, code: external(REPO_URL) })}</p>
        <p>{t.rich("mission", { mission: external(MISSION_URL) })}</p>
      </section>

      <section aria-labelledby="built" className="flex flex-col gap-4">
        <h2 id="built">{t("builtHeading")}</h2>
        <p>{t("built")}</p>
      </section>

      <section aria-labelledby="services" className="flex flex-col gap-4">
        <h2 id="services">{t("servicesHeading")}</h2>
        {list(SERVICES, "services")}
      </section>

      <section aria-labelledby="keep" className="flex flex-col gap-4">
        <h2 id="keep">{t("keepHeading")}</h2>
        {list(KEEP, "keep", { days: VOTER_COOKIE_DAYS })}
      </section>

      <section aria-labelledby="unfinished" className="flex flex-col gap-4">
        <h2 id="unfinished">{t("unfinishedHeading")}</h2>
        {list(UNFINISHED, "unfinished", {
          minVotes: RULES.minVotes,
          checks: DAILY_LIMITS.aiChecks,
          max: DAILY_LIMITS.submissions,
        })}
      </section>

      <section aria-labelledby="corrections" className="flex flex-col gap-4">
        <h2 id="corrections">{t("correctionsHeading")}</h2>
        <p>{t.rich("correctionsLead", { b: bold })}</p>
        <CorrectionsLog />
      </section>

      <section aria-labelledby="contact" className="depth-card flex flex-col gap-4 p-6 sm:p-8">
        <h2 id="contact">{t("contactHeading")}</h2>
        <p>{t.rich("contact", { b: bold })}</p>
        <p>
          {t.rich("contactHow", {
            email: CONTACT_EMAIL,
            mail: external(`mailto:${CONTACT_EMAIL}`),
            issues: external(`${REPO_URL}/issues`),
          })}
        </p>
        <p className="text-base text-muted-foreground">{t("domainNote")}</p>
      </section>
    </main>
  );
}

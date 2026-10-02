import { useTranslations } from "next-intl";

import { Link } from "@/lib/i18n/navigation";

const linkClass = "tap-target font-semibold text-link underline underline-offset-4";

/**
 * What a visitor sees when an address matches no page: plain words in their
 * own language, and two ways onward. It sits inside the locale layout, so
 * the site's navigation stays around it.
 */
export function NotFoundContent() {
  const t = useTranslations("Common");
  const nav = useTranslations("Navigation");
  return (
    <main id="main" className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-16">
      <h1>{t("notFoundTitle")}</h1>
      <p className="text-xl">{t("notFoundBody")}</p>
      <ul className="flex flex-wrap gap-x-6 gap-y-3 text-lg">
        <li>
          <Link href="/" className={linkClass}>
            {t("notFoundHome")}
          </Link>
        </li>
        <li>
          <Link href="/help" className={linkClass}>
            {nav("help")}
          </Link>
        </li>
      </ul>
    </main>
  );
}

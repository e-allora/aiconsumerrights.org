import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { PAUSEStrategy } from "@/components/guide/PAUSEStrategy";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";

// The main page: a short welcome, links to the guide and forum, and the
// PAUSE Strategy, an everyday habit people can use with any AI tool.
export default function HomePage({ params: { locale } }: { params: { locale: Locale } }) {
  setRequestLocale(locale);
  const t = useTranslations("Home");
  return (
    <main id="main" className="mx-auto flex max-w-5xl flex-col gap-16 px-4 py-16">
      <div className="flex max-w-2xl flex-col gap-6">
        <h1>{t("title")}</h1>
        <p className="text-xl">
          <strong>{t("lead")}</strong>
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/guide">{t("readGuide")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/forum">{t("joinForum")}</Link>
          </Button>
        </div>
      </div>
      <PAUSEStrategy />
    </main>
  );
}

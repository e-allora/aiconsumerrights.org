"use client";

import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { LOCALE_TAGS, routing, type Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Language menu. Each option is named in its own language and marked with
 * lang, so a screen reader pronounces "Español" in Spanish and each
 * Portuguese option with its own accent. Choosing one
 * keeps you on the same page: /en/forum becomes /es/forum.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("Navigation");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const current = t(`languageNames.${locale}`);

  function choose(next: string) {
    if (next === locale) return;
    const hash = typeof window === "undefined" ? "" : window.location.hash;
    router.replace(`${pathname}${hash}`, { locale: next as Locale });
  }

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="ghost"
          aria-label={t("languageLabel", { current })}
          className={cn("px-3", className)}
        >
          <Languages aria-hidden="true" />
          <span lang={LOCALE_TAGS[locale].lang}>{current}</span>
          <ChevronDown aria-hidden="true" className="!size-4" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-[60] min-w-44 rounded-lg border-2 border-border/10 bg-card p-1 text-card-foreground shadow-depth-3 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <DropdownMenu.Label className="px-3 py-2 text-sm font-bold text-muted-foreground">
            {t("language")}
          </DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={locale} onValueChange={choose}>
            {routing.locales.map((l) => (
              <DropdownMenu.RadioItem
                key={l}
                value={l}
                lang={LOCALE_TAGS[l].lang}
                className="tap-target flex min-h-11 cursor-pointer select-none items-center justify-between gap-3 rounded-md px-3 font-semibold outline-none data-[highlighted]:bg-muted data-[highlighted]:ring-[3px] data-[highlighted]:ring-ring"
              >
                {t(`languageNames.${l}`)}
                <DropdownMenu.ItemIndicator>
                  <Check aria-hidden="true" className="size-4 text-link" />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

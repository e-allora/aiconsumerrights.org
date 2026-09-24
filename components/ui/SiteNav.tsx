"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { BookOpen, Home, Info, Library, Menu, MessagesSquare, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { NAV_ITEMS } from "@/lib/site";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ElementType> = {
  "/": Home,
  "/guide": BookOpen,
  "/forum": MessagesSquare,
  "/sources": Library,
  "/about": Info,
};

const isCurrent = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

const ring =
  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/**
 * Desktop: a header with every link. Mobile: a bottom bar within thumb reach.
 * Both: a drawer with each page and a one-line hint, for non-linear browsing.
 */
export function SiteNav() {
  const t = useTranslations("Navigation");
  const tc = useTranslations("Common");
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = React.useState(false);

  // Close the drawer after a route change.
  React.useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b-2 border-border/10 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2">
          <Link
            href="/"
            className={cn("tap-target flex items-center rounded-md font-display text-base font-extrabold leading-tight [text-wrap:balance] sm:text-lg", ring)}
          >
            {tc("siteName")}
          </Link>

          <nav aria-label={t("main")} className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const current = isCurrent(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "tap-target flex h-11 items-center rounded-md px-3 font-semibold transition-colors duration-fast hover:bg-muted",
                        current && "bg-muted text-foreground underline decoration-primary decoration-2 underline-offset-8",
                        ring
                      )}
                    >
                      {t(item.key)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-1">
            <LanguageSwitcher className="hidden md:inline-flex" />
            <ThemeToggle />
            <Dialog.Root open={open} onOpenChange={setOpen}>
              <Dialog.Trigger asChild>
                <Button variant="ghost" size="icon" aria-label={t("openMenu")} className="md:hidden">
                  <Menu aria-hidden="true" />
                </Button>
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-charcoal/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content
                  className="fixed inset-y-0 right-0 z-50 flex w-[min(22rem,90vw)] flex-col gap-6 bg-background p-6 shadow-depth-3 duration-base data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
                >
                  <div className="flex items-center justify-between">
                    <Dialog.Title className="font-display text-display-sm">{t("menuTitle")}</Dialog.Title>
                    <Dialog.Close asChild>
                      <Button variant="ghost" size="icon" aria-label={t("closeMenu")}>
                        <X aria-hidden="true" />
                      </Button>
                    </Dialog.Close>
                  </div>
                  <Dialog.Description className="sr-only">
                    {t("menuDescription")}
                  </Dialog.Description>
                  <nav aria-label={t("allPages")}>
                    <ul className="flex flex-col gap-2">
                      {NAV_ITEMS.map((item) => {
                        const Icon = ICONS[item.href];
                        const current = isCurrent(pathname, item.href);
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              aria-current={current ? "page" : undefined}
                              onClick={() => setOpen(false)}
                              className={cn(
                                "depth-card tap-target flex items-start gap-3 p-4 transition-colors duration-fast hover:bg-muted",
                                current && "border-primary",
                                ring
                              )}
                            >
                              <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-link" />
                              <span className="flex flex-col">
                                <span className="font-display font-bold">{t(item.key)}</span>
                                <span className="text-sm text-muted-foreground">{t(`${item.key}Hint`)}</span>
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </nav>
                  <div className="flex items-center justify-between gap-3 border-t-2 border-border/10 pt-4">
                    <span className="font-display font-bold">{t("language")}</span>
                    <LanguageSwitcher />
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </header>

      <nav
        aria-label={t("quick")}
        className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-border/10 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-5">
          {NAV_ITEMS.map((item) => {
            const Icon = ICONS[item.href];
            const current = isCurrent(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "tap-target flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold",
                    current ? "text-link" : "text-foreground",
                    ring,
                    "focus-visible:ring-inset focus-visible:ring-offset-0"
                  )}
                >
                  <Icon aria-hidden="true" className={cn("size-5", current && "stroke-[2.5]")} />
                  {t(item.key)}
                  {current && <span aria-hidden="true" className="mt-0.5 h-1 w-6 rounded-full bg-primary" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

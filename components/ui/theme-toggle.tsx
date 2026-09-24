"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const icon =
  "absolute transition-[transform,opacity] duration-base ease-spring";

/**
 * A toggle button: the label stays "Dark theme" and aria-pressed says
 * whether it's on, which screen readers announce as "Dark theme, pressed".
 */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("Common");
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // The theme is unknown until the client mounts. Render the same-size
  // button, disabled, so nothing shifts and the server HTML matches.
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t("darkTheme")}
      aria-pressed={mounted ? isDark : undefined}
      disabled={!mounted}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn("relative overflow-hidden", className)}
    >
      <Sun
        aria-hidden="true"
        className={cn(icon, isDark ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")}
      />
      <Moon
        aria-hidden="true"
        className={cn(icon, isDark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0")}
      />
    </Button>
  );
}

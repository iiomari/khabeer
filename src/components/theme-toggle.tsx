"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n/ar";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  // The icons swap purely through the `dark:` variant, so no hydration guard
  // (and no state) is needed: the current theme is read from the DOM on click.
  function toggle() {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative size-11"
      onClick={toggle}
      aria-label={t.theme.toggle}
    >
      <Sun className="size-5 scale-100 rotate-0 transition-transform duration-300 dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-5 scale-0 rotate-90 transition-transform duration-300 dark:scale-100 dark:rotate-0" />
    </Button>
  );
}

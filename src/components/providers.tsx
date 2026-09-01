"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { DirectionProvider } from "radix-ui/direction";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <DirectionProvider dir="rtl">
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster position="top-center" dir="rtl" richColors closeButton />
          </TooltipProvider>
        </DirectionProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

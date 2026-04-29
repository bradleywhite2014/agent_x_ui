"use client";

import type { ReactNode } from "react";

import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import type { GlobalThemeState } from "@/lib/theme/schema";

import { GlobalThemeProvider } from "@/components/theme/GlobalThemeProvider";

export function Providers({
  children,
  initialGlobalTheme,
}: {
  children: ReactNode;
  initialGlobalTheme: GlobalThemeState;
}) {
  const themeSnapshotKey = JSON.stringify(initialGlobalTheme);
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <GlobalThemeProvider
        key={themeSnapshotKey}
        initialGlobal={initialGlobalTheme}
      >
        <TooltipProvider>
          {children}
          <Toaster richColors />
        </TooltipProvider>
      </GlobalThemeProvider>
    </ThemeProvider>
  );
}

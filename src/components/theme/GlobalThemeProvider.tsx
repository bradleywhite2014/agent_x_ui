"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { GlobalThemeState } from "@/lib/theme/schema";

import { ThemeRuntime } from "./ThemeRuntime";

interface GlobalThemeContextValue {
  global: GlobalThemeState;
  setGlobal: React.Dispatch<React.SetStateAction<GlobalThemeState>>;
}

const GlobalThemeContext = createContext<GlobalThemeContextValue | null>(null);

export function useGlobalTheme(): GlobalThemeContextValue {
  const ctx = useContext(GlobalThemeContext);
  if (!ctx) {
    throw new Error("useGlobalTheme must be used within GlobalThemeProvider");
  }
  return ctx;
}

export function GlobalThemeProvider({
  initialGlobal,
  children,
}: {
  initialGlobal: GlobalThemeState;
  children: ReactNode;
}) {
  const [global, setGlobal] = useState<GlobalThemeState>(initialGlobal);

  const value = useMemo(() => ({ global, setGlobal }), [global]);

  return (
    <GlobalThemeContext.Provider value={value}>
      <ThemeRuntime global={global} />
      {children}
    </GlobalThemeContext.Provider>
  );
}

"use client";

import { useState } from "react";
import { Palette } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ThemeManagerSheet } from "./ThemeManagerSheet";

/** Opens the Theme Manager for global defaults (landing / frames picker headers). */
export function GlobalThemeMenuButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Theme manager"
        onClick={() => setOpen(true)}
      >
        <Palette className="size-4" />
      </Button>
      <ThemeManagerSheet open={open} onOpenChange={setOpen} scope="global" />
    </>
  );
}

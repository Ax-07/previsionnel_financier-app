"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

interface ThemeToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variant du bouton (outline, ghost, etc.) — passé à `buttonVariants` */
  variant?: "outline" | "ghost" | "default";
  /** Taille du bouton (sm, md, lg) — passé à `buttonVariants` */
  size?: "default" | "sm" | "lg" | "xs" | "icon" | "icon-xs" | "icon-sm" | "icon-lg" | null | undefined;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ size, variant, ...props }) => {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="relative overflow-hidden cursor-pointer"
      aria-label={`Basculer vers le mode ${theme === "light" ? "sombre" : "clair"}`}
      title={`Basculer vers le mode ${theme === "light" ? "sombre" : "clair"}`}
      {...props}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

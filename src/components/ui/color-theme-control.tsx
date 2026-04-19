"use client";

import { Button } from '@/components/ui/button';
import { 
  Palette, 
  RotateCcw 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { COLOR_HUES, useColorTheme } from '@/hooks/use-color-theme';
import { cn } from '@/lib/utils';

interface ColorThemeControlProps {
  className?: string;
  /** Variant du bouton (outline, ghost, etc.) — passé à `buttonVariants` */
  variant?: "outline" | "ghost" | "default";
  /** Taille du bouton (sm, md, lg) — passé à `buttonVariants` */
  size?: "default" | "sm" | "lg" | "xs" | "icon" | "icon-xs" | "icon-sm" | "icon-lg" | null | undefined;
}

export const ColorThemeControl: React.FC<ColorThemeControlProps> = ({ size, variant, className, ...props }) => {
  const {
    currentTheme,
    setColorTheme,
  } = useColorTheme();

  const handleThemeSelect = (theme: typeof COLOR_HUES[0]) => {
    setColorTheme(theme);
  };

  const handleReset = () => {
    setColorTheme(COLOR_HUES[0]);
  };

  return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={cn("relative cursor-pointer", className)}
            aria-label={`Changer le thème de couleur. Thème actuel : ${currentTheme.label}`}
            title={`Changer le thème de couleur. Thème actuel : ${currentTheme.label}`}
            {...props}
          >
            <Palette className="h-4 w-4" />
            <div 
              className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-background transition-colors duration-300"
              style={{
                backgroundColor: `oklch(0.7 0.17 ${currentTheme.hue})`
              }}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="p-2 text-sm font-medium text-muted-foreground">
            Thème actuel: {currentTheme.label}
          </div>
          <DropdownMenuSeparator />
          {COLOR_HUES.map((theme) => (
            <DropdownMenuItem
              key={theme.name}
              onClick={() => handleThemeSelect(theme)}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div 
                className="w-4 h-4 rounded-full border border-border transition-colors duration-200"
                style={{
                  backgroundColor: `oklch(0.7 0.17 ${theme.hue})`
                }}
              />
              <span className="flex-1">{theme.label}</span>
              {currentTheme.name === theme.name && (
                <span className="text-primary text-xs font-medium">✓</span>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleReset}
            className="flex items-center gap-3 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  );
}

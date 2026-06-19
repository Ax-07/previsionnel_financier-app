"use client";

import React from "react";
import { ChevronDown, Hash, RectangleHorizontal, RectangleVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PageFormatState } from "./types";

const FORMAT_LABELS: Record<string, string> = {
  A4: "A4",
  A3: "A3",
  A5: "A5",
  LETTER: "Letter",
  LEGAL: "Legal",
  TABLOID: "Tabloid",
};

interface PageSizeControlProps {
  pageFormat: PageFormatState;
  onPageFormatChange: (changes: Partial<PageFormatState>) => void;
}

/** Contrôles de format de page : sélecteur de taille, orientation et numéros de page. */
export const PageSizeControl: React.FC<PageSizeControlProps> = ({
  pageFormat,
  onPageFormatChange,
}) => {
  const isLandscape = pageFormat.orientation === "landscape";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="default"
            className="flex justify-between px-2 my-0.5 gap-0.5 min-w-20 border-none"
            aria-label="Format de page"
            title="Format de page"
          >
            <span className="text-sm">{FORMAT_LABELS[pageFormat.format] ?? pageFormat.format}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {Object.keys(FORMAT_LABELS).map((key) => (
            <DropdownMenuItem key={key} onSelect={() => onPageFormatChange({ format: key })} title={FORMAT_LABELS[key]}>
              {FORMAT_LABELS[key]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant={isLandscape ? "secondary" : "ghost"}
        size="icon"
        aria-label={isLandscape ? "Basculer en portrait" : "Basculer en paysage"}
        title={isLandscape ? "Paysage — cliquer pour portrait" : "Portrait — cliquer pour paysage"}
        onClick={() => onPageFormatChange({ orientation: isLandscape ? "portrait" : "landscape" })}
      >
        {isLandscape ? <RectangleHorizontal className="h-4 w-4" /> : <RectangleVertical className="h-4 w-4" />}
      </Button>

      <Button
        variant={pageFormat.showPageNumbers ? "secondary" : "ghost"}
        size="icon"
        aria-label="Numéros de page"
        title={pageFormat.showPageNumbers ? "Masquer les numéros de page" : "Afficher les numéros de page"}
        onClick={() => onPageFormatChange({ showPageNumbers: !pageFormat.showPageNumbers })}
      >
        <Hash className="h-4 w-4" />
      </Button>
    </>
  );
};

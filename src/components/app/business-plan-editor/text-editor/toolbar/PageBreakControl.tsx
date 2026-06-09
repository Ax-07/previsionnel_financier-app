"use client";

import React from "react";
import { SeparatorHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolbarSectionProps } from "./types";
import { insertPageBreak } from "./commands";

/** Bouton d'insertion d'un saut de page dans le document. */
export const PageBreakControl: React.FC<ToolbarSectionProps> = ({ executeCommand }) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Insérer un saut de page"
      title="Insérer un saut de page"
      onClick={() => executeCommand(insertPageBreak())}
    >
      <SeparatorHorizontal className="h-4 w-4" />
    </Button>
  );
};

"use client";

import React from "react";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { ButtonGroup } from "@/components/ui/button-group";
import { ToolbarSectionProps } from "./types";
import { setTextAlign } from "./commands";

const ALIGNMENTS = [
  { value: "left",    Icon: AlignLeft,    label: "Aligner à gauche" },
  { value: "center",  Icon: AlignCenter,  label: "Centrer" },
  { value: "right",   Icon: AlignRight,   label: "Aligner à droite" },
  { value: "justify", Icon: AlignJustify, label: "Justifier" },
] as const;

export const AlignmentControls: React.FC<ToolbarSectionProps> = ({ editorState, executeCommand }) => {
  const currentAlign = (editorState.selection.$from.parent.attrs.textAlign as string) || "left";

  return (
    <ButtonGroup className="my-0.5">
      {ALIGNMENTS.map(({ value, Icon, label }) => (
        <Toggle
          key={value}
          pressed={currentAlign === value}
          onPressedChange={() => executeCommand(setTextAlign(value))}
          size="default"
          aria-label={label}
        >
          <Icon className="h-4 w-4" />
        </Toggle>
      ))}
    </ButtonGroup>
  );
};

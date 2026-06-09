"use client";

import React from "react";
import { toggleMark } from "prosemirror-commands";
import { Bold, Italic, Underline, Strikethrough, Code, Subscript, Superscript } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { ButtonGroup } from "@/components/ui/button-group";
import { ToolbarSectionProps } from "./types";
import { isMarkActive } from "./commands";

export const FormattingControls: React.FC<ToolbarSectionProps> = ({ editorState, executeCommand }) => {
  const { schema } = editorState;

  const marks = [
    { key: "strong",        Icon: Bold,          label: "Gras",        shortcut: "Ctrl+B" },
    { key: "em",            Icon: Italic,        label: "Italique",    shortcut: "Ctrl+I" },
    { key: "underline",     Icon: Underline,     label: "Souligné",    shortcut: "Ctrl+U" },
    { key: "strikethrough", Icon: Strikethrough, label: "Barré",       shortcut: "Ctrl+Shift+S" },
    { key: "code",          Icon: Code,          label: "Code inline", shortcut: "Ctrl+`" },
    { key: "subscript",     Icon: Subscript,     label: "Indice",      shortcut: "" },
    { key: "superscript",   Icon: Superscript,   label: "Exposant",    shortcut: "" },
  ] as const;

  return (
    <ButtonGroup id="formatting-buttons" className="my-0.5">
      {marks.map(({ key, Icon, label }) => {
        const markType = schema.marks[key];
        if (!markType) return null;
        return (
          <Toggle
            key={key}
            pressed={isMarkActive(editorState, markType)}
            onPressedChange={() => executeCommand(toggleMark(markType))}
            size="default"
            aria-label={label}
          >
            <Icon className="h-4 w-4" />
          </Toggle>
        );
      })}
    </ButtonGroup>
  );
};

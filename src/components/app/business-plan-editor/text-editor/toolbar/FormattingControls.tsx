"use client";

import React from "react";
import { toggleMark } from "prosemirror-commands";
import { Bold, Code, Italic, Strikethrough, Underline } from "lucide-react";
import { ButtonGroup } from "@/components/ui/button-group";
import { Toggle } from "@/components/ui/toggle";
import { isMarkActive } from "./commands";
import { ToolbarSectionProps } from "./types";

export const FormattingControls: React.FC<ToolbarSectionProps> = ({ editorState, executeCommand }) => {
  const { schema } = editorState;

  const marks = [
    { key: "strong", Icon: Bold, label: "Gras", shortcut: "Ctrl+B" },
    { key: "em", Icon: Italic, label: "Italique", shortcut: "Ctrl+I" },
    { key: "underline", Icon: Underline, label: "Souligne", shortcut: "Ctrl+U" },
    { key: "strikethrough", Icon: Strikethrough, label: "Barre", shortcut: "Ctrl+Shift+S" },
    { key: "code", Icon: Code, label: "Code inline", shortcut: "Ctrl+`" },
  ] as const;

  return (
    <ButtonGroup id="formatting-buttons" className="my-0.5">
      {marks.map(({ key, Icon, label, shortcut }) => {
        const markType = schema.marks[key];
        if (!markType) return null;
        return (
          <Toggle
            key={key}
            pressed={isMarkActive(editorState, markType)}
            onPressedChange={() => executeCommand(toggleMark(markType))}
            size="default"
            aria-label={label}
            title={`${label} (${shortcut})`}
          >
            <Icon className="h-4 w-4" />
          </Toggle>
        );
      })}
    </ButtonGroup>
  );
};

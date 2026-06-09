"use client";

import React from "react";
import { Indent, Outdent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { ToolbarSectionProps } from "./types";
import { changeIndent } from "./commands";

export const IndentControls: React.FC<ToolbarSectionProps> = ({ editorState, executeCommand }) => {
  const indent = (editorState.selection.$from.parent.attrs.indent as number) ?? 0;

  return (
    <ButtonGroup className="my-0.5">
      <Button
        variant="ghost"
        size="default"
        onClick={() => executeCommand(changeIndent(-1))}
        disabled={indent <= 0}
        aria-label="Diminuer l'indentation"
      >
        <Outdent className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="default"
        onClick={() => executeCommand(changeIndent(1))}
        disabled={indent >= 8}
        aria-label="Augmenter l'indentation"
      >
        <Indent className="h-4 w-4" />
      </Button>
    </ButtonGroup>
  );
};

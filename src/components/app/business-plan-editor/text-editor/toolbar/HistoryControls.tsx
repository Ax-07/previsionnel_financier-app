"use client";

import React from "react";
import { undo, redo } from "prosemirror-history";
import { Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { ToolbarSectionProps } from "./types";

export const HistoryControls: React.FC<ToolbarSectionProps> = ({ editorState, executeCommand }) => {
  const canUndo = undo(editorState, undefined);
  const canRedo = redo(editorState, undefined);

  return (
    <ButtonGroup id="historic-buttons" className="my-0.5">
      <Button
        onClick={() => executeCommand(undo)}
        variant="ghost"
        size="icon"
        aria-label="Annuler"
        disabled={!canUndo}
        title="Annuler (Ctrl+Z)"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        onClick={() => executeCommand(redo)}
        variant="ghost"
        size="icon"
        aria-label="Rétablir"
        disabled={!canRedo}
        title={"Rétablir"}
      >
        <Redo2 className="h-4 w-4" />
      </Button>
    </ButtonGroup>
  );
};

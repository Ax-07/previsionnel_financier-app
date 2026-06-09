"use client";

import React from "react";
import { wrapIn, lift } from "prosemirror-commands";
import { ToolbarSectionProps } from "./types";
import { liftAndSetBlockType } from "./commands";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const BLOCK_TYPES = [
  { label: "Paragraphe", value: "Paragraphe" },
  { label: "Titre 1",    value: "H1" },
  { label: "Titre 2",    value: "H2" },
  { label: "Titre 3",    value: "H3" },
  { label: "Titre 4",    value: "H4" },
  { label: "Titre 5",    value: "H5" },
  { label: "Titre 6",    value: "H6" },
  null, // séparateur
  { label: "Citation",   value: "Citation" },
  { label: "Bloc de code", value: "CodeBlock" },
] as const;

export const BlockTypeControl: React.FC<ToolbarSectionProps> = ({ editorState, executeCommand }) => {
  const { schema } = editorState;

  const getCurrentBlockType = (): string => {
    const { $from } = editorState.selection;
    for (let d = $from.depth; d >= 0; d--) {
      if ($from.node(d).type === schema.nodes.blockquote) return "Citation";
    }
    const node = $from.parent;
    if (node.type === schema.nodes.heading) return `Titre ${node.attrs.level}`;
    if (node.type === schema.nodes.code_block) return "Bloc de code";
    return "Paragraphe";
  };

  const handleBlockTypeChange = (value: string) => {
    if (value === "Paragraphe") {
      executeCommand(liftAndSetBlockType(schema.nodes.paragraph));
    } else if (value.startsWith("H") && value.length === 2) {
      const level = parseInt(value[1]);
      executeCommand(liftAndSetBlockType(schema.nodes.heading, { level }));
    } else if (value === "Citation") {
      const { $from } = editorState.selection;
      const inBlockquote = Array.from({ length: $from.depth + 1 }, (_, d) => $from.node(d)).some(
        (n) => n.type === schema.nodes.blockquote,
      );
      executeCommand(inBlockquote ? lift : wrapIn(schema.nodes.blockquote));
    } else if (value === "CodeBlock") {
      executeCommand(liftAndSetBlockType(schema.nodes.code_block));
    }
  };

  const currentLabel = getCurrentBlockType();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="default"
          className="flex justify-between px-2 my-0.5 gap-0.5 min-w-28 border-none"
          aria-label="Type de bloc"
        >
          <span className="text-sm truncate">{currentLabel}</span>
          <ChevronDown className="h-3 w-3 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {BLOCK_TYPES.map((item, i) =>
          item === null ? (
            <DropdownMenuSeparator key={`sep-${i}`} />
          ) : (
            <DropdownMenuItem key={item.value} onSelect={() => handleBlockTypeChange(item.value)}>
              {item.label}
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

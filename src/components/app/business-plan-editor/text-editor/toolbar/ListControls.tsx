"use client";

import React from "react";
import { List, ListOrdered, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { ToolbarSectionProps } from "./types";
import { setListStyle, toggleList, isInList } from "./commands";

export const ListControls: React.FC<ToolbarSectionProps> = ({ editorState, executeCommand }) => {
  const { schema } = editorState;
  const inBullet = isInList(schema.nodes.bullet_list, editorState);
  const inOrdered = isInList(schema.nodes.ordered_list, editorState);

  return (
    <>
      {/* Liste à puces — split button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="my-0.5">
          <div className="flex items-center aria-expanded:bg-muted aria-expanded:text-muted-foreground rounded-md">
            <Toggle
              pressed={inBullet}
              onPressedChange={() => executeCommand(toggleList(schema.nodes.bullet_list, "disc"))}
              onPointerDown={(e) => e.stopPropagation()}
              variant="default"
              size="default"
              className="rounded-r-none"
              aria-label="Liste à puces"
              title="Liste à puces"
            >
              <List className="h-4 w-4" />
            </Toggle>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-l-none border-none border-l w-4"
              aria-label="Choisir le style de liste à puces"
              title="Choisir le style de liste à puces"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => executeCommand(setListStyle(schema.nodes.bullet_list, "disc"))}>
            <span className="mr-2 text-base">●</span> Disque
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => executeCommand(setListStyle(schema.nodes.bullet_list, "circle"))}>
            <span className="mr-2 text-base">○</span> Cercle
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => executeCommand(setListStyle(schema.nodes.bullet_list, "square"))}>
            <span className="mr-2 text-base">■</span> Carré
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Liste numérotée — split button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center aria-expanded:bg-muted aria-expanded:text-muted-foreground rounded-md">
            <Toggle
              pressed={inOrdered}
              onPressedChange={() => executeCommand(toggleList(schema.nodes.ordered_list, "decimal"))}
              onPointerDown={(e) => e.stopPropagation()}
              variant="default"
              size="default"
              className="rounded-r-none"
              aria-label="Liste numérotée"
              title="Liste numérotée"
            >
              <ListOrdered className="h-4 w-4" />
            </Toggle>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-l-none border-none border-l w-4"
              aria-label="Choisir le style de liste numérotée"
              title="Choisir le style de liste numérotée"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => executeCommand(setListStyle(schema.nodes.ordered_list, "decimal"))}>
            <span className="mr-2 font-mono text-xs">1.</span> Nombres
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => executeCommand(setListStyle(schema.nodes.ordered_list, "lower-alpha"))}>
            <span className="mr-2 font-mono text-xs">a.</span> Lettres min.
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => executeCommand(setListStyle(schema.nodes.ordered_list, "upper-alpha"))}>
            <span className="mr-2 font-mono text-xs">A.</span> Lettres maj.
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => executeCommand(setListStyle(schema.nodes.ordered_list, "lower-roman"))}>
            <span className="mr-2 font-mono text-xs">i.</span> Romain min.
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => executeCommand(setListStyle(schema.nodes.ordered_list, "upper-roman"))}>
            <span className="mr-2 font-mono text-xs">I.</span> Romain maj.
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

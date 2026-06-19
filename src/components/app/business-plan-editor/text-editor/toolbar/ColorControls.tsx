"use client";

import React, { useState } from "react";
import { Baseline, Highlighter, X } from "lucide-react";
import type { Mark, MarkType } from "prosemirror-model";
import type { Command, EditorState, Transaction } from "prosemirror-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToolbarSectionProps } from "./types";

const PRESET_COLORS = [
  "#000000", "#374151", "#6b7280", "#d1d5db", "#ffffff",
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#fca5a5", "#86efac",
  "#93c5fd",
];

interface ColorPopoverProps {
  activeColor: string | null;
  onSelectColor: (color: string) => void;
  onClear: () => void;
}

const ColorPopover: React.FC<ColorPopoverProps> = ({ activeColor, onSelectColor, onClear }) => {
  const [hex, setHex] = useState("");

  const handleHexKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && /^#[0-9a-fA-F]{3,6}$/.test(hex)) {
      onSelectColor(hex);
      setHex("");
    }
  };

  return (
    <div className="p-2 space-y-2 w-44">
      <div className="grid grid-cols-5 gap-1">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            className={[
              "h-6 w-6 rounded border hover:scale-110 transition-transform",
              activeColor?.toLowerCase() === color.toLowerCase() ? "border-ring ring-2 ring-ring/40" : "border-border",
            ].join(" ")}
            style={{ backgroundColor: color }}
            onClick={() => onSelectColor(color)}
            aria-label={color}
            title={color}
          />
        ))}
      </div>
      <div className="flex gap-1">
        <Input
          className="h-7 text-xs font-mono"
          placeholder="#rrggbb"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          onKeyDown={handleHexKeyDown}
          maxLength={7}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={onClear}
          aria-label="Effacer la couleur"
          title="Effacer la couleur"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

function getColorFromMarks(markType: MarkType, marks: readonly Mark[]): string | null {
  const mark = markType.isInSet(marks);
  return typeof mark?.attrs.color === "string" ? mark.attrs.color : null;
}

function getActiveColor(state: EditorState, markKey: "textColor" | "highlight"): string | null {
  const markType = state.schema.marks[markKey];
  if (!markType) return null;

  const { empty, $from, from, to } = state.selection;
  if (empty) return getColorFromMarks(markType, state.storedMarks ?? $from.marks());

  let found: string | null = null;
  state.doc.nodesBetween(from, to, (node) => {
    if (found || !node.isText) return;
    found = getColorFromMarks(markType, node.marks);
    if (found) return false;
  });
  return found;
}

function updateSelectedListMarkerColor(state: EditorState, tr: Transaction, color: string | null): void {
  const listItem = state.schema.nodes.list_item;
  if (!listItem) return;

  const { empty, $from, from, to } = state.selection;

  if (empty) {
    for (let depth = $from.depth; depth >= 0; depth--) {
      const node = $from.node(depth);
      if (node.type !== listItem) continue;
      tr.setNodeMarkup($from.before(depth), undefined, { ...node.attrs, markerColor: color });
      return;
    }
    return;
  }

  state.doc.nodesBetween(from, to, (node, pos) => {
    if (node.type === listItem) {
      tr.setNodeMarkup(pos, undefined, { ...node.attrs, markerColor: color });
    }
  });
}

const makeColorCommand = (markKey: "textColor" | "highlight", color: string): Command =>
  (state, dispatch) => {
    const mark = state.schema.marks[markKey];
    if (!mark) return false;
    const { empty, from, to } = state.selection;
    if (dispatch) {
      const tr = state.tr;
      if (empty) {
        tr.removeStoredMark(mark).addStoredMark(mark.create({ color }));
      } else {
        tr.removeMark(from, to, mark).addMark(from, to, mark.create({ color }));
      }
      if (markKey === "textColor") {
        updateSelectedListMarkerColor(state, tr, color);
      }
      dispatch(tr.scrollIntoView());
    }
    return true;
  };

const makeClearCommand = (markKey: "textColor" | "highlight"): Command =>
  (state, dispatch) => {
    const mark = state.schema.marks[markKey];
    if (!mark) return false;
    const { empty, from, to } = state.selection;
    if (dispatch) {
      const tr = state.tr;
      if (empty) tr.removeStoredMark(mark);
      else tr.removeMark(from, to, mark);
      if (markKey === "textColor") {
        updateSelectedListMarkerColor(state, tr, null);
      }
      dispatch(tr.scrollIntoView());
    }
    return true;
  };

function ColorButtonIcon({
  type,
  activeColor,
}: {
  type: "text" | "highlight";
  activeColor: string | null;
}) {
  const Icon = type === "text" ? Baseline : Highlighter;

  return (
    <span className="relative inline-flex h-5 w-5 items-center justify-center">
      <Icon className="h-4 w-4" />
      <span
        className="absolute bottom-0 h-0.5 w-4 rounded-full border border-border"
        style={{ backgroundColor: activeColor ?? "transparent" }}
      />
    </span>
  );
}

export const ColorControls: React.FC<ToolbarSectionProps> = ({ editorState, executeCommand }) => {
  const activeTextColor = getActiveColor(editorState, "textColor");
  const activeHighlight = getActiveColor(editorState, "highlight");

  return (
    <div className="flex items-center gap-0.5 my-0.5">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={activeTextColor ? "secondary" : "ghost"}
            size="default"
            aria-label="Couleur du texte"
            title="Couleur du texte"
          >
            <ColorButtonIcon type="text" activeColor={activeTextColor} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-auto" align="start">
          <ColorPopover
            activeColor={activeTextColor}
            onSelectColor={(c) => executeCommand(makeColorCommand("textColor", c))}
            onClear={() => executeCommand(makeClearCommand("textColor"))}
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={activeHighlight ? "secondary" : "ghost"}
            size="default"
            aria-label="Surlignage"
            title="Surlignage"
          >
            <ColorButtonIcon type="highlight" activeColor={activeHighlight} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-auto" align="start">
          <ColorPopover
            activeColor={activeHighlight}
            onSelectColor={(c) => executeCommand(makeColorCommand("highlight", c))}
            onClear={() => executeCommand(makeClearCommand("highlight"))}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

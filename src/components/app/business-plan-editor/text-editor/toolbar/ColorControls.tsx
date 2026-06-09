"use client";

import React, { useState } from "react";
import { Baseline, Highlighter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToolbarSectionProps } from "./types";
import { Command } from "prosemirror-state";

const PRESET_COLORS = [
  "#000000", "#374151", "#6b7280", "#d1d5db", "#ffffff",
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#fca5a5", "#86efac",
  "#93c5fd",
];

interface ColorPopoverProps {
  onSelectColor: (color: string) => void;
  onClear: () => void;
}

const ColorPopover: React.FC<ColorPopoverProps> = ({ onSelectColor, onClear }) => {
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
            className="h-6 w-6 rounded border border-border hover:scale-110 transition-transform"
            style={{ backgroundColor: color }}
            onClick={() => onSelectColor(color)}
            aria-label={color}
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
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

const makeColorCommand = (markKey: "textColor" | "highlight", color: string): Command =>
  (state, dispatch) => {
    const mark = state.schema.marks[markKey];
    if (!mark) return false;
    const { from, to } = state.selection;
    if (dispatch) {
      dispatch(state.tr.removeMark(from, to, mark).addMark(from, to, mark.create({ color })));
    }
    return true;
  };

const makeClearCommand = (markKey: "textColor" | "highlight"): Command =>
  (state, dispatch) => {
    const mark = state.schema.marks[markKey];
    if (!mark) return false;
    const { from, to } = state.selection;
    if (dispatch) dispatch(state.tr.removeMark(from, to, mark));
    return true;
  };

export const ColorControls: React.FC<ToolbarSectionProps> = ({ executeCommand }) => (
  <div className="flex items-center gap-0.5 my-0.5">
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="default" aria-label="Couleur du texte">
          <Baseline className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-auto" align="start">
        <ColorPopover
          onSelectColor={(c) => executeCommand(makeColorCommand("textColor", c))}
          onClear={() => executeCommand(makeClearCommand("textColor"))}
        />
      </PopoverContent>
    </Popover>

    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="default" aria-label="Surlignage">
          <Highlighter className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-auto" align="start">
        <ColorPopover
          onSelectColor={(c) => executeCommand(makeColorCommand("highlight", c))}
          onClear={() => executeCommand(makeClearCommand("highlight"))}
        />
      </PopoverContent>
    </Popover>
  </div>
);

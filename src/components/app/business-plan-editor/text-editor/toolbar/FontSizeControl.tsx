"use client";

import React, { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { Mark, MarkType, ResolvedPos } from "prosemirror-model";
import type { Command, EditorState } from "prosemirror-state";
import { Button } from "@/components/ui/button";
import { ToolbarSectionProps } from "./types";
import { cn } from "@/lib/utils";

const DEFAULT_FONT_SIZE = 16;
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 96;
const HEADING_FONT_SIZES: Record<number, number> = {
  1: 32,
  2: 24,
  3: 19,
  4: 16,
  5: 13,
  6: 11,
};

function clampFontSize(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_FONT_SIZE;
  return Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, Math.round(value)));
}

function parseFontSize(value: string | null): number | null {
  const match = /^(\d+(?:\.\d+)?)px$/i.exec(value ?? "");
  if (!match) return null;
  return clampFontSize(Number(match[1]));
}

function getFontSizeFromMarks(markType: MarkType, marks: readonly Mark[]): string | null {
  const mark = markType.isInSet(marks);
  return typeof mark?.attrs.size === "string" ? mark.attrs.size : null;
}

function getAdjacentFontSize(markType: MarkType, $pos: ResolvedPos): number | null {
  const before = parseFontSize(getFontSizeFromMarks(markType, $pos.nodeBefore?.marks ?? []));
  if (before) return before;

  return parseFontSize(getFontSizeFromMarks(markType, $pos.nodeAfter?.marks ?? []));
}

function getBlockFontSize(state: EditorState): number {
  const { $from } = state.selection;
  const parent = $from.parent;
  if (parent.type === state.schema.nodes.heading) {
    return HEADING_FONT_SIZES[Number(parent.attrs.level)] ?? DEFAULT_FONT_SIZE;
  }
  return DEFAULT_FONT_SIZE;
}

function getActiveFontSize(state: EditorState): number {
  const markType = state.schema.marks.fontSize;
  if (!markType) return getBlockFontSize(state);

  const { empty, $from, from, to } = state.selection;
  if (empty) {
    return (
      parseFontSize(getFontSizeFromMarks(markType, state.storedMarks ?? $from.marks())) ??
      getAdjacentFontSize(markType, $from) ??
      getBlockFontSize(state)
    );
  }

  let found: number | null = null;
  state.doc.nodesBetween(from, to, (node) => {
    if (found || !node.isText) return;
    found = parseFontSize(getFontSizeFromMarks(markType, node.marks));
    if (found) return false;
  });
  return found ?? getBlockFontSize(state);
}

const setFontSize = (size: number): Command => (state, dispatch) => {
  const markType = state.schema.marks.fontSize;
  if (!markType) return false;

  const normalizedSize = `${clampFontSize(size)}px`;
  const { empty, from, to } = state.selection;
  if (dispatch) {
    const tr = state.tr;
    if (empty) {
      tr.removeStoredMark(markType).addStoredMark(markType.create({ size: normalizedSize }));
    } else {
      tr.removeMark(from, to, markType).addMark(from, to, markType.create({ size: normalizedSize }));
    }
    dispatch(tr.scrollIntoView());
  }
  return true;
};

export const FontSizeControl: React.FC<ToolbarSectionProps> = ({ editorState, executeCommand }) => {
  const activeSize = getActiveFontSize(editorState);
  const displaySize = activeSize;
  const [draftSize, setDraftSize] = useState(String(displaySize));

  useEffect(() => {
    setDraftSize(String(displaySize));
  }, [displaySize]);

  const applyDraftSize = () => {
    const numericSize = Number(draftSize);
    if (!Number.isFinite(numericSize)) {
      setDraftSize(String(displaySize));
      return;
    }
    const nextSize = clampFontSize(numericSize);
    setDraftSize(String(nextSize));
    executeCommand(setFontSize(nextSize));
  };

  const applySizeDelta = (delta: number) => {
    const nextSize = clampFontSize(displaySize + delta);
    setDraftSize(String(nextSize));
    executeCommand(setFontSize(nextSize));
  };

  return (
    <div
      className={cn(
        "my-0.5 inline-flex h-8 items-center overflow-hidden bg-background",
      )}
      aria-label="Taille du texte"
      title="Taille du texte"
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-7 rounded-none"
        onClick={() => applySizeDelta(-1)}
        aria-label="Diminuer la taille du texte"
        title="Diminuer la taille du texte"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>

      <input
        className="h-6 w-10 border rounded bg-background px-1 text-center text-sm tabular-nums outline-none focus-visible:border-ring"
        value={draftSize}
        inputMode="numeric"
        aria-label="Taille du texte en pixels"
        onChange={(event) => setDraftSize(event.target.value.replace(/[^\d.]/g, ""))}
        onBlur={applyDraftSize}
        onFocus={(event) => event.currentTarget.select()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            applyDraftSize();
            event.currentTarget.blur();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            setDraftSize(String(displaySize)); 
            event.currentTarget.blur();
          }
        }}
      />

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-7 rounded-none"
        onClick={() => applySizeDelta(1)}
        aria-label="Augmenter la taille du texte"
        title="Augmenter la taille du texte"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

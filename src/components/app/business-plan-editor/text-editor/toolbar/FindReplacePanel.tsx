"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, ChevronUp, ChevronDown, Replace } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import {
  findReplaceKey,
  replaceActive,
  replaceAll,
} from "../findReplacePlugin";

interface FindReplacePanelProps {
  editorState: EditorState;
  viewRef: React.RefObject<EditorView | null>;
  onClose: () => void;
}

export const FindReplacePanel: React.FC<FindReplacePanelProps> = ({ editorState, viewRef, onClose }) => {
  const [query, setQuery] = useState("");
  const [replacement, setReplacement] = useState("");
  const [showReplace, setShowReplace] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const pluginState = findReplaceKey.getState(editorState);
  const resultCount = pluginState?.results.length ?? 0;
  const activeIndex = pluginState?.activeIndex ?? 0;

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const dispatchMeta = (meta: { type: string; query?: string }) => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch(view.state.tr.setMeta(findReplaceKey, meta));
    view.focus();
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    dispatchMeta({ type: "setQuery", query: value });
  };

  const handleClose = () => {
    dispatchMeta({ type: "setQuery", query: "" });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { handleClose(); return; }
    if (e.key === "Enter") {
      e.preventDefault();
      dispatchMeta({ type: e.shiftKey ? "prev" : "next" });
    }
  };

  return (
    <div
      className="flex items-start gap-2 px-3 py-2 border-t bg-muted/50 flex-wrap"
      role="search"
      aria-label="Rechercher et remplacer"
    >
      {/* Toggle replace */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 mt-0.5"
        onClick={() => setShowReplace((v) => !v)}
        aria-label={showReplace ? "Masquer le remplacement" : "Afficher le remplacement"}
        title={showReplace ? "Masquer le remplacement" : "Afficher le remplacement"}
      >
        <Replace className="h-3.5 w-3.5" />
      </Button>

      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {/* Recherche */}
        <div className="flex items-center gap-1">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Input
            ref={searchInputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher…"
            className="h-7 text-sm"
            aria-label="Terme à rechercher"
          />
          <span className="text-xs text-muted-foreground whitespace-nowrap min-w-12 text-center">
            {query ? (resultCount === 0 ? "Aucun" : `${activeIndex + 1}/${resultCount}`) : ""}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => dispatchMeta({ type: "prev" })}
            disabled={resultCount === 0}
            aria-label="Occurrence précédente"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => dispatchMeta({ type: "next" })}
            disabled={resultCount === 0}
            aria-label="Occurrence suivante"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Remplacement */}
        {showReplace && (
          <div className="flex items-center gap-1">
            <div className="w-3.5 shrink-0" />
            <Input
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") handleClose(); }}
              placeholder="Remplacer par…"
              className="h-7 text-sm"
              aria-label="Texte de remplacement"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 shrink-0"
              onClick={() => { if (viewRef.current) replaceActive(viewRef.current, replacement); }}
              disabled={resultCount === 0}
            >
              Remplacer
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 shrink-0"
              onClick={() => { if (viewRef.current) replaceAll(viewRef.current, replacement); }}
              disabled={resultCount === 0}
            >
              Tout
            </Button>
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 mt-0.5"
        onClick={handleClose}
        aria-label="Fermer la recherche"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

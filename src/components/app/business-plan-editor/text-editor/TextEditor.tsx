"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { createEditorState } from "./editorConfig";
import { Toolbar } from "./toolbar/Toolbar";
import type { PageFormatState } from "./toolbar/types";
import type { PaginationOptions } from "./pagination/paginationPlugin";
import { PAGE_SIZES } from "./pagination/constant";
import "prosemirror-view/style/prosemirror.css";

interface TextEditorProps {
  dossierId?: string;
}

export const TextEditor: React.FC<TextEditorProps> = ({ dossierId = "" }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [editorState, setEditorState] = useState<EditorState>(createEditorState);
  const [pageFormat, setPageFormat] = useState<PageFormatState>({
    format: "A4",
    orientation: "portrait",
    showPageNumbers: true,
  });
  // Ref toujours synchronisé — évite les stale closures dans useCallback.
  const pageFormatRef = useRef<PageFormatState>(pageFormat);
  pageFormatRef.current = pageFormat;

  // dispatchTransaction extrait en useCallback stable afin de pouvoir être
  // réutilisé à la fois dans useEffect (init) et dans handlePageFormatChange
  // (recréation de la view lors d'un changement de format).
  const dispatchTransaction = useCallback((tr: Parameters<ConstructorParameters<typeof EditorView>[1]["dispatchTransaction"] & {}>[0]) => {
    const newState = viewRef.current!.state.apply(tr);
    viewRef.current!.updateState(newState);
    setEditorState(newState);
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;

    viewRef.current = new EditorView(editorRef.current, {
      state: editorState,
      dispatchTransaction,
    });

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  // editorState et dispatchTransaction intentionnellement omis :
  // la view est initialisée une seule fois.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePageFormatChange = useCallback((changes: Partial<PageFormatState>) => {
    const newFormat = { ...pageFormatRef.current, ...changes };
    const baseSize = PAGE_SIZES[newFormat.format as keyof typeof PAGE_SIZES] ?? PAGE_SIZES.A4;
    const orientedSize: Partial<PaginationOptions> =
      newFormat.orientation === "landscape"
        ? { ...baseSize, pageWidth: baseSize.pageHeight, pageHeight: baseSize.pageWidth }
        : { ...baseSize };

    // Conserver le document courant (texte + structure).
    const doc = viewRef.current?.state.doc;
    const newEditorState = createEditorState(
      { ...orientedSize, footerRight: newFormat.showPageNumbers ? "{page}" : "" },
      doc,
    );

    // Détruire l'ancienne view pour nettoyer proprement les plugins
    // (destroy() côté ProseMirror + removeProperty CSS + style tag).
    // Recréer avec les nouveaux plugins (nouvelle taille de page).
    viewRef.current?.destroy();
    if (editorRef.current) {
      viewRef.current = new EditorView(editorRef.current, {
        state: newEditorState,
        dispatchTransaction,
      });
    }

    setPageFormat(newFormat);
    setEditorState(newEditorState);
  }, [dispatchTransaction]);

  return (
    <div id="text-editor-wrapper">
      <div className="sticky top-0 z-10 bg-background border-b">
        <Toolbar
          editorState={editorState}
          viewRef={viewRef}
          pageFormat={pageFormat}
          onPageFormatChange={handlePageFormatChange}
          dossierId={dossierId}
        />
      </div>
      <div className="page-editor-bg">
        <div ref={editorRef} />
      </div>
    </div>
  );
};

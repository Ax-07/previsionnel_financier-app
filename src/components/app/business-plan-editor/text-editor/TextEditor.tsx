"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { createEditorState } from "./editorConfig";
import { PageNavigator } from "./PageNavigator";
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
  const [viewVersion, setViewVersion] = useState(0);
  const [pageFormat, setPageFormat] = useState<PageFormatState>({
    format: "A4",
    orientation: "portrait",
    showPageNumbers: true,
    showTableOfContents: false,
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
    setViewVersion((version) => version + 1);

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
      {
        ...orientedSize,
        footerRight: newFormat.showPageNumbers ? "{page}" : "",
        pageBackgroundImage: newFormat.pageBackgroundImage,
        pageBackgroundImageOpacity: newFormat.pageBackgroundImageOpacity,
        pageBackgroundImageSize: newFormat.pageBackgroundImageSize,
        marginLeftImage: newFormat.marginLeftImage,
        marginRightImage: newFormat.marginRightImage,
        marginTopImages: newFormat.marginTopImages ?? newFormat.headerImages,
        marginBottomImages: newFormat.marginBottomImages ?? newFormat.footerImages,
        headerImages: newFormat.headerImages,
        footerImages: newFormat.footerImages,
        showTableOfContents: newFormat.showTableOfContents,
      },
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
      setViewVersion((version) => version + 1);
    }

    setPageFormat(newFormat);
    setEditorState(newEditorState);
  }, [dispatchTransaction]);

  return (
    <div id="text-editor-wrapper" className="print:m-0 print:block print:h-auto print:p-0" data-print-root="business-plan-editor">
      <div className="sticky top-0 z-10 bg-background border-b print:hidden">
        <Toolbar
          editorState={editorState}
          viewRef={viewRef}
          pageFormat={pageFormat}
          onPageFormatChange={handlePageFormatChange}
          dossierId={dossierId}
        />
      </div>
      <div className="bg-foreground/10 print:m-0 print:block print:bg-transparent print:p-0">
        <div className="mx-auto grid max-w-345 grid-cols-[250px_minmax(0,1fr)] items-start gap-5 print:block print:max-w-none print:gap-0 max-[900px]:block">
          <PageNavigator editorState={editorState} viewRef={viewRef} viewVersion={viewVersion} />
          <div className="min-w-0 overflow-x-auto py-5 print:overflow-visible print:p-0">
            <div ref={editorRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

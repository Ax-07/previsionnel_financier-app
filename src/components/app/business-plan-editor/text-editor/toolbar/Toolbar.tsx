"use client";

import React, { useState } from "react";
import { EditorState, Command } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { FileSpreadsheet, Search } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { HistoryControls } from "./HistoryControls";
import { FormattingControls } from "./FormattingControls";
import { FontSizeControl } from "./FontSizeControl";
import { BlockTypeControl } from "./BlockTypeControl";
import { ListControls } from "./ListControls";
import { AlignmentControls } from "./AlignmentControls";
import { IndentControls } from "./IndentControls";
import { ColorControls } from "./ColorControls";
import { LinkControl } from "./LinkControl";
import { InsertControls } from "./InsertControls";
import { TableControls } from "./TableControls";
import { PageBreakControl } from "./PageBreakControl";
import { PageSizeControl } from "./PageSizeControl";
import { PageBackgroundControl } from "./PageBackgroundControl";
import { FindReplacePanel } from "./FindReplacePanel";
import type { PageFormatState } from "./types";
import { PrintControls } from "./PrintControls";
import { FinancialTablePanel } from "../FinancialTablePanel";

interface ToolbarProps {
  editorState: EditorState | null;
  viewRef: React.RefObject<EditorView | null>;
  pageFormat: PageFormatState;
  onPageFormatChange: (changes: Partial<PageFormatState>) => void;
  dossierId?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  editorState,
  viewRef,
  pageFormat,
  onPageFormatChange,
  dossierId = "",
}) => {
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showFinancialPanel, setShowFinancialPanel] = useState(false);

  if (!editorState) return null;

  const executeCommand = (command: Command) => {
    if (!viewRef.current) return;
    command(viewRef.current.state, viewRef.current.dispatch, viewRef.current);
    viewRef.current.focus();
  };

  const sectionProps = { editorState, executeCommand };

  return (
    <div id="toolbar" className="border mb-4">
      {/* Barre principale */}
      <div className="flex items-center flex-wrap gap-0.5 px-1 py-0.5 min-h-10">
        <HistoryControls {...sectionProps} />
        <Separator orientation="vertical" className="h-9" />

        <BlockTypeControl {...sectionProps} />
        <Separator orientation="vertical" className="h-9" />

        <FormattingControls {...sectionProps} />
        <Separator orientation="vertical" className="h-9" />

        <FontSizeControl {...sectionProps} />
        <Separator orientation="vertical" className="h-9" />

        <ColorControls {...sectionProps} />
        <LinkControl {...sectionProps} />
        <Separator orientation="vertical" className="h-9" />

        <AlignmentControls {...sectionProps} />
        <IndentControls {...sectionProps} />
        <Separator orientation="vertical" className="h-9" />

        <ListControls {...sectionProps} />
        <Separator orientation="vertical" className="h-9" />

        <InsertControls {...sectionProps} />
        <TableControls {...sectionProps} />
        <PageBreakControl {...sectionProps} />
        <Separator orientation="vertical" className="h-9" />

        <Button
          variant={showFinancialPanel ? "secondary" : "ghost"}
          size="icon"
          className="my-0.5"
          onClick={() => setShowFinancialPanel((value) => !value)}
          aria-label="Inserer un tableau financier"
          aria-pressed={showFinancialPanel}
          title="Inserer un tableau financier"
        >
          <FileSpreadsheet className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-9" />

        <PageSizeControl pageFormat={pageFormat} onPageFormatChange={onPageFormatChange} />
        <PageBackgroundControl pageFormat={pageFormat} onPageFormatChange={onPageFormatChange} />
        <Separator orientation="vertical" className="h-9" />

        <PrintControls />
        <Button
          variant={showFindReplace ? "secondary" : "ghost"}
          size="default"
          className="my-0.5"
          onClick={() => setShowFindReplace((v) => !v)}
          aria-label="Rechercher et remplacer"
          aria-pressed={showFindReplace}
          title="Rechercher et remplacer"
        >
          <Search className="h-4 w-4" />
        </Button>
        <ThemeToggle />
      </div>

      {/* Panneau Rechercher / Remplacer */}
      {showFindReplace && (
        <FindReplacePanel
          editorState={editorState}
          viewRef={viewRef}
          onClose={() => setShowFindReplace(false)}
        />
      )}

      {showFinancialPanel && (
        <FinancialTablePanel
          isOpen={showFinancialPanel}
          onClose={() => setShowFinancialPanel(false)}
          dossierId={dossierId}
          executeCommand={executeCommand}
        />
      )}
    </div>
  );
};



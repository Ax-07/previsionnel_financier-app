"use client";

import React, { useState } from "react";
import { Table, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  isInTable,
  addRowAfter,
  addRowBefore,
  deleteRow,
  addColumnAfter,
  addColumnBefore,
  deleteColumn,
  mergeCells,
  splitCell,
  deleteTable,
} from "prosemirror-tables";
import { ToolbarSectionProps } from "./types";
import { insertTable } from "./commands";

export const TableControls: React.FC<ToolbarSectionProps> = ({ editorState, executeCommand }) => {
  const [insertOpen, setInsertOpen] = useState(false);
  const [rows, setRows] = useState("3");
  const [cols, setCols] = useState("3");

  const inTable = isInTable(editorState);

  const handleInsertTable = () => {
    const r = Math.max(1, Math.min(20, parseInt(rows) || 3));
    const c = Math.max(1, Math.min(20, parseInt(cols) || 3));
    executeCommand(insertTable(r, c));
    setInsertOpen(false);
    setRows("3");
    setCols("3");
  };

  return (
    <>
      {inTable ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="default" className="my-0.5 gap-0.5 px-2" aria-label="Options du tableau">
              <Table className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => executeCommand(addRowBefore)}>Insérer une ligne avant</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => executeCommand(addRowAfter)}>Insérer une ligne après</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => executeCommand(deleteRow)}>Supprimer la ligne</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => executeCommand(addColumnBefore)}>Insérer une colonne avant</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => executeCommand(addColumnAfter)}>Insérer une colonne après</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => executeCommand(deleteColumn)}>Supprimer la colonne</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => executeCommand(mergeCells)}>Fusionner les cellules</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => executeCommand(splitCell)}>Scinder la cellule</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => executeCommand(deleteTable)}
              className="text-destructive focus:text-destructive"
            >
              Supprimer le tableau
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          variant="ghost"
          size="default"
          className="my-0.5"
          onClick={() => setInsertOpen(true)}
          aria-label="Insérer un tableau"
        >
          <Table className="h-4 w-4" />
        </Button>
      )}

      <Dialog open={insertOpen} onOpenChange={setInsertOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Insérer un tableau</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="tbl-rows">Lignes</Label>
              <Input
                id="tbl-rows"
                type="number"
                min={1}
                max={20}
                value={rows}
                onChange={(e) => setRows(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tbl-cols">Colonnes</Label>
              <Input
                id="tbl-cols"
                type="number"
                min={1}
                max={20}
                value={cols}
                onChange={(e) => setCols(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInsertOpen(false)}>Annuler</Button>
            <Button onClick={handleInsertTable}>Insérer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

"use client";

/**
 * GroupedDndTable — Composant générique de table avec groupes drag-and-drop.
 *
 * Encapsule le DndContext + SortableContext + boucle d'affichage.
 * Requiert un DndContext externe : utilise les handlers fournis par useGroupedDnd.
 *
 * Usage :
 *   const dnd = useGroupedDnd({ rows, setRows });
 *
 *   <GroupedDndTable
 *     dnd={dnd}
 *     colSpan={13}
 *     renderRow={(row, isLastInGroup) => <SortableTableRow .../>}
 *     emptyMessage="Aucune ligne."
 *   >
 *     <thead>...</thead>
 *   </GroupedDndTable>
 */

import { Fragment } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, FolderOpen, GripVertical, Plus, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { UseGroupedDndReturn, GroupableRow } from "@/hooks/use-grouped-dnd";
import { SortableTbody } from "./sortable-table-row";

// ── EmptyGroupDropZone ────────────────────────────────────────────────────────

function EmptyGroupDropZone({ groupe, colSpan }: { groupe: string; colSpan: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: `__group__${groupe}` });
  return (
    <tbody>
      <tr
        ref={setNodeRef}
        className={cn(
          "transition-colors border-b-2 border-primary/20",
          isOver ? "bg-primary/15 ring-1 ring-inset ring-primary/40" : "bg-primary/3"
        )}
      >
        <td colSpan={colSpan} className="text-center text-muted-foreground/50 italic text-xs py-3">
          {isOver ? "Relâcher pour ajouter au groupe" : "Groupe vide — déposez une ligne ici ou cliquez sur +"}
        </td>
      </tr>
    </tbody>
  );
}

// ── GroupHeader ───────────────────────────────────────────────────────────────

interface GroupHeaderProps {
  id: string;
  name: string;
  colSpan: number;
  collapsed: boolean;
  onToggle: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
  onAddRow: () => void;
  /** Cellules <td> de résumé positionnées après la zone nom pour s'aligner sur les colonnes de montants */
  summaryCells?: React.ReactNode;
  /** Nombre de colonnes allouées à la zone nom (défaut : colSpan - 1) */
  nameColSpan?: number;
}

function GroupHeader({
  id,
  name,
  colSpan,
  collapsed,
  onToggle,
  onRename,
  onDelete,
  onAddRow,
  summaryCells,
  nameColSpan,
}: GroupHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn("bg-primary/5", collapsed ? "border-b-2 border-primary/20" : "border-b border-border")}
    >
      <td className="w-7 py-1.5 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 mx-auto" />
      </td>
      <td colSpan={nameColSpan ?? (colSpan - 2)} className="py-1 px-1.5">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggle}
            type="button"
            className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            title={collapsed ? "Déplier" : "Replier"}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <FolderOpen className="h-3.5 w-3.5 text-primary/60 shrink-0" />
          {editing ? (
            <input
              autoFocus
              className="text-xs font-semibold bg-transparent border-b border-primary outline-none min-w-24 leading-none py-0.5"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => {
                if (draft.trim()) onRename(draft.trim());
                setEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (draft.trim()) onRename(draft.trim());
                  setEditing(false);
                }
                if (e.key === "Escape") {
                  setDraft(name);
                  setEditing(false);
                }
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => { setDraft(name); setEditing(true); }}
              className="text-xs font-semibold text-foreground/80 hover:text-foreground hover:underline decoration-dotted underline-offset-2"
              title="Cliquer pour renommer"
            >  
              {name}
            </button>
          )}
          </div>
      </td>
      {summaryCells}
      <td className="text-center px-1">
        <div className="flex items-center justify-center gap-0.5">
          <button
            type="button"
            onClick={onAddRow}
            className="p-1 text-muted-foreground/40 hover:text-primary hover:bg-primary/10 rounded transition-colors"
            title="Ajouter une ligne dans ce groupe"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-muted-foreground/40 hover:text-destructive transition-colors"
            title="Supprimer le groupe (les lignes deviennent sans groupe)"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── GroupedDndTable ───────────────────────────────────────────────────────────

interface GroupedDndTableProps<T extends GroupableRow> {
  dnd: UseGroupedDndReturn<T>;
  /** Nombre total de colonnes (pour colSpan des headers/zones vides) */
  colSpan: number;
  /** Callback pour ajouter une ligne dans un groupe */
  onAddRowToGroupe: (groupe: string) => void;
  /** Rendu d'une ligne — reçoit la ligne et si c'est la dernière du groupe */
  renderRow: (row: T & { id: string }, isLastInGroup: boolean) => React.ReactNode;
  /** Message quand la table est vide */
  emptyMessage?: string;
  /** Header de table (<thead>) */
  children: React.ReactNode;
  /** Footer de table (<tfoot>) optionnel — affiché quand il y a au moins une ligne */
  footer?: React.ReactNode;
  /** Cellules <td> de résumé de groupe — rendues après la zone nom pour s'aligner sur les colonnes de montants */
  renderGroupSummaryCells?: (groupRows: T[]) => React.ReactNode;
  /** Nombre de colonnes pour la zone nom dans l'en-tête de groupe (défaut : colSpan - 1) */
  groupNameColSpan?: number;
}

export function GroupedDndTable<T extends GroupableRow>({
  dnd,
  colSpan,
  onAddRowToGroupe,
  renderRow,
  emptyMessage = "Aucune ligne. Cliquez sur « Ajouter » pour commencer.",
  children,
  footer,
  renderGroupSummaryCells,
  groupNameColSpan,
}: GroupedDndTableProps<T>) {
  type TWithId = T & { id: string };
  const {
    effectiveRows,
    effectiveGlobalOrder,
    sortableItems,
    activeDragId,
    collapsed,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    toggleCollapse,
    renameGroupe,
    deleteGroupe,
  } = dnd;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  return (
    <div className="overflow-x-auto rounded border border-border">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        autoScroll={false}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <table className="w-full text-sm border-collapse">
          {children}
          {/*
           * Sécurité anti-nesting de groupes :
           * Quand on drag un en-tête de groupe, SortableContext reçoit uniquement
           * effectiveGlobalOrder ("group:X" + lignes libres) — les IDs des membres
           * sont exclus. closestCenter ne peut donc pas retourner un membre comme
           * cible, ce qui empêche l'animation de "drop de groupe dans un groupe".
           */}
          <SortableContext
            items={activeDragId?.startsWith("group:") ? effectiveGlobalOrder : sortableItems}
            strategy={verticalListSortingStrategy}
          >
            {effectiveGlobalOrder.map((key) => {
              if (key.startsWith("group:")) {
                const groupe = key.slice(6);
                const groupRows = effectiveRows
                  .filter((r) => r.groupe === groupe)
                  .sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0)) as TWithId[];
                const isCollapsed = collapsed[groupe] ?? false;
                return (
                  <Fragment key={groupe}>
                    <tbody>
                      <GroupHeader
                        id={`group:${groupe}`}
                        name={groupe}
                        colSpan={colSpan}
                        collapsed={isCollapsed}
                        onToggle={() => toggleCollapse(groupe)}
                        onRename={(newName) => renameGroupe(groupe, newName)}
                        onDelete={() => deleteGroupe(groupe)}
                        onAddRow={() => onAddRowToGroupe(groupe)}
                        summaryCells={renderGroupSummaryCells ? renderGroupSummaryCells(groupRows) : undefined}
                        nameColSpan={groupNameColSpan}
                      />
                    </tbody>
                    {!isCollapsed && groupRows.length > 0 && (
                      <SortableTbody items={groupRows}>
                        {(row, index) => renderRow(row as TWithId, index === groupRows.length - 1)}
                      </SortableTbody>
                    )}
                    {!isCollapsed && groupRows.length === 0 && (
                      <EmptyGroupDropZone groupe={groupe} colSpan={colSpan} />
                    )}
                  </Fragment>
                );
              }
              const row = effectiveRows.find((r) => r.id === key) as TWithId | undefined;
              if (!row) return null;
              return <tbody key={key}>{renderRow(row, false)}</tbody>;
            })}
          </SortableContext>
          {effectiveRows.length === 0 && (
            <tbody>
              <tr>
                <td colSpan={colSpan} className="text-center text-muted-foreground text-xs py-6">
                  {emptyMessage}
                </td>
              </tr>
            </tbody>
          )}
          {effectiveRows.length > 0 && footer}
        </table>
      </DndContext>
    </div>
  );
}

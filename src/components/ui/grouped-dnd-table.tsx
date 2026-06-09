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
 *
 * Exporte aussi :
 *   - GroupSelectorCell — cellule de ligne pour assigner/retirer un groupe via dropdown
 */

import { createContext, Fragment, useContext, useEffect, useRef, useState } from "react";
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
import {
  Check,
  ChevronDown,
  ChevronRight,
  FolderMinus,
  FolderOpen,
  FolderPlus,
  GripVertical,
  Plus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UseGroupedDndReturn, GroupableRow } from "@/hooks/use-grouped-dnd";
import { SortableTbody, useSortableRowContext } from "./sortable-table-row";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── GroupTableContext ─────────────────────────────────────────────────────────

interface GroupTableContextValue {
  groups: string[];
  moveToGroupe: (rowId: string, groupe: string | null) => void;
}

const GroupTableContext = createContext<GroupTableContextValue>({
  groups: [],
  moveToGroupe: () => {},
});

// ── GroupSelectorCell ─────────────────────────────────────────────────────────

/**
 * Cellule exportable à placer dans `renderRow`.
 * Affiche un bouton dropdown permettant d'assigner ou retirer la ligne d'un groupe.
 *
 * Usage dans renderRow :
 *   <GroupSelectorCell currentGroupe={row.groupe ?? null} />
 */
export function GroupSelectorButton({ currentGroupe }: { currentGroupe: string | null | undefined }) {
  const { rowId } = useSortableRowContext();
  const { groups, moveToGroupe } = useContext(GroupTableContext);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState("");

  const handleCreate = () => {
    const name = draft.trim();
    if (name) moveToGroupe(rowId, name);
    setDraft("");
    setCreating(false);
  };

  return (
    <DropdownMenu
        onOpenChange={(open) => {
          if (!open) { setCreating(false); setDraft(""); }
        }}
      >
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title={currentGroupe ? `Groupe : ${currentGroupe}` : "Assigner à un groupe"}
            className={cn(
              "p-1 rounded transition-colors mx-auto flex items-center justify-center",
              currentGroupe
                ? "text-muted-foreground hover:text-primary hover:bg-primary/10"
                : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50"
            )}
          >
            {currentGroupe ? (
              <FolderOpen className="h-3.5 w-3.5" />
            ) : (
              <FolderPlus className="h-3.5 w-3.5" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-44 text-xs">
          {creating ? (
            /* ── Mode création de groupe ── */
            <div
              className="px-2 py-1.5 flex items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <FolderPlus className="h-3 w-3 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                className="text-xs border-b border-primary bg-transparent outline-none flex-1 min-w-0 py-0.5 placeholder:text-muted-foreground/40"
                placeholder="Nom du groupe…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleCreate(); }
                  if (e.key === "Escape") { setCreating(false); setDraft(""); }
                  e.stopPropagation();
                }}
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={!draft.trim()}
                className="p-0.5 text-primary hover:text-primary/80 disabled:opacity-30"
                title="Créer le groupe"
              >
                <Check className="h-3 w-3" />
              </button>
            </div>
          ) : (
            /* ── Mode liste des groupes ── */
            <>
              {groups.map((g) => (
                <DropdownMenuItem
                  key={g}
                  onSelect={() => moveToGroupe(rowId, g)}
                  className={cn("gap-2", currentGroupe === g && "font-semibold text-primary")}
                >
                  <FolderOpen className="h-3 w-3 shrink-0" />
                  {g}
                  {currentGroupe === g && <span className="ml-auto text-muted-foreground/50 text-[10px]">actuel</span>}
                </DropdownMenuItem>
              ))}
              {groups.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onSelect={(e) => { e.preventDefault(); setCreating(true); setDraft(""); }}
                className="gap-2 text-muted-foreground"
              >
                <Plus className="h-3 w-3 shrink-0" />
                Nouveau groupe…
              </DropdownMenuItem>
              {currentGroupe && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() => moveToGroupe(rowId, null)}
                    className="gap-2 text-muted-foreground"
                  >
                    <FolderMinus className="h-3 w-3 shrink-0" />
                    Retirer du groupe
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
  );
}

// ── EmptyGroupDropZone ────────────────────────────────────────────────────────

function EmptyGroupDropZone({ groupe, colSpan }: { groupe: string; colSpan: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: `__group__${groupe}` });
  return (
    <tbody>
      <tr
        ref={setNodeRef}
        className={cn(
          "transition-all border-b-2 border-primary/20",
          isOver
            ? "bg-primary/15 ring-1 ring-inset ring-primary/50"
            : "bg-primary/3"
        )}
      >
        <td
          colSpan={colSpan}
          className={cn(
            "text-center italic text-xs transition-all",
            isOver
              ? "py-5 text-primary/80 font-medium"
              : "py-4 text-muted-foreground/40"
          )}
        >
          {isOver
            ? "↓ Relâcher pour ajouter au groupe"
            : "Groupe vide — déposez une ligne ici ou cliquez sur +"}
        </td>
      </tr>
    </tbody>
  );
}

// ── UngroupDropZone ───────────────────────────────────────────────────────────

function UngroupDropZone({ colSpan }: { colSpan: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: "__ungroup__" });
  return (
    <tbody>
      <tr
        ref={setNodeRef}
        className={cn(
          "transition-all border border-dashed",
          isOver
            ? "bg-orange-50/60 dark:bg-orange-900/15 border-orange-400/60 ring-1 ring-inset ring-orange-400/40"
            : "border-border/40 bg-muted/10"
        )}
      >
        <td
          colSpan={colSpan}
          className={cn(
            "text-center italic text-xs transition-all",
            isOver ? "py-5 text-orange-700 dark:text-orange-300 font-medium" : "py-3 text-muted-foreground/40"
          )}
        >
          {isOver ? "↓ Relâcher pour retirer du groupe" : "Déposer ici pour retirer du groupe"}
        </td>
      </tr>
    </tbody>
  );
}

// ── GroupHeader ───────────────────────────────────────────────────────────────

interface GroupHeaderProps {
  id: string;
  name: string;
  rowCount: number;
  colSpan: number;
  collapsed: boolean;
  isDropTarget: boolean;
  /**
   * État actif déduit des lignes du groupe :
   * `true` = toutes actives, `false` = toutes inactives, `null` = mixte (indéterminé).
   * `undefined` = les lignes n'ont pas de champ actif (checkbox masquée).
   */
  groupActif?: boolean | null;
  onToggle: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
  onAddRow: () => void;
  onToggleActif?: (actif: boolean) => void;
  /** Cellules <td> de résumé positionnées après la zone nom pour s'aligner sur les colonnes de montants */
  summaryCells?: React.ReactNode;
  /** Nombre de colonnes allouées à la zone nom (défaut : colSpan - 1) */
  nameColSpan?: number;
}

function GroupHeader({
  id,
  name,
  rowCount,
  colSpan,
  collapsed,
  isDropTarget,
  groupActif,
  onToggle,
  onRename,
  onDelete,
  onAddRow,
  onToggleActif,
  summaryCells,
  nameColSpan,
}: GroupHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const actifCheckboxRef = useRef<HTMLInputElement>(null);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  useEffect(() => {
    if (actifCheckboxRef.current && groupActif !== undefined) {
      actifCheckboxRef.current.indeterminate = groupActif === null;
    }
  }, [groupActif]);

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-l-2 transition-colors",
        isDropTarget
          ? "bg-primary/20 border-primary/60 ring-1 ring-inset ring-primary/30"
          : "bg-secondary/15 border-primary/15",
        collapsed ? "border-b-2 border-primary/20" : "border-b border-primary/20"
      )}
    >
      <td className="w-7 py-1.5 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 mx-auto" />
      </td>
      {groupActif !== undefined && (
        <td className="w-8 text-center px-0.5">
          <input
            ref={actifCheckboxRef}
            type="checkbox"
            checked={groupActif === true}
            onChange={(e) => onToggleActif?.(e.target.checked)}
            className="h-3.5 w-3.5 cursor-pointer accent-primary"
            title={groupActif === null ? "Mixte — cliquer pour tout activer" : groupActif ? "Désactiver le groupe" : "Activer le groupe"}
          />
        </td>
      )}
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
          <FolderOpen className="h-3.5 w-3.5 text-foreground mr-1 shrink-0" />
          {editing ? (
            <input
              autoFocus
              className="text-sm font-semibold bg-transparent border-b border-primary outline-none min-w-24 leading-none py-0.5"
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
              className="text-sm font-semibold text-foreground hover:text-foreground hover:underline decoration-dotted underline-offset-2"
              title="Cliquer pour renommer"
            >
              {name}
            </button>
          )}
          <span className="text-[10px] text-muted-foreground/50 ml-1">({rowCount})</span>
        </div>
      </td>
      {summaryCells}
      <td className="text-center px-1">
        <div className="flex items-center justify-center gap-0.5">
          <button
            type="button"
            onClick={onAddRow}
            className="p-1 text-muted-foreground/80 hover:text-foreground hover:bg-primary/50 rounded transition-colors"
            title="Ajouter une ligne dans ce groupe"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-muted-foreground/80 hover:text-destructive hover:bg-destructive/50 rounded transition-colors"
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
    activeDragSourceGroupe,
    groups,
    collapsed,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    toggleCollapse,
    renameGroupe,
    deleteGroupe,
    moveToGroupe,
    toggleGroupeActif,
  } = dnd;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Groupe actuellement survolé pendant le drag d'une ligne
  // Utilise effectiveRows (mis à jour par dragState.currentGroupe) pour le highlight
  const dragTargetGroupe = activeDragId && !activeDragId.startsWith("group:")
    ? (effectiveRows.find((r) => r.id === activeDragId)?.groupe ?? null)
    : null;

  // IMPORTANT : utiliser activeDragSourceGroupe (groupe au démarrage du drag, immuable)
  // et NON effectiveRows (qui change dès qu'on survole __ungroup__, ce qui démonterait
  // UngroupDropZone en plein drag et provoquerait un crash dnd-kit).

  return (
    <GroupTableContext.Provider value={{ groups, moveToGroupe }}>
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
          <table className="w-full text-xs border-collapse">
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
                  // Calcul de l'état actif du groupe déduit de ses lignes.
                  // Traite actif===undefined/null comme actif (convention: actif ?? true).
                  // undefined = les lignes n'ont pas de champ actif => checkbox masquée.
                  const hasActifField = groupRows.length > 0 && "actif" in groupRows[0];
                  let groupActif: boolean | null | undefined = undefined;
                  if (hasActifField) {
                    const activeCount = groupRows.filter((r) => (r as GroupableRow & { actif?: boolean | null }).actif !== false).length;
                    if (activeCount === groupRows.length) groupActif = true;
                    else if (activeCount === 0) groupActif = false;
                    else groupActif = null; // mixte
                  }
                  return (
                    <Fragment key={groupe}>
                      <tbody>
                        <GroupHeader
                          id={`group:${groupe}`}
                          name={groupe}
                          rowCount={groupRows.length}
                          colSpan={colSpan}
                          collapsed={isCollapsed}
                          isDropTarget={dragTargetGroupe === groupe}
                          groupActif={groupActif}
                          onToggle={() => toggleCollapse(groupe)}
                          onRename={(newName) => renameGroupe(groupe, newName)}
                          onDelete={() => deleteGroupe(groupe)}
                          onAddRow={() => onAddRowToGroupe(groupe)}
                          onToggleActif={(actif) => toggleGroupeActif(groupe, actif)}
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
                      {!isCollapsed && activeDragSourceGroupe === groupe && (
                        <UngroupDropZone colSpan={colSpan} />
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
    </GroupTableContext.Provider>
  );
}

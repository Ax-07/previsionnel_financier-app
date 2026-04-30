"use client";

/**
 * useGroupedDnd — Hook générique pour le drag-and-drop avec groupes dans un tableau.
 *
 * Gère :
 * - le réordonnancement des lignes dans un groupe
 * - le déplacement de lignes entre groupes (et hors groupe)
 * - le réordonnancement des groupes entre eux et avec les lignes non groupées
 * - la synchronisation de `globalOrder` (flat list "group:X" | rowId)
 * - le marquage `_dirty` sur toutes les lignes affectées
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GroupableRow {
  id?: string | null;
  groupe?: string | null;
  ordre?: number | null;
  _dirty?: boolean;
}

interface DragState {
  id: string;
  sourceGroupe: string | null;
  currentGroupe: string | null;
}

export interface UseGroupedDndOptions<T extends GroupableRow> {
  rows: T[];
  setRows: (updater: (prev: T[]) => T[]) => void;
}

export interface UseGroupedDndReturn<T extends GroupableRow> {
  /** Liste effective des lignes (avec groupe courant pendant le drag) */
  effectiveRows: T[];
  /** Ordre global plat : "group:X" | rowId — utilisé pour la boucle d'affichage */
  effectiveGlobalOrder: string[];
  /** Liste complète pour SortableContext : groupe header + membres + lignes non-groupées */
  sortableItems: string[];
  /** Groupes uniques ordonnés */
  groups: string[];
  /** Lignes sans groupe, ordonnées */
  ungroupedRows: T[];
  /** État collapsed par groupe */
  collapsed: Record<string, boolean>;
  /**
   * ID de l'élément actuellement draggé (`"group:X"` ou rowId), ou `null`.
   * Permet au composant d'adapter le SortableContext selon le type de drag.
   */
  activeDragId: string | null;
  /** Handlers DnD */
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleDragCancel: () => void;
  /** Actions groupes */
  toggleCollapse: (groupe: string) => void;
  renameGroupe: (oldName: string, newName: string) => void;
  deleteGroupe: (groupe: string) => void;
  moveToGroupe: (rowId: string, groupe: string | null) => void;
}

// ─────────────────────────────────────────────────────────────────────────────

export function useGroupedDnd<T extends GroupableRow>({
  rows,
  setRows,
}: UseGroupedDndOptions<T>): UseGroupedDndReturn<T> {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [globalOrder, setGlobalOrder] = useState<string[]>([]);
  const [globalDragOrder, setGlobalDragOrder] = useState<string[] | null>(null);
  // Ref pour lire globalDragOrder dans les handlers sans les recréer à chaque changement
  const globalDragOrderRef = useRef<string[] | null>(null);
  globalDragOrderRef.current = globalDragOrder;
  // Dernier couple (activeId→oKey) traité dans handleDragOver pour les groupes
  // Évite l'oscillation A→B / B→A déclenchée par les re-renders dnd-kit
  const lastGroupMoveRef = useRef<string | null>(null);

  // ── Rows et groupes ─────────────────────────────────────────────────────────

  const effectiveRows = useMemo(() => {
    if (!dragState) return rows;
    return rows.map((r) =>
      r.id === dragState.id ? { ...r, groupe: dragState.currentGroupe } : r
    );
  }, [rows, dragState]);

  const groups = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const r of [...effectiveRows].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0))) {
      if (r.groupe && !seen.has(r.groupe)) {
        seen.add(r.groupe);
        result.push(r.groupe);
      }
    }
    return result;
  }, [effectiveRows]);

  const ungroupedRows = useMemo(
    () => effectiveRows.filter((r) => !r.groupe).sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0)),
    [effectiveRows]
  );

  // ── globalOrder sync ────────────────────────────────────────────────────────

  useEffect(() => {
    setGlobalOrder((prev) => {
      const groupKeys = groups.map((g) => `group:${g}`);
      const rowKeys = ungroupedRows.map((r) => r.id!).filter(Boolean);
      const currentSet = new Set([...groupKeys, ...rowKeys]);
      const kept = prev.filter((k) => currentSet.has(k));
      const keptSet = new Set(kept);
      const added = [...groupKeys, ...rowKeys].filter((k) => !keptSet.has(k));
      // Bail out si rien n'a changé — évite les boucles infinies de re-render
      if (added.length === 0 && kept.length === prev.length) return prev;
      return [...kept, ...added];
    });
  }, [groups, ungroupedRows]);

  const effectiveGlobalOrder = globalDragOrder ?? globalOrder;

  // ── Liste plate complète pour SortableContext (inclut les membres de chaque groupe) ──
  const sortableItems = useMemo(() => {
    const result: string[] = [];
    for (const key of effectiveGlobalOrder) {
      result.push(key);
      if (key.startsWith("group:")) {
        const groupe = key.slice(6);
        const groupRows = effectiveRows
          .filter((r) => r.groupe === groupe)
          .sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
        for (const r of groupRows) {
          if (r.id) result.push(r.id);
        }
      }
    }
    return result;
  }, [effectiveGlobalOrder, effectiveRows]);

  // ── Persistance de l'ordre via le champ `ordre` ─────────────────────────────

  const persistOrder = useCallback(
    (order: string[]) => {
      setRows((prev) => {
        const next = [...prev];
        let idx = 0;
        for (const key of order) {
          if (key.startsWith("group:")) {
            const grp = key.slice(6);
            const grpRows = next
              .filter((r) => r.groupe === grp)
              .sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
            for (const row of grpRows) {
              const i = next.findIndex((r) => r.id === row.id);
              if (i >= 0 && next[i].ordre !== idx) {
                next[i] = { ...next[i], ordre: idx, _dirty: true };
              }
              idx++;
            }
          } else {
            const i = next.findIndex((r) => r.id === key);
            if (i >= 0 && next[i].ordre !== idx) {
              next[i] = { ...next[i], ordre: idx, _dirty: true };
            }
            idx++;
          }
        }
        return next;
      });
    },
    [setRows]
  );

  // ── Handlers DnD ────────────────────────────────────────────────────────────

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = event.active.id as string;
      setActiveDragId(id);
      if (id.startsWith("group:")) {
        setGlobalDragOrder(globalOrder);
        return;
      }
      const row = rows.find((r) => r.id === id);
      if (!row) return;
      setDragState({ id, sourceGroupe: row.groupe ?? null, currentGroupe: row.groupe ?? null });
    },
    [rows, globalOrder]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;
      const activeId = active.id as string;
      const overId = over.id as string;

      // ── Drag d'un groupe ──────────────────────────────────────────────────
      if (activeId.startsWith("group:")) {
        // Lire depuis le ref pour éviter de capturer une valeur périmée ou de
        // recréer le handler à chaque setGlobalDragOrder (ce qui déclenchait
        // une oscillation A→B / B→A en boucle infinie avec dnd-kit).
        const order = globalDragOrderRef.current;
        if (!order) return;
        let oKey: string | undefined;
        if (overId.startsWith("group:")) {
          oKey = overId;
        } else {
          const overRow = effectiveRows.find((r) => r.id === overId);
          if (!overRow) return;
          oKey = overRow.groupe ? `group:${overRow.groupe}` : overId;
        }
        if (!oKey || activeId === oKey) return;
        // Déduplication : skip si même mouvement que la dernière fois.
        // Un re-render dnd-kit peut re-déclencher onDragOver avec le même
        // couple → sans ce guard, l'ordre oscille entre deux états.
        const moveKey = `${activeId}->${oKey}`;
        if (moveKey === lastGroupMoveRef.current) return;
        const oldIdx = order.indexOf(activeId);
        const newIdx = order.indexOf(oKey);
        if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;
        lastGroupMoveRef.current = moveKey;
        setGlobalDragOrder(arrayMove(order, oldIdx, newIdx));
        return;
      }

      // ── Drag d'une ligne ─────────────────────────────────────────────────
      if (!dragState || activeId === overId) return;
      let targetGroupe: string | null;
      if (overId.startsWith("__group__")) {
        targetGroupe = overId.slice(9);
      } else {
        const overRow = effectiveRows.find((r) => r.id === overId);
        if (!overRow) return;
        targetGroupe = overRow.groupe ?? null;
      }
      if (dragState.currentGroupe !== targetGroupe) {
        setDragState((s) => (s ? { ...s, currentGroupe: targetGroupe } : null));
      }
    },
    // globalDragOrder retiré des deps : lu via ref pour éviter la récréation
    // du handler et l'oscillation infinie lors du drag de groupe.
    [dragState, effectiveRows]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      lastGroupMoveRef.current = null;
      const { active, over } = event;
      const activeId = active.id as string;

      // ── Fin de drag d'un groupe ──────────────────────────────────────────
      if (activeId.startsWith("group:")) {
        const finalOrder = globalDragOrderRef.current ?? globalOrder;
        setActiveDragId(null);
        setGlobalOrder(finalOrder);
        setGlobalDragOrder(null);
        persistOrder(finalOrder);
        return;
      }

      // ── Fin de drag d'une ligne ──────────────────────────────────────────
      const saved = dragState;
      setActiveDragId(null);
      setDragState(null);
      if (!saved) return;

      // Changement de groupe
      if (saved.sourceGroupe !== saved.currentGroupe) {
        setRows((prev) =>
          prev.map((r) =>
            r.id === saved.id ? { ...r, groupe: saved.currentGroupe, _dirty: true } : r
          )
        );
        return;
      }

      if (!over || active.id === over.id) return;
      const overId = over.id as string;
      const activeRow = rows.find((r) => r.id === activeId);
      if (!activeRow) return;

      // Ligne non groupée → réordonnancement via globalOrder
      if (!activeRow.groupe) {
        const overRow = rows.find((r) => r.id === overId);
        const overKey = overId.startsWith("group:")
          ? overId
          : overRow?.groupe
          ? `group:${overRow.groupe}`
          : overId;
        const oldIdx = globalOrder.indexOf(activeId);
        const newIdx = globalOrder.indexOf(overKey);
        if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;
        const newGlobalOrder = arrayMove(globalOrder, oldIdx, newIdx);
        setGlobalOrder(newGlobalOrder);
        persistOrder(newGlobalOrder);
        return;
      }

      // Ligne groupée → réordonnancement dans son groupe
      const overRow = rows.find((r) => r.id === overId);
      if (!overRow || activeRow.groupe !== overRow.groupe) return;
      const groupRows = rows
        .filter((r) => r.groupe === activeRow.groupe)
        .sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
      const oldIdx = groupRows.findIndex((r) => r.id === activeId);
      const newIdx = groupRows.findIndex((r) => r.id === overId);
      if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;
      const reordered = arrayMove(groupRows, oldIdx, newIdx);
      setRows((prev) =>
        prev.map((r) => {
          const newI = reordered.findIndex((rr) => rr.id === r.id);
          if (newI === -1) return r;
          return { ...r, ordre: newI, _dirty: true };
        })
      );
    },
    [dragState, rows, setRows, persistOrder, globalOrder]
  );

  const handleDragCancel = useCallback(() => {
    lastGroupMoveRef.current = null;
    setActiveDragId(null);
    setDragState(null);
    setGlobalDragOrder(null);
  }, []);

  // ── Actions groupes ─────────────────────────────────────────────────────────

  const toggleCollapse = useCallback((groupe: string) => {
    setCollapsed((prev) => ({ ...prev, [groupe]: !(prev[groupe] ?? false) }));
  }, []);

  const renameGroupe = useCallback(
    (oldName: string, newName: string) => {
      if (oldName === newName) return;
      setRows((prev) =>
        prev.map((r) => (r.groupe === oldName ? { ...r, groupe: newName, _dirty: true } : r))
      );
      setCollapsed((prev) => {
        const { [oldName]: val, ...rest } = prev;
        return { ...rest, [newName]: val };
      });
      setGlobalOrder((prev) =>
        prev.map((k) => (k === `group:${oldName}` ? `group:${newName}` : k))
      );
    },
    [setRows]
  );

  const deleteGroupe = useCallback(
    (groupe: string) => {
      setRows((prev) =>
        prev.map((r) => (r.groupe === groupe ? { ...r, groupe: null, _dirty: true } : r))
      );
      setCollapsed((prev) => {
        const next = { ...prev };
        delete next[groupe];
        return next;
      });
    },
    [setRows]
  );

  const moveToGroupe = useCallback(
    (rowId: string, groupe: string | null) => {
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, groupe, _dirty: true } : r))
      );
    },
    [setRows]
  );

  // Mémoïser l'objet retourné pour éviter que GroupedDndTable reçoive une
  // nouvelle référence à chaque render du composant parent, ce qui propagerait
  // des re-renders inutiles dans tous les enfants dnd-kit.
  return useMemo(
    () => ({
      effectiveRows,
      effectiveGlobalOrder,
      sortableItems,
      groups,
      ungroupedRows,
      collapsed,
      activeDragId,
      handleDragStart,
      handleDragOver,
      handleDragEnd,
      handleDragCancel,
      toggleCollapse,
      renameGroupe,
      deleteGroupe,
      moveToGroupe,
    }),
    [
      effectiveRows, effectiveGlobalOrder, sortableItems, groups, ungroupedRows,
      collapsed, activeDragId, handleDragStart, handleDragOver, handleDragEnd,
      handleDragCancel, toggleCollapse, renameGroupe, deleteGroupe, moveToGroupe,
    ]
  );
}

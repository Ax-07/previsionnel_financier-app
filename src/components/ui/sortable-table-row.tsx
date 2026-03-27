"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { DraggableSyntheticListeners } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";

// ── Contexte partagé entre SortableTableRow et DragHandleCell ────────────────

interface SortableRowContextValue {
  attributes: React.HTMLAttributes<HTMLElement>;
  listeners: DraggableSyntheticListeners;
}

const SortableRowContext = React.createContext<SortableRowContextValue>({
  attributes: {},
  listeners: undefined,
});

// ── SortableTableRow ─────────────────────────────────────────────────────────

interface SortableTableRowProps {
  id: string;
  className?: string;
  children: React.ReactNode;
}

export function SortableTableRow({ id, className, children }: SortableTableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <SortableRowContext.Provider value={{ attributes, listeners }}>
      <tr ref={setNodeRef} style={style} className={className}>
        {children}
      </tr>
    </SortableRowContext.Provider>
  );
}

// ── DragHandleCell ────────────────────────────────────────────────────────────

export function DragHandleCell() {
  const { attributes, listeners } = React.useContext(SortableRowContext);
  return (
    <td
      className="w-7 py-1.5 cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 mx-auto" />
    </td>
  );
}

// ── SortableTbody ─────────────────────────────────────────────────────────────

interface SortableTbodyProps<T extends { id: string }> {
  items: T[];
  children: (row: T, index: number) => React.ReactNode;
}

export function SortableTbody<T extends { id: string }>({
  items,
  children,
}: SortableTbodyProps<T>) {
  return <tbody>{items.map((item, index) => children(item, index))}</tbody>;
}

"use client";

import { useCallback, useState } from "react";
import type { CSSProperties } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Constantes de largeur ────────────────────────────────────────────────────
// Source unique de vérité pour toutes les largeurs de colonnes (mensuelles et annuelles).

/** Largeurs des colonnes des onglets mensuels (budget, trésorerie, TVA). */
export const COL_WIDTHS = {
  label: "15.5rem",
  month: "4.75rem",
  total: "5rem",
} as const;

/** Largeurs rem des colonnes des onglets annuels. */
export const ANNUAL_REM = {
  label: "15.5rem",
  amtSm: "7.5rem",
  pct: "4.25rem",
  amtLg: "8.75rem",
  amtMd: "8.125rem",
  value: "11.25rem",
} as const;

/**
 * Calcule le `minWidth` CSS d'un tableau annuel.
 * @param yearCount - Nombre d'exercices (3 ou 4)
 * @param amtRem - Largeur de la colonne montant
 * @param pctRem - Largeur optionnelle de la colonne %
 */
export function annualTableMinWidth(yearCount: number, amtRem: string, pctRem?: string): string {
  const colExpr = pctRem ? `(${amtRem} + ${pctRem})` : amtRem;
  return `calc(${ANNUAL_REM.label} + ${yearCount} * ${colExpr})`;
}

// ── Types de colonne ──────────────────────────────────────────────────────────
// Union unique couvrant colonnes mensuelles ET annuelles.

export type ColType =
  | "label"   // libellé (1ère colonne, largeur flexible)
  | "month"   // mois (mensuels — largeur via CSS var)
  | "total"   // total (mensuels — largeur via CSS var)
  | "amtSm"   // montant + colonne % adjacente (CR, SIG, synthèse, seuil)
  | "amtLg"   // montant seul (CAF, BFR, bilan)
  | "amtMd"   // montant compact (TF, PF)
  | "pct"     // pourcentage (CR, SIG, synthèse, seuil)
  | "value";  // valeur (ratios)

/** Map colType → CSSProperties de largeur (width + minWidth). */
const COL_WIDTH_STYLE: Partial<Record<ColType, CSSProperties>> = {
  month: { width: `var(--ctrl-col-month)`, minWidth: `var(--ctrl-col-month)` },
  total: { width: `var(--ctrl-col-total)`, minWidth: `var(--ctrl-col-total)` },
  amtSm: { width: ANNUAL_REM.amtSm, minWidth: ANNUAL_REM.amtSm },
  amtLg: { width: ANNUAL_REM.amtLg, minWidth: ANNUAL_REM.amtLg },
  amtMd: { width: ANNUAL_REM.amtMd, minWidth: ANNUAL_REM.amtMd },
  pct:   { width: ANNUAL_REM.pct,   minWidth: ANNUAL_REM.pct },
  value: { width: ANNUAL_REM.value, minWidth: ANNUAL_REM.value },
};

// ── CVA — Variantes de ligne ─────────────────────────────────────────────────

export type RowStyle =
  | "normal"
  | "indent"
  | "section"
  | "subtotal"
  | "total"
  | "result"
  | "highlight"
  | "separator"
  | "caf";

export const rowVariants = cva("group h-9 border-b transition-colors", {
  variants: {
    variant: {
      default:   "hover:bg-muted/50",
      normal:    "italic hover:bg-muted/50",
      indent:    "bg-muted/10 hover:bg-muted/20",
      section:   "bg-secondary/50 hover:bg-secondary/60 text-primary-foreground font-bold uppercase tracking-wide text-xs",
      subtotal:  "bg-secondary/10 hover:bg-secondary/20 font-medium",
      total:     "bg-secondary/30 hover:bg-secondary/40 font-semibold",
      result:    "bg-highlight/10 hover:bg-highlight/20 font-bold text-highlight-foreground",
      highlight: "bg-highlight/30 hover:bg-highlight/40 font-bold text-highlight-foreground",
      separator: "h-3 border-b-0",
      caf:       "bg-emerald-500/20 font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/30",
    },
  },
  defaultVariants: { variant: "default" },
});

// ── CVA — Variantes de cellule d'en-tête ─────────────────────────────────────

export const headVariants = cva("px-3 py-2 font-semibold", {
  variants: {
    colType: {
      label: "text-left text-sm",
      month: "text-center tabular-nums",
      total: "text-center tabular-nums",
      amtSm: "text-center tabular-nums",
      amtLg: "text-center tabular-nums",
      amtMd: "text-center tabular-nums",
      pct:   "text-center tabular-nums",
      value: "text-center tabular-nums",
    },
  },
  defaultVariants: { colType: "label" },
});

// ── CVA — Variantes de cellule de données ────────────────────────────────────

export const cellVariants = cva("px-3 py-1.5 tabular-nums", {
  variants: {
    colType: {
      label: "text-left text-sm",
      month: "text-right text-xs",
      total: "text-right text-xs",
      amtSm: "text-right text-xs",
      amtLg: "text-right text-xs",
      amtMd: "text-right text-xs",
      pct:   "text-right text-xs",
      value: "text-right text-xs",
    },
    negative: {
      true: "text-destructive",
    },
  },
  defaultVariants: { colType: "label" },
});

// Le style tag injecte le CSS hover-colonne (:has) co-localisé ici.
// React 19 déduplique automatiquement les <style href=...> identiques.

const COLUMN_HOVER_CSS =
  Array.from({ length: 13 }, (_, i) => i + 2)
    .map(
      (n) =>
        `[data-slot="control-tab-table"]:has(td:nth-child(${n}):hover) :is(td,th):nth-child(${n})`,
    )
    .join(",\n") +
  " {\n  background-color: color-mix(in oklab, var(--color-muted) 30%, transparent);\n}";

// ── Hook gestion des lignes dépliables ──────────────────────────────────────
// Remplace useExpandedKeys + les useState/collapsed locaux des 3 tabs mensuels.
// mode "expanded" : Set stocke les clés DÉPLIÉES (rien déplié par défaut).
// mode "collapsed" : Set stocke les clés REPLIÉES (initialKeys = collectées par défaut).

export function useExpandableRows({
  mode = "expanded",
  initialKeys,
}: {
  mode?: "expanded" | "collapsed";
  initialKeys?: Iterable<string>;
} = {}) {
  const [keys, setKeys] = useState<Set<string>>(() => new Set(initialKeys ?? []));

  const toggle = useCallback((key: string) => {
    setKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const isExpanded = useCallback(
    (key: string) => (mode === "expanded" ? keys.has(key) : !keys.has(key)),
    [keys, mode],
  );

  const expandAll = useCallback(
    (allKeys: Iterable<string>) => {
      setKeys(mode === "expanded" ? new Set(allKeys) : new Set());
    },
    [mode],
  );

  const collapseAll = useCallback(() => {
    setKeys(mode === "expanded" ? new Set() : new Set(initialKeys ?? []));
  }, [mode, initialKeys]);

  return { isExpanded, toggle, expandAll, collapseAll } as const;
}

// ── Contenu de la cellule libellé ────────────────────────────────────────────
// Bouton plier/déplier + icône + texte du libellé.
// À placer comme enfant d'un <ControlTabTableCell colType="label">.

interface ControlTabLabelCellProps {
  label: string;
  style?: RowStyle;
  /** Signe arithmétique affiché avant le libellé (ex: "+", "−", "=") */
  sign?: string;
  /** Niveau d'imbrication : depth > 0 → texte en italic + text-muted-foreground */
  depth?: number;
  hasChildren?: boolean;
  isExpanded?: boolean;
  /** Callback sans argument — lier la clé dans le composant parent. */
  onToggle?: () => void;
}

export const ControlTabLabelCell: React.FC<ControlTabLabelCellProps> = ({
  label,
  style,
  sign,
  depth = 0,
  hasChildren = false,
  isExpanded = false,
  onToggle,
}) => {
  const isSection = style === "section";
  const isHighlight = style === "highlight";
  const showToggle = hasChildren && !isSection && !!onToggle;
  const isChild = depth > 0;

  return (
    <div className="flex items-center gap-1.5">
      {showToggle ? (
        <button
          type="button"
          onClick={onToggle}
          className="flex shrink-0 items-center rounded p-0.5 transition-colors"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Replier" : "Déplier"}
        >
          {isExpanded
            ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
      ) : (
        <span className="w-5 shrink-0" />
      )}
      {sign && (
        <span
          className={cn(
            "shrink-0 font-mono text-xs tabular-nums w-3 text-center",
            isHighlight ? "text-highlight-foreground/70" : "text-muted-foreground",
          )}
        >
          {sign}
        </span>
      )}
      <span
        className={cn(
          "truncate leading-tight",
          isSection && "text-xs",
          (isChild || style === "indent") && "text-muted-foreground italic",
        )}
      >
        {label}
      </span>
    </div>
  );
};

// ── Table ─────────────────────────────────────────────────────────────────────

export const ControlTabTable: React.FC<React.ComponentProps<"table">> = ({ className, style, ...props }) => (
  <>
    <style precedence="default" href="control-tab-table-col-hover">{COLUMN_HOVER_CSS}</style>
    <table
      data-slot="control-tab-table"
      className={cn("border-collapse", className)}
      style={{
        tableLayout: "fixed",
        width: "100%",
        "--ctrl-col-label": COL_WIDTHS.label,
        "--ctrl-col-month": COL_WIDTHS.month,
        "--ctrl-col-total": COL_WIDTHS.total,
        ...style,
      } as React.CSSProperties}
      {...props}
    />
  </>
);

// ── Thead ─────────────────────────────────────────────────────────────────────

export const ControlTabTableHeader: React.FC<React.ComponentProps<"thead">> = ({ className, ...props }) => (
  <thead
    data-slot="control-tab-table-header"
    className={cn("sticky top-0 z-20 bg-primary text-white text-xs font-semibold", className)}
    {...props}
  />
);

// ── Tbody ─────────────────────────────────────────────────────────────────────

export const ControlTabTableBody: React.FC<React.ComponentProps<"tbody">> = (props) => (
  <tbody
    data-slot="control-tab-table-body"
    {...props}
  />
);

// ── Tr ────────────────────────────────────────────────────────────────────────

interface ControlTabTableRowProps
  extends React.ComponentProps<"tr">,
    VariantProps<typeof rowVariants> {
  /** Niveau d'imbrication : depth > 0 → toute la ligne en text-muted-foreground italic */
  depth?: number;
}

export const ControlTabTableRow: React.FC<ControlTabTableRowProps> = ({
  className,
  variant,
  depth,
  ...props
}) => (
  <tr
    data-slot="control-tab-table-row"
    className={cn(
      rowVariants({ variant }),
      depth !== undefined && depth > 0 && "text-muted-foreground italic",
      className,
    )}
    {...props}
  />
);

// ── Th ────────────────────────────────────────────────────────────────────────

interface ControlTabTableHeadProps
  extends React.ComponentProps<"th">,
    VariantProps<typeof headVariants> {
  /** Ajoute sticky left-0 z-30 (colonne libellé en-tête) */
  sticky?: boolean;
}

export const ControlTabTableHead: React.FC<ControlTabTableHeadProps> = ({
  sticky,
  colType,
  className,
  style,
  ...props
}) => (
  <th
    data-slot="control-tab-table-head"
    className={cn(
      headVariants({ colType }),
      sticky && "sticky left-0 z-30",
      className,
    )}
    style={{ ...COL_WIDTH_STYLE[colType ?? "label"], ...style }}
    {...props}
  />
);

// ── Td ────────────────────────────────────────────────────────────────────────

interface ControlTabTableCellProps
  extends React.ComponentProps<"td">,
    VariantProps<typeof cellVariants> {
  /** Ajoute sticky left-0 z-10 (colonne libellé données) */
  sticky?: boolean;
  /** Indentation en niveaux (chaque niveau = 20px + base 12px) */
  depth?: number;
}

export const ControlTabTableCell: React.FC<ControlTabTableCellProps> = ({
  sticky,
  depth,
  colType,
  negative,
  className,
  style,
  ...props
}) => {
  const paddingLeft = depth !== undefined && depth > 0 ? depth * 20 + 12 : undefined;
  return (
    <td
      data-slot="control-tab-table-cell"
      className={cn(
        cellVariants({ colType, negative }),
        sticky && "sticky left-0 z-10",
        className,
      )}
      style={{
        ...COL_WIDTH_STYLE[colType ?? "label"],
        ...(paddingLeft !== undefined ? { paddingLeft } : {}),
        ...style,
      }}
      {...props}
    />
  );
};

// ── Bandeau de section ────────────────────────────────────────────────────────
// Ligne pleine largeur colorée bg-primary utilisée par BFR, Bilan, TF, PF.

interface SectionBannerRowProps {
  label: string;
  colSpan: number;
}

export function SectionBannerRow({ label, colSpan }: SectionBannerRowProps) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="border-b bg-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground"
      >
        {label}
      </td>
    </tr>
  );
}
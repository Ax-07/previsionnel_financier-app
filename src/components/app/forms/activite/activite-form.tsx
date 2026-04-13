"use client";

/**
 * Onglet Activités – 4 tableaux éditables inline
 * - Chiffre d'affaires
 * - Activités commissionnées
 * - Production immobilisée
 * - Subventions d'exploitation
 */

import { useCallback, useEffect, useTransition, useState } from "react";
import { toast } from "sonner";
import { Trash2, Plus, Save, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, numVal } from "@/lib/utils";

import {
  type ActiviteRow,
  type ActiviteCommissionRow,
  type ProductionImmobiliseeRow,
  type SubventionExploitationRow,
  SECTEURS_ACTIVITE,
  HYPOTHESES_ACTIVITE,
  TAUX_TVA_OPTIONS,
  MODES_CALCUL_COMMISSION,
} from "@/lib/schemas/activite";

import { useActiviteStore } from "@/stores/activite-store";
import { DetailActiviteDialog } from "@/components/app/forms/activite/detail-activite-dialog";
import { saveActivites, saveActivitesCommission, saveProductionsImmobilisees, saveSubventionsExploitation } from "@/app/actions/activite";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";

// ── Helpers ──────────────────────────────────────────────────────────────────

const cellInput =
  "h-7 w-full border-0 bg-transparent px-1 text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none min-w-0";

const cellSelect =
  "h-7 w-full border-0 bg-transparent px-1 text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none cursor-pointer";

function intVal(v: string): number {
  const n = parseInt(v, 10);
  return isNaN(n) ? 0 : n;
}

// ── Composants utilitaires ───────────────────────────────────────────────────

function SectionHeader({
  title,
  description,
  isDirty,
  isSaving,
  onAdd,
  onSave,
}: {
  title: string;
  description?: string;
  isDirty: boolean;
  isSaving: boolean;
  onAdd: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-3 border-b">
      <div>
        <h3 className="text-base font-semibold leading-snug">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {isDirty && (
          <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs gap-1">
            Modifications non enregistrées
          </Badge>
        )}
        {isDirty && (
          <Button
            size="sm"
            variant="default"
            className="h-7 gap-1 text-xs"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Enregistrer
          </Button>
        )}
        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={onAdd}>
          <Plus className="h-3 w-3" />
          Ajouter
        </Button>
      </div>
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-2 py-1.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap",
        className
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={cn("px-0 py-0 align-middle", className)}>{children}</td>
  );
}

// ── Tableau Activités (Chiffre d'affaires) ───────────────────────────────────

function TableauActivites({
  dossierId,
  rows,
  onUpdate,
  onRemove,
  dateDebutExerciceN,
  exercices,
}: {
  dossierId: string;
  rows: ActiviteRow[];
  onUpdate: (i: number, data: Partial<ActiviteRow>) => void;
  onRemove: (i: number) => void;
  dateDebutExerciceN?: string;
  exercices?: Array<{ dateCloture: string; duree: number; annee: number }>;
}) {
  const [detailIdx, setDetailIdx] = useState<number | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-muted/50">
            <tr>
              <Th className="w-8">#</Th>
              <Th className="w-8 text-center">Actif</Th>
              <Th className="min-w-40">Libellé</Th>
              <Th className="w-28">Secteur</Th>
              <Th className="w-24">Hypothèse</Th>
              <Th className="w-8 text-center">Détail</Th>
              <Th className="w-24 text-center">N</Th>
              <Th className="w-14 text-center">% Év.</Th>
              <Th className="w-24 text-center">N+1</Th>
              <Th className="w-14 text-center">% Év.</Th>
              <Th className="w-24 text-center">N+2</Th>
              <Th className="w-16 text-center">Tx marge</Th>
              <Th className="w-14 text-center">Stocks</Th>
              <Th className="w-14 text-center">Règl. client</Th>
              <Th className="w-16 text-center">TVA ventes</Th>
              <Th className="w-14 text-center">Règl. fournisseur</Th>
              <Th className="w-16 text-center">TVA achats</Th>
              <Th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={18}
                  className="text-center text-muted-foreground text-xs py-6"
                >
                  Aucune activité — cliquez sur « Ajouter »
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={i}
                  className={cn(
                    "border-t border-border bg-background hover:bg-muted/30 transition-colors",
                    !(row.actif ?? true) && "opacity-50"
                  )}
                >
                  <Td className="text-center text-xs text-muted-foreground px-1">
                    {i + 1}
                  </Td>
                  <Td className="text-center px-1">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 cursor-pointer accent-primary"
                      checked={row.actif ?? true}
                      onChange={(e) => onUpdate(i, { actif: e.target.checked })}
                    />
                  </Td>
                  <Td>
                    <input
                      className={cellInput}
                      value={row.libelle}
                      placeholder="Libellé"
                      onChange={(e) => onUpdate(i, { libelle: e.target.value })}
                    />
                  </Td>
                  <Td>
                    <select
                      className={cellSelect}
                      value={row.secteur}
                      onChange={(e) =>
                        onUpdate(i, {
                          secteur: e.target.value as ActiviteRow["secteur"],
                        })
                      }
                    >
                      {SECTEURS_ACTIVITE.map((s) => (
                        <option
                          key={s.value}
                          value={s.value}
                          className="bg-background text-foreground"
                        >
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </Td>
                  <Td>
                    <select
                      className={cellSelect}
                      value={row.hypothese}
                      onChange={(e) =>
                        onUpdate(i, {
                          hypothese: e.target.value as ActiviteRow["hypothese"],
                        })
                      }
                    >
                      {HYPOTHESES_ACTIVITE.map((h) => (
                        <option
                          key={h.value}
                          value={h.value}
                          className="bg-background text-foreground"
                        >
                          {h.label}
                        </option>
                      ))}
                    </select>
                  </Td>
                  <Td className="text-center px-1">
                    <button
                      type="button"
                      className="p-1 text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => setDetailIdx(i)}
                      title="Détails de l'activité"
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </button>
                  </Td>
                  <Td>
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN === 0 ? "" : row.montantN}
                      placeholder="0"
                      onChange={(e) => {
                        const n = numVal(e.target.value);
                        const n1 = parseFloat((n * (1 + row.evolutionN1 / 100)).toFixed(2));
                        const n2 = parseFloat((n1 * (1 + row.evolutionN2 / 100)).toFixed(2));
                        onUpdate(i, { montantN: n, montantN1: n1, montantN2: n2 });
                      }}
                    />
                  </Td>
                  <Td>
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={row.evolutionN1 === 0 ? "" : row.evolutionN1}
                      placeholder="0"
                      onChange={(e) => {
                        const ev1 = numVal(e.target.value);
                        const n1 = parseFloat((row.montantN * (1 + ev1 / 100)).toFixed(2));
                        const n2 = parseFloat((n1 * (1 + row.evolutionN2 / 100)).toFixed(2));
                        onUpdate(i, { evolutionN1: ev1, montantN1: n1, montantN2: n2 });
                      }}
                    />
                  </Td>
                  <Td>
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN1 === 0 ? "" : row.montantN1}
                      placeholder="0"
                      title="Saisie directe → taux calculé / Taux 'évol. → montant calculé"
                      onChange={(e) => {
                        const n1 = numVal(e.target.value);
                        const ev1 = row.montantN > 0
                          ? parseFloat(((n1 / row.montantN - 1) * 100).toFixed(2))
                          : 0;
                        const n2 = parseFloat((n1 * (1 + row.evolutionN2 / 100)).toFixed(2));
                        onUpdate(i, { montantN1: n1, evolutionN1: ev1, montantN2: n2 });
                      }}
                    />
                  </Td>
                  <Td>
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={row.evolutionN2 === 0 ? "" : row.evolutionN2}
                      placeholder="0"
                      onChange={(e) => {
                        const ev2 = numVal(e.target.value);
                        const n2 = parseFloat((row.montantN1 * (1 + ev2 / 100)).toFixed(2));
                        onUpdate(i, { evolutionN2: ev2, montantN2: n2 });
                      }}
                    />
                  </Td>
                  <Td>
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={row.montantN2 === 0 ? "" : row.montantN2}
                      placeholder="0"
                      title="Saisie directe → taux calculé / Taux 'évol. → montant calculé"
                      onChange={(e) => {
                        const n2 = numVal(e.target.value);
                        const ev2 = row.montantN1 > 0
                          ? parseFloat(((n2 / row.montantN1 - 1) * 100).toFixed(2))
                          : 0;
                        onUpdate(i, { montantN2: n2, evolutionN2: ev2 });
                      }}
                    />
                  </Td>
                  <Td>
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={row.tauxMarge === 0 ? "" : row.tauxMarge}
                      placeholder="0"
                      onChange={(e) =>
                        onUpdate(i, { tauxMarge: numVal(e.target.value) })
                      }
                    />
                  </Td>
                  <Td>
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={row.stocks === 0 ? "" : (row.stocks ?? "")}
                      placeholder="0"
                      onChange={(e) =>
                        onUpdate(i, { stocks: intVal(e.target.value) })
                      }
                    />
                  </Td>
                  <Td>
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={
                        row.reglementClients === 0
                          ? ""
                          : (row.reglementClients ?? "")
                      }
                      placeholder="0"
                      onChange={(e) =>
                        onUpdate(i, {
                          reglementClients: intVal(e.target.value),
                        })
                      }
                    />
                  </Td>
                  <Td>
                    <select
                      className={cellSelect}
                      value={row.tvaVentes}
                      onChange={(e) =>
                        onUpdate(i, { tvaVentes: numVal(e.target.value) })
                      }
                    >
                      {TAUX_TVA_OPTIONS.map((t) => (
                        <option
                          key={t.value}
                          value={t.value}
                          className="bg-background text-foreground"
                        >
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </Td>
                  <Td>
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={
                        row.reglementFournisseurs === 0
                          ? ""
                          : (row.reglementFournisseurs ?? "")
                      }
                      placeholder="0"
                      onChange={(e) =>
                        onUpdate(i, {
                          reglementFournisseurs: intVal(e.target.value),
                        })
                      }
                    />
                  </Td>
                  <Td>
                    <select
                      className={cellSelect}
                      value={row.tvaAchats}
                      onChange={(e) =>
                        onUpdate(i, { tvaAchats: numVal(e.target.value) })
                      }
                    >
                      {TAUX_TVA_OPTIONS.map((t) => (
                        <option
                          key={t.value}
                          value={t.value}
                          className="bg-background text-foreground"
                        >
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </Td>
                  <Td className="text-center px-1">
                    <button
                      type="button"
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => onRemove(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="border-t-2 border-border bg-muted/30">
              <tr>
                <td colSpan={6} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
                  Total (actifs)
                </td>
                <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                  {rows.filter(r => r.actif ?? true).reduce((s, r) => s + r.montantN, 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}
                </td>
                <td />
                <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                  {rows.filter(r => r.actif ?? true).reduce((s, r) => s + r.montantN1, 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}
                </td>
                <td />
                <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                  {rows.filter(r => r.actif ?? true).reduce((s, r) => s + r.montantN2, 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}
                </td>
                <td colSpan={7} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {detailIdx !== null && (
        <DetailActiviteDialog
          open={detailIdx !== null}
          onOpenChange={(open) => { if (!open) setDetailIdx(null); }}
          dossierId={dossierId}
          activiteIndex={detailIdx}
          dateDebutExerciceN={dateDebutExerciceN}
          exercices={exercices}
        />
      )}
    </>
  );
}

// ── Tableau Activités commissionnées ─────────────────────────────────────────

function TableauActivitesCommissions({
  rows,
  onUpdate,
  onRemove,
}: {
  rows: ActiviteCommissionRow[];
  onUpdate: (i: number, data: Partial<ActiviteCommissionRow>) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-muted/50">
          <tr>
            <Th className="w-8">#</Th>
            <Th className="w-8 text-center">Actif</Th>
            <Th className="min-w-40">Libellé</Th>
            <Th className="w-24">Hypothèse</Th>
            <Th className="w-24 text-right">N</Th>
            <Th className="w-14 text-right">% Év.</Th>
            <Th className="w-24 text-right">N+1</Th>
            <Th className="w-14 text-right">% Év.</Th>
            <Th className="w-24 text-right">N+2</Th>
            <Th className="w-20">Calc. Comm.</Th>
            <Th className="w-16 text-right">% Comm.</Th>
            <Th className="w-16 text-right">TVA Comm.</Th>
            <Th className="w-14 text-right">Stocks</Th>
            <Th className="w-14 text-right">Règl. fo.</Th>
            <Th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={15}
                className="text-center text-muted-foreground text-xs py-6"
              >
                Aucune activité commissionnée — cliquez sur « Ajouter »
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={i}
                className={cn(
                  "border-t border-border bg-background hover:bg-muted/30 transition-colors",
                  !(row.actif ?? true) && "opacity-50"
                )}
              >
                <Td className="text-center text-xs text-muted-foreground px-1">
                  {i + 1}
                </Td>
                <Td className="text-center px-1">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 cursor-pointer accent-primary"
                    checked={row.actif ?? true}
                    onChange={(e) => onUpdate(i, { actif: e.target.checked })}
                  />
                </Td>
                <Td>
                  <input
                    className={cellInput}
                    value={row.libelle}
                    placeholder="Libellé"
                    onChange={(e) => onUpdate(i, { libelle: e.target.value })}
                  />
                </Td>
                <Td>
                  <select
                    className={cellSelect}
                    value={row.hypothese}
                    onChange={(e) =>
                      onUpdate(i, {
                        hypothese:
                          e.target.value as ActiviteCommissionRow["hypothese"],
                      })
                    }
                  >
                    {HYPOTHESES_ACTIVITE.map((h) => (
                      <option
                        key={h.value}
                        value={h.value}
                        className="bg-background text-foreground"
                      >
                        {h.label}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td>
                  <input
                    type="number"
                    className={cn(cellInput, "text-right")}
                    value={row.montantN === 0 ? "" : row.montantN}
                    placeholder="0"
                    onChange={(e) => {
                      const n = numVal(e.target.value);
                      const n1 = parseFloat((n * (1 + row.evolutionN1 / 100)).toFixed(2));
                      const n2 = parseFloat((n1 * (1 + row.evolutionN2 / 100)).toFixed(2));
                      onUpdate(i, { montantN: n, montantN1: n1, montantN2: n2 });
                    }}
                  />
                </Td>
                <Td>
                  <input
                    type="number"
                    className={cn(cellInput, "text-right")}
                    value={row.evolutionN1 === 0 ? "" : row.evolutionN1}
                    placeholder="0"
                    onChange={(e) => {
                      const ev1 = numVal(e.target.value);
                      const n1 = parseFloat((row.montantN * (1 + ev1 / 100)).toFixed(2));
                      const n2 = parseFloat((n1 * (1 + row.evolutionN2 / 100)).toFixed(2));
                      onUpdate(i, { evolutionN1: ev1, montantN1: n1, montantN2: n2 });
                    }}
                  />
                </Td>
                <Td>
                  <input
                    type="number"
                    className={cn(cellInput, "text-right bg-muted/40")}
                    value={row.montantN1 === 0 ? "" : row.montantN1}
                    readOnly
                    tabIndex={-1}
                    placeholder="0"
                    title="Calculé automatiquement depuis N × (1 + % Év.)"
                  />
                </Td>
                <Td>
                  <input
                    type="number"
                    className={cn(cellInput, "text-right")}
                    value={row.evolutionN2 === 0 ? "" : row.evolutionN2}
                    placeholder="0"
                    onChange={(e) => {
                      const ev2 = numVal(e.target.value);
                      const n2 = parseFloat((row.montantN1 * (1 + ev2 / 100)).toFixed(2));
                      onUpdate(i, { evolutionN2: ev2, montantN2: n2 });
                    }}
                  />
                </Td>
                <Td>
                  <input
                    type="number"
                    className={cn(cellInput, "text-right bg-muted/40")}
                    value={row.montantN2 === 0 ? "" : row.montantN2}
                    readOnly
                    tabIndex={-1}
                    placeholder="0"
                    title="Calculé automatiquement depuis N+1 × (1 + % Év.)"
                  />
                </Td>
                <Td>
                  <select
                    className={cellSelect}
                    value={row.calculCommission}
                    onChange={(e) =>
                      onUpdate(i, {
                        calculCommission:
                          e.target
                            .value as ActiviteCommissionRow["calculCommission"],
                      })
                    }
                  >
                    {MODES_CALCUL_COMMISSION.map((m) => (
                      <option
                        key={m.value}
                        value={m.value}
                        className="bg-background text-foreground"
                      >
                        {m.label}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td>
                  <input
                    type="number"
                    className={cn(cellInput, "text-right")}
                    value={
                      row.tauxCommission === 0 ? "" : row.tauxCommission
                    }
                    placeholder="0"
                    onChange={(e) =>
                      onUpdate(i, { tauxCommission: numVal(e.target.value) })
                    }
                  />
                </Td>
                <Td>
                  <select
                    className={cellSelect}
                    value={row.tvaCommission}
                    onChange={(e) =>
                      onUpdate(i, { tvaCommission: numVal(e.target.value) })
                    }
                  >
                    {TAUX_TVA_OPTIONS.map((t) => (
                      <option
                        key={t.value}
                        value={t.value}
                        className="bg-background text-foreground"
                      >
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td>
                  <input
                    type="number"
                    className={cn(cellInput, "text-right")}
                    value={row.stocks === 0 ? "" : (row.stocks ?? "")}
                    placeholder="0"
                    onChange={(e) =>
                      onUpdate(i, { stocks: intVal(e.target.value) })
                    }
                  />
                </Td>
                <Td>
                  <input
                    type="number"
                    className={cn(cellInput, "text-right")}
                    value={
                      row.reglementFournisseurs === 0
                        ? ""
                        : (row.reglementFournisseurs ?? "")
                    }
                    placeholder="0"
                    onChange={(e) =>
                      onUpdate(i, {
                        reglementFournisseurs: intVal(e.target.value),
                      })
                    }
                  />
                </Td>
                <Td className="text-center px-1">
                  <button
                    type="button"
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => onRemove(i)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Td>
              </tr>
            ))
          )}
        </tbody>
        {rows.length > 0 && (
          <tfoot className="border-t-2 border-border bg-muted/30">
            <tr>
              <td colSpan={4} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
                Total (actifs)
              </td>
              <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                {rows.filter(r => r.actif ?? true).reduce((s, r) => s + r.montantN, 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}
              </td>
              <td />
              <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                {rows.filter(r => r.actif ?? true).reduce((s, r) => s + r.montantN1, 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}
              </td>
              <td />
              <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                {rows.filter(r => r.actif ?? true).reduce((s, r) => s + r.montantN2, 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}
              </td>
              <td colSpan={6} />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

// ── Tableau Productions immobilisées ─────────────────────────────────────────

const NATURES_PRODUCTION = [
  { value: "CORPOREL", label: "Corporel" },
  { value: "INCORPOREL", label: "Incorporel" },
  { value: "FINANCIER", label: "Financier" },
] as const;

const MODES_AMORTISSEMENT = [
  { value: "AUCUN", label: "Aucun" },
  { value: "LINEAIRE", label: "Linéaire" },
  { value: "DEGRESSIF", label: "Dégressif" },
] as const;

function TableauProductionsImmobilisees({
  rows,
  onUpdate,
  onRemove,
}: {
  rows: ProductionImmobiliseeRow[];
  onUpdate: (i: number, data: Partial<ProductionImmobiliseeRow>) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-muted/50">
          <tr>
            <Th className="w-8">#</Th>
            <Th className="w-8 text-center">Actif</Th>
            <Th className="min-w-40">Libellé</Th>
            <Th className="w-24">Nature</Th>
            <Th className="w-24">Hypothèse</Th>
            <Th className="w-28">Date</Th>
            <Th className="w-24 text-right">Montant</Th>
            <Th className="w-24">Amort.</Th>
            <Th className="w-16 text-right">Différé</Th>
            <Th className="w-16 text-right">Durée</Th>
            <Th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={11}
                className="text-center text-muted-foreground text-xs py-6"
              >
                Aucune production immobilisée — cliquez sur « Ajouter »
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={i}
                className={cn(
                  "border-t border-border bg-background hover:bg-muted/30 transition-colors",
                  !(row.actif ?? true) && "opacity-50"
                )}
              >
                <Td className="text-center text-xs text-muted-foreground px-1">
                  {i + 1}
                </Td>
                <Td className="text-center px-1">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 cursor-pointer accent-primary"
                    checked={row.actif ?? true}
                    onChange={(e) => onUpdate(i, { actif: e.target.checked })}
                  />
                </Td>
                <Td>
                  <input
                    className={cellInput}
                    value={row.libelle}
                    placeholder="Libellé"
                    onChange={(e) => onUpdate(i, { libelle: e.target.value })}
                  />
                </Td>
                <Td>
                  <select
                    className={cellSelect}
                    value={row.nature}
                    onChange={(e) =>
                      onUpdate(i, {
                        nature:
                          e.target
                            .value as ProductionImmobiliseeRow["nature"],
                      })
                    }
                  >
                    {NATURES_PRODUCTION.map((n) => (
                      <option
                        key={n.value}
                        value={n.value}
                        className="bg-background text-foreground"
                      >
                        {n.label}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td>
                  <select
                    className={cellSelect}
                    value={row.hypothese}
                    onChange={(e) =>
                      onUpdate(i, {
                        hypothese:
                          e.target
                            .value as ProductionImmobiliseeRow["hypothese"],
                      })
                    }
                  >
                    {HYPOTHESES_ACTIVITE.map((h) => (
                      <option
                        key={h.value}
                        value={h.value}
                        className="bg-background text-foreground"
                      >
                        {h.label}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td>
                  <input
                    type="date"
                    className={cellInput}
                    value={row.date}
                    onChange={(e) => onUpdate(i, { date: e.target.value })}
                  />
                </Td>
                <Td>
                  <input
                    type="number"
                    className={cn(cellInput, "text-right")}
                    value={row.montant === 0 ? "" : row.montant}
                    placeholder="0"
                    onChange={(e) =>
                      onUpdate(i, { montant: numVal(e.target.value) })
                    }
                  />
                </Td>
                <Td>
                  <select
                    className={cellSelect}
                    value={row.amortissement}
                    onChange={(e) =>
                      onUpdate(i, {
                        amortissement:
                          e.target
                            .value as ProductionImmobiliseeRow["amortissement"],
                      })
                    }
                  >
                    {MODES_AMORTISSEMENT.map((a) => (
                      <option
                        key={a.value}
                        value={a.value}
                        className="bg-background text-foreground"
                      >
                        {a.label}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td>
                  <input
                    type="number"
                    className={cn(cellInput, "text-right")}
                    value={row.differe === 0 ? "" : (row.differe ?? "")}
                    placeholder="0"
                    onChange={(e) =>
                      onUpdate(i, { differe: intVal(e.target.value) })
                    }
                  />
                </Td>
                <Td>
                  <input
                    type="number"
                    className={cn(cellInput, "text-right")}
                    value={row.duree === 0 ? "" : (row.duree ?? "")}
                    placeholder="0"
                    onChange={(e) =>
                      onUpdate(i, { duree: intVal(e.target.value) })
                    }
                  />
                </Td>
                <Td className="text-center px-1">
                  <button
                    type="button"
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => onRemove(i)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Tableau Subventions d'exploitation ───────────────────────────────────────

const TYPES_TVA_SUBVENTION = [
  { value: "RECUPERABLE", label: "Récupérable" },
  { value: "NON_RECUPERABLE", label: "Non récupérable" },
  { value: "EXONEREE", label: "Exonérée" },
] as const;

function TableauSubventions({
  rows,
  onUpdate,
  onRemove,
}: {
  rows: SubventionExploitationRow[];
  onUpdate: (i: number, data: Partial<SubventionExploitationRow>) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-muted/50">
          <tr>
            <Th className="w-8">#</Th>
            <Th className="w-8 text-center">Actif</Th>
            <Th className="min-w-40">Libellé</Th>
            <Th className="w-24">Hypothèse</Th>
            <Th className="w-28">Date N</Th>
            <Th className="w-24 text-right">N</Th>
            <Th className="w-28">Date N+1</Th>
            <Th className="w-24 text-right">N+1</Th>
            <Th className="w-28">Date N+2</Th>
            <Th className="w-24 text-right">N+2</Th>
            <Th className="w-16 text-right">TVA</Th>
            <Th className="w-28">Type TVA</Th>
            <Th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={13}
                className="text-center text-muted-foreground text-xs py-6"
              >
                Aucune subvention — cliquez sur « Ajouter »
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={i}
                className={cn(
                  "border-t border-border bg-background hover:bg-muted/30 transition-colors",
                  !(row.actif ?? true) && "opacity-50"
                )}
              >
                <Td className="text-center text-xs text-muted-foreground px-1">
                  {i + 1}
                </Td>
                <Td className="text-center px-1">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 cursor-pointer accent-primary"
                    checked={row.actif ?? true}
                    onChange={(e) => onUpdate(i, { actif: e.target.checked })}
                  />
                </Td>
                <Td>
                  <input
                    className={cellInput}
                    value={row.libelle}
                    placeholder="Libellé"
                    onChange={(e) => onUpdate(i, { libelle: e.target.value })}
                  />
                </Td>
                <Td>
                  <select
                    className={cellSelect}
                    value={row.hypothese}
                    onChange={(e) =>
                      onUpdate(i, {
                        hypothese:
                          e.target
                            .value as SubventionExploitationRow["hypothese"],
                      })
                    }
                  >
                    {HYPOTHESES_ACTIVITE.map((h) => (
                      <option
                        key={h.value}
                        value={h.value}
                        className="bg-background text-foreground"
                      >
                        {h.label}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td>
                  <input
                    type="date"
                    className={cellInput}
                    value={row.dateN ?? ""}
                    onChange={(e) => onUpdate(i, { dateN: e.target.value })}
                  />
                </Td>
                <Td>
                  <input
                    type="number"
                    className={cn(cellInput, "text-right")}
                    value={row.montantN === 0 ? "" : (row.montantN ?? "")}
                    placeholder="0"
                    onChange={(e) =>
                      onUpdate(i, { montantN: numVal(e.target.value) })
                    }
                  />
                </Td>
                <Td>
                  <input
                    type="date"
                    className={cellInput}
                    value={row.dateN1 ?? ""}
                    onChange={(e) => onUpdate(i, { dateN1: e.target.value })}
                  />
                </Td>
                <Td>
                  <input
                    type="number"
                    className={cn(cellInput, "text-right")}
                    value={row.montantN1 === 0 ? "" : (row.montantN1 ?? "")}
                    placeholder="0"
                    onChange={(e) =>
                      onUpdate(i, { montantN1: numVal(e.target.value) })
                    }
                  />
                </Td>
                <Td>
                  <input
                    type="date"
                    className={cellInput}
                    value={row.dateN2 ?? ""}
                    onChange={(e) => onUpdate(i, { dateN2: e.target.value })}
                  />
                </Td>
                <Td>
                  <input
                    type="number"
                    className={cn(cellInput, "text-right")}
                    value={row.montantN2 === 0 ? "" : (row.montantN2 ?? "")}
                    placeholder="0"
                    onChange={(e) =>
                      onUpdate(i, { montantN2: numVal(e.target.value) })
                    }
                  />
                </Td>
                <Td>
                  <select
                    className={cellSelect}
                    value={row.tva}
                    onChange={(e) =>
                      onUpdate(i, { tva: numVal(e.target.value) })
                    }
                  >
                    {TAUX_TVA_OPTIONS.map((t) => (
                      <option
                        key={t.value}
                        value={t.value}
                        className="bg-background text-foreground"
                      >
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td>
                  <select
                    className={cellSelect}
                    value={row.typeTva}
                    onChange={(e) =>
                      onUpdate(i, {
                        typeTva:
                          e.target
                            .value as SubventionExploitationRow["typeTva"],
                      })
                    }
                  >
                    {TYPES_TVA_SUBVENTION.map((t) => (
                      <option
                        key={t.value}
                        value={t.value}
                        className="bg-background text-foreground"
                      >
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Td>
                <Td className="text-center px-1">
                  <button
                    type="button"
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => onRemove(i)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Composant principal ──────────────────────────────────────────────────────

export interface ActiviteFormProps {
  dossierId: string;
  activites?: ActiviteRow[];
  activitesCommissionnees?: ActiviteCommissionRow[];
  productionsImmobilisees?: ProductionImmobiliseeRow[];
  subventionsExploitation?: SubventionExploitationRow[];
  dateDebutExerciceN?: string;
  exercices?: Array<{ dateCloture: string; duree: number; annee: number }>;
}

export function ActiviteForm({
  dossierId,
  activites = [],
  activitesCommissionnees = [],
  productionsImmobilisees = [],
  subventionsExploitation = [],
  dateDebutExerciceN,
  exercices,
}: ActiviteFormProps) {
  const {
    getDraft,
    setActivites,
    setActivitesCommissionnees,
    setProductionsImmobilisees,
    setSubventionsExploitation,
    addActivite,
    updateActivite,
    removeActivite,
    markActivitesSaved,
    addActiviteCommission,
    updateActiviteCommission,
    removeActiviteCommission,
    markCommissionsSaved,
    addProductionImmobilisee,
    updateProductionImmobilisee,
    removeProductionImmobilisee,
    markProductionsSaved,
    addSubventionExploitation,
    updateSubventionExploitation,
    removeSubventionExploitation,
    markSubventionsSaved,
  } = useActiviteStore();

  // Hydratation du store avec les données initiales (venant du serveur).
  // On n'écrase une section QUE si :
  //   1. elle n'a pas de modifications non sauvegardées, ET
  //   2. le store ne contient pas de lignes sauvegardées absentes du initialData
  //      (ce qui indiquerait que le store est en avance sur le server component stale).
  useEffect(() => {
    const currentDraft = getDraft(dossierId);

    if (!currentDraft.hasUnsavedActivites) {
      const serverIds = new Set(activites.map((r) => r.id).filter(Boolean));
      const storeIsAhead = currentDraft.activites.some((r) => r.id && !serverIds.has(r.id));
      if (!storeIsAhead) setActivites(dossierId, activites);
    }

    if (!currentDraft.hasUnsavedCommissions) {
      const serverIds = new Set(activitesCommissionnees.map((r) => r.id).filter(Boolean));
      const storeIsAhead = currentDraft.activitesCommissionnees.some((r) => r.id && !serverIds.has(r.id));
      if (!storeIsAhead) setActivitesCommissionnees(dossierId, activitesCommissionnees);
    }

    if (!currentDraft.hasUnsavedProductions) {
      const serverIds = new Set(productionsImmobilisees.map((r) => r.id).filter(Boolean));
      const storeIsAhead = currentDraft.productionsImmobilisees.some((r) => r.id && !serverIds.has(r.id));
      if (!storeIsAhead) setProductionsImmobilisees(dossierId, productionsImmobilisees);
    }

    if (!currentDraft.hasUnsavedSubventions) {
      const serverIds = new Set(subventionsExploitation.map((r) => r.id).filter(Boolean));
      const storeIsAhead = currentDraft.subventionsExploitation.some((r) => r.id && !serverIds.has(r.id));
      if (!storeIsAhead) setSubventionsExploitation(dossierId, subventionsExploitation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const draft = getDraft(dossierId);
  const invalidateControleStores = useInvalidateControleStores();

  const [isPendingActivites, startActivites] = useTransition();
  const [isPendingCommissions, startCommissions] = useTransition();
  const [isPendingProductions, startProductions] = useTransition();
  const [isPendingSubventions, startSubventions] = useTransition();

  // ── Handlers Activités ────────────────────────────────────────────────────

  const handleSaveActivites = useCallback(() => {
    startActivites(async () => {
      try {
        const result = await saveActivites(dossierId, draft.activites);
        if (result.success) {
          markActivitesSaved(dossierId);
          toast.success(result.message);
          invalidateControleStores(dossierId);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Erreur lors de la sauvegarde");
      }
    });
  }, [dossierId, draft.activites, markActivitesSaved]);

  // ── Handlers Commissions ──────────────────────────────────────────────────

  // TODO: créer le modèle Prisma et la server action pour les commissions
  const handleSaveCommissions = useCallback(() => {
    startCommissions(async () => {
      try {
        const result = await saveActivitesCommission(dossierId, draft.activitesCommissionnees);
        if (result.success) {
          markCommissionsSaved(dossierId);
          toast.success(result.message);
          invalidateControleStores(dossierId);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Erreur lors de la sauvegarde");
      }
    });
  }, [dossierId, draft.activitesCommissionnees, markCommissionsSaved]);

  // ── Handlers Productions ──────────────────────────────────────────────────

  // TODO: créer le modèle Prisma et la server action pour les productions immobilisées
  const handleSaveProductions = useCallback(() => {
    startProductions(async () => {
      try {
        const result = await saveProductionsImmobilisees(dossierId, draft.productionsImmobilisees);
        if (result.success) {
          markProductionsSaved(dossierId);
          toast.success(result.message);
          invalidateControleStores(dossierId);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Erreur lors de la sauvegarde");
      }
    });
  }, [dossierId, draft.productionsImmobilisees, markProductionsSaved]);

  // ── Handlers Subventions ──────────────────────────────────────────────────

  // TODO: créer le modèle Prisma et la server action pour les subventions
  const handleSaveSubventions = useCallback(() => {
    startSubventions(async () => {
      try {
        const result = await saveSubventionsExploitation(dossierId, draft.subventionsExploitation);
        if (result.success) {
          markSubventionsSaved(dossierId);
          toast.success(result.message);
          invalidateControleStores(dossierId);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Erreur lors de la sauvegarde");
      }
    });
  }, [dossierId, draft.subventionsExploitation, markSubventionsSaved]);

  return (
    <div className="h-full space-y-8 overflow-y-auto">
      {/* ── Chiffre d'affaires ───────────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Chiffre d'affaires"
          description="Projections de chiffre d'affaires sur 3 ans (N, N+1, N+2)"
          isDirty={draft.hasUnsavedActivites}
          isSaving={isPendingActivites}
          onAdd={() => addActivite(dossierId)}
          onSave={handleSaveActivites}
        />
        <TableauActivites
          dossierId={dossierId}
          rows={draft.activites}
          onUpdate={(i, data) => updateActivite(dossierId, i, data)}
          onRemove={(i) => removeActivite(dossierId, i)}
          dateDebutExerciceN={dateDebutExerciceN}
          exercices={exercices}
        />
      </section>

      {/* ── Activités commissionnées ─────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Activités commissionnées"
          description="Revenus issus de commissions sur ventes ou prestations"
          isDirty={draft.hasUnsavedCommissions}
          isSaving={isPendingCommissions}
          onAdd={() => addActiviteCommission(dossierId)}
          onSave={handleSaveCommissions}
        />
        <TableauActivitesCommissions
          rows={draft.activitesCommissionnees}
          onUpdate={(i, data) => updateActiviteCommission(dossierId, i, data)}
          onRemove={(i) => removeActiviteCommission(dossierId, i)}
        />
      </section>

      {/* ── Production immobilisée ───────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Production immobilisée"
          description="Immobilisations produites par l'entreprise pour elle-même"
          isDirty={draft.hasUnsavedProductions}
          isSaving={isPendingProductions}
          onAdd={() => addProductionImmobilisee(dossierId)}
          onSave={handleSaveProductions}
        />
        <TableauProductionsImmobilisees
          rows={draft.productionsImmobilisees}
          onUpdate={(i, data) =>
            updateProductionImmobilisee(dossierId, i, data)
          }
          onRemove={(i) => removeProductionImmobilisee(dossierId, i)}
        />
      </section>

      {/* ── Subventions d'exploitation ───────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Subventions d'exploitation"
          description="Aides et subventions perçues sur la période prévisionnelle"
          isDirty={draft.hasUnsavedSubventions}
          isSaving={isPendingSubventions}
          onAdd={() => addSubventionExploitation(dossierId)}
          onSave={handleSaveSubventions}
        />
        <TableauSubventions
          rows={draft.subventionsExploitation}
          onUpdate={(i, data) =>
            updateSubventionExploitation(dossierId, i, data)
          }
          onRemove={(i) => removeSubventionExploitation(dossierId, i)}
        />
      </section>
    </div>
  );
}

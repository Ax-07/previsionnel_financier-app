"use client";

/**
 * Section paramètres TNS + tableau des cotisations sociales du dirigeant TNS.
 * Inclut le calcul automatique (net→brut→cotisations) et le calendrier URSSAF
 * en mode début d'activité.
 */

import { useCallback, useEffect, useMemo, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Activity, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { filterByHypothese } from "@/lib/schemas/hypothese";
import { useHypotheseStore } from "@/stores/hypothese-store";
import {
  COTISATIONS_TNS_DEFAUT,
  REGIME_SOCIAL_OPTIONS,
  MODE_CALCUL_TNS_OPTIONS,
  type LigneCotisationTNSRow,
  type LigneDirigeantRow,
  type ParamsGlobauxTNS,
  createDefaultParamsGlobauxTNS,
} from "@/lib/schemas/personnel";
import { usePersonnelStore } from "@/stores/personnel-store";
import {
  saveLignesCotisationsTNS,
  fetchParamsGlobauxTNS,
  saveParamsGlobauxTNS,
} from "@/app/actions/personnel";
import {
  calculerMontantsTNS,
  trouverBrutPourNet,
  detecterACRE,
  remuTNSBase,
  simulerTresorerieUrssafSur3Ans,
  type ModeCalculTNS,
} from "@/lib/calcul/taux-tns";
import { GroupedDndTable } from "@/components/ui/grouped-dnd-table";
import { useGroupedDnd } from "@/hooks/use-grouped-dnd";
import { SortableTableRow, DragHandleCell } from "@/components/ui/sortable-table-row";
import { formatNumber } from "@/lib/format";
import { useReloadScenarioData } from "@/hooks/use-reload-scenario-data";
import { cellInput } from "../helpers/cell-styles";
import { Td, Th } from "../helpers/table-helpers";
import { SectionHeader } from "../helpers/section-header";

// ── Mapping libellé → index dans MontantsTNSLigne[] ──────────────────────────
// Nouveaux libellés (réforme 2026) + anciens pour rétrocompatibilité BDD.
// ── Module-level stable empty references ──────────────────────────────────────
const EMPTY_COTISATIONS: LigneCotisationTNSRow[] = [];
const EMPTY_DIRIGEANTS_TNS: LigneDirigeantRow[] = [];
const DEFAULT_PARAMS_TNS: ParamsGlobauxTNS = createDefaultParamsGlobauxTNS();

const AUTO_IDX_BY_LABEL: Record<string, number> = {
  // ── Libellés courants (réforme 2026) ──────────────────────────────────────────────────────
  "Allocations familiales":                     0,
  "Maladie-maternité":                          1,
  "Indemnités journalières (IJ)":               2,
  "Retraite (base + compl) + invalidité-décès": 3,
  "CSG/CRDS":                                   4,
  "CFP (forfait PASS)":                         5,
  // ── Anciens libellés (rétrocompatibilité enregistrements BDD) ──────────────
  "Allocation familiale":                       0,
  "Maladie, maternité":                         1,
  "Maladie 1, maladie 2":                       1,
  "Retraite, invalidité / décès":               3,
  "CSG déductible, CFP":                        4,
  "CSG/CRDS non déductible":                    5,
};

// ─────────────────────────────────────────────────────────────────────────────
// PARAMÈTRES TNS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Panneau de configuration des paramètres TNS :
 * régime social, mode de calcul des cotisations, décalage d'échéancier N+2.
 */
export function ParamsTNSSection({ dossierId }: { dossierId: string }) {
  const params = usePersonnelStore(s => s.drafts[dossierId]?.paramsGlobauxTNS ?? DEFAULT_PARAMS_TNS);
  const updateParamsGlobauxTNS = usePersonnelStore(s => s.updateParamsGlobauxTNS);
  const invalidateControleStores = useReloadScenarioData();

  // Chargement depuis la BDD au montage (priorité BDD > localStorage)
  useEffect(() => {
    fetchParamsGlobauxTNS(dossierId).then((dbParams) => {
      usePersonnelStore.getState().updateParamsGlobauxTNS(dossierId, dbParams);
    }).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const set = (data: Partial<ParamsGlobauxTNS>) => {
    updateParamsGlobauxTNS(dossierId, data);
    const updated = { ...params, ...data };
    saveParamsGlobauxTNS(dossierId, {
      regimeSocial: updated.regimeSocial,
      modeCalculTNS: updated.modeCalculTNS,
      decalerEcheancierN2: updated.decalerEcheancierN2,
    }).then((res) => {
      if (res.success) invalidateControleStores(dossierId);
    }).catch(() => null);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 rounded-md bg-muted/30 border">
      {/* Régime social */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="regimeSocial">
          Régime social
        </label>
        <select
          id="regimeSocial"
          className="h-8 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          value={params.regimeSocial}
          onChange={(e) => set({ regimeSocial: e.target.value as ParamsGlobauxTNS["regimeSocial"] })}
        >
          {REGIME_SOCIAL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Mode de calcul TNS */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="modeCalculTNS">
          Mode de calcul cotisations
        </label>
        <select
          id="modeCalculTNS"
          className="h-8 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          value={params.modeCalculTNS}
          onChange={(e) => set({ modeCalculTNS: e.target.value as ModeCalculTNS })}
        >
          {MODE_CALCUL_TNS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Décaler échéancier N+2 */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Décaler échéancier en N+2</span>
        <label htmlFor="decalerEcheancierN2" className="flex items-center gap-2 h-8 cursor-pointer select-none">
          <input
            id="decalerEcheancierN2"
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={params.decalerEcheancierN2}
            onChange={(e) => set({ decalerEcheancierN2: e.target.checked })}
          />
          <span className="text-sm">Activer le décalage</span>
        </label>
      </div>

      {/* Note explicative — pleine largeur */}
      <div className="col-span-full flex gap-2 rounded-md border border-blue-200/60 bg-blue-50/50 dark:border-blue-800/40 dark:bg-blue-950/20 px-3 py-2.5 text-xs text-blue-700 dark:text-blue-400">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {params.modeCalculTNS === "DEFINITIF" ? (
          <span>
            <span className="font-semibold">Mode définitif :</span>{" "}
            Les cotisations sont calculées sur le revenu réel (assiette unique = revenu − abattement 26 %, borné entre 1,76 % et 130 % du PASS).
            Les montants affichés correspondent à ce qui est réellement dû chaque année, sans décalage de trésorerie.
          </span>
        ) : (
          <span>
            <span className="font-semibold">Mode début d&apos;activité (trésorerie URSSAF) :</span>{" "}
            Les deux premières années, l&apos;URSSAF appelle des cotisations <span className="font-medium">provisionnelles</span> sur des bases forfaitaires
            (≈ 19 % du PASS pour le général, 40 % du PASS pour les IJ), faute de revenu réel connu.
            L&apos;année suivante, une <span className="font-medium">régularisation</span> est appliquée (différence entre le dû réel et le forfait).
            {" "}En N+2, les appels sont basés sur le revenu N+1.{" "}
            {params.decalerEcheancierN2 && (
              <span className="font-medium text-amber-700 dark:text-amber-400">
                Décalage actif : la régularisation N est reportée en N+2 (impact positif sur la trésorerie N+1).
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLEAU COTISATIONS TNS
// ─────────────────────────────────────────────────────────────────────────────

const tempId = () => `__new__${crypto.randomUUID()}`;

function emptyRow(groupe?: string): LigneCotisationTNSRow {
  return {
    id: tempId(),
    libelle: "Cotisation",
    actif: true,
    hypothese: "COMMUNE",
    calcAuto: false,
    montantN: 0,
    montantN1: 0,
    montantN2: 0,
    groupe: groupe ?? null,
  };
}

const COL_SPAN = 8;
const GROUP_NAME_COL_SPAN = 3;

/**
 * Tableau des cotisations sociales TNS avec calcul automatique (net→brut→cotisations),
 * affichage des réductions ACRE et du calendrier URSSAF en mode début d'activité.
 * Supporte le drag-and-drop et les groupes.
 */
export function TableauCotisationsTNS({
  dossierId,
  initialData,
}: {
  dossierId: string;
  initialData?: LigneCotisationTNSRow[];
}) {
  const setCotisationsTNS = usePersonnelStore(s => s.setCotisationsTNS);
  const setCotisationsTNSRows = usePersonnelStore(s => s.setCotisationsTNSRows);
  const markCotisationsTNSSaved = usePersonnelStore(s => s.markCotisationsTNSSaved);
  const rows = usePersonnelStore(s => s.drafts[dossierId]?.cotisationsTNS ?? EMPTY_COTISATIONS);
  const isDirty = usePersonnelStore(s => s.drafts[dossierId]?.hasUnsavedCotisationsTNS ?? false);
  const dirigeants = usePersonnelStore(s => s.drafts[dossierId]?.dirigeants ?? EMPTY_DIRIGEANTS_TNS);
  const paramsGlobauxTNS = usePersonnelStore(s => s.drafts[dossierId]?.paramsGlobauxTNS ?? DEFAULT_PARAMS_TNS);
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const [isPending, startTransition] = useTransition();

  // ── Bridge setRows → store (dirty=true) ──────────────────────────────────
  const setRows = useCallback(
    (updater: (prev: LigneCotisationTNSRow[]) => LigneCotisationTNSRow[]) => {
      const cur = usePersonnelStore.getState().getDraft(dossierId);
      setCotisationsTNSRows(dossierId, updater(cur.cotisationsTNS));
    },
    [dossierId, setCotisationsTNSRows],
  );

  // ── DnD ──────────────────────────────────────────────────────────────────
  const dnd = useGroupedDnd({ rows, setRows });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const addRow = useCallback(() => setRows((prev) => [...prev, emptyRow()]), [setRows]);

  const addGroupe = useCallback(() => {
    const cur = usePersonnelStore.getState().getDraft(dossierId);
    const existing = new Set(cur.cotisationsTNS.filter((r) => r.groupe).map((r) => r.groupe!));
    let n = 1;
    while (existing.has(`Groupe ${n}`)) n++;
    setRows((prev) => [...prev, emptyRow(`Groupe ${n}`)]);
  }, [dossierId, setRows]);

  const addRowToGroupe = useCallback(
    (groupe: string) => setRows((prev) => [...prev, emptyRow(groupe)]),
    [setRows],
  );

  const updateRow = useCallback(
    (idx: number, data: Partial<LigneCotisationTNSRow>) =>
      setRows((prev) => { const n = [...prev]; n[idx] = { ...n[idx], ...data }; return n; }),
    [setRows],
  );

  const removeRow = useCallback(
    (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx)),
    [setRows],
  );

  const {
    cotisations: montantsAuto,
    bruts: brutsCalcules,
    tresorieTNS,
  } = useMemo(() => {
    const { remuN, remuN1, remuN2 } = remuTNSBase(dirigeants);
    const acreN = detecterACRE(dirigeants);
    const regime = paramsGlobauxTNS.regimeSocial;
    const mode = paramsGlobauxTNS.modeCalculTNS;

    const simN  = trouverBrutPourNet(remuN,  regime, acreN,  { mode: "DEFINITIF" });
    const simN1 = trouverBrutPourNet(remuN1, regime, false,  { mode: "DEFINITIF" });
    const simN2 = trouverBrutPourNet(remuN2, regime, false,  { mode: "DEFINITIF" });

    const bruts = { brutN: simN.brut, brutN1: simN1.brut, brutN2: simN2.brut };

    const cotisations = calculerMontantsTNS(
      bruts.brutN, bruts.brutN1, bruts.brutN2,
      regime, acreN, 360, 360, 360, "DEFINITIF",
    );

    if (mode === "DEBUT_ACTIVITE_FORFAIT") {
      const treso = simulerTresorerieUrssafSur3Ans({
        brutN: bruts.brutN, brutN1: bruts.brutN1, brutN2: bruts.brutN2,
        regime, acreN, joursN: 360, joursN1: 360, joursN2: 360,
      });
      return {
        cotisations,
        bruts,
        tresorieTNS: {
          forfaitN:    treso[0].totalPaye,
          forfaitN1:   treso[1].totalPaye - treso[1].regularisation,
          forfaitN2:   treso[2].totalPaye - treso[2].regularisation,
          regN1:       treso[1].regularisation,
          regN2:       treso[2].regularisation,
          totalPayeN:  treso[0].totalPaye,
          totalPayeN1: treso[1].totalPaye,
          totalPayeN2: treso[2].totalPaye,
        },
      };
    }

    return {
      cotisations,
      bruts,
      tresorieTNS: null as null | {
        forfaitN: number; forfaitN1: number; forfaitN2: number;
        regN1: number; regN2: number;
        totalPayeN: number; totalPayeN1: number; totalPayeN2: number;
      },
    };
  }, [dirigeants, paramsGlobauxTNS.regimeSocial, paramsGlobauxTNS.modeCalculTNS]);

  const { rowsWithAuto, acreFlags } = useMemo(() => {
    const flags: boolean[] = [];
    const rows2 = rows.map((row) => {
      if (!row.calcAuto) { flags.push(false); return row; }
      const idx = AUTO_IDX_BY_LABEL[row.libelle];
      if (idx === undefined) { flags.push(false); return row; }
      const auto = montantsAuto[idx];
      if (!auto) { flags.push(false); return row; }
      flags.push(auto.acreApplique);
      return { ...row, montantN: auto.montantN, montantN1: auto.montantN1, montantN2: auto.montantN2 };
    });
    return { rowsWithAuto: rows2, acreFlags: flags };
  }, [rows, montantsAuto]);

  // ── Hydratation initiale ──────────────────────────────────────────────────
  useEffect(() => {
    const cur = usePersonnelStore.getState().getDraft(dossierId);
    if (!cur.hasUnsavedCotisationsTNS) {
      const serverIds = new Set(initialData?.map((r) => r.id).filter(Boolean));
      const ahead = cur.cotisationsTNS.some((r) => r.id && !serverIds.has(r.id));
      if (!ahead) {
        setCotisationsTNS(
          dossierId,
          initialData && initialData.length > 0 ? initialData : COTISATIONS_TNS_DEFAUT,
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const invalidateControleStores = useReloadScenarioData();

  const saveAll = useCallback(() => {
    startTransition(async () => {
      try {
        const result = await saveLignesCotisationsTNS(dossierId, rowsWithAuto, {
          regimeSocial: paramsGlobauxTNS.regimeSocial,
          modeCalculTNS: "DEFINITIF",
        });
        if (result.success) {
          toast.success(result.message);
          if ("ids" in result && result.ids) {
            setCotisationsTNS(dossierId, rowsWithAuto.map((r, idx) => ({ ...r, id: result.ids![idx] ?? r.id })));
          }
          markCotisationsTNSSaved(dossierId);
          invalidateControleStores(dossierId);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Erreur lors de la sauvegarde");
      }
    });
  }, [dossierId, rowsWithAuto, paramsGlobauxTNS.regimeSocial, setCotisationsTNS, markCotisationsTNSSaved, invalidateControleStores]);

  // ── Récapitulatif de groupe ───────────────────────────────────────────────
  const renderGroupSummaryCells = useCallback(
    (groupRows: LigneCotisationTNSRow[]) => {
      // Utiliser rowsWithAuto pour avoir les montants calcAuto à jour
      const autoById = new Map(rowsWithAuto.map((r) => [r.id, r]));
      const resolvedRows = groupRows.map((r) => autoById.get(r.id) ?? r);
      const actifs = filterByHypothese(resolvedRows, hypotheseActive).filter((r) => r.actif !== false);
      const tN  = actifs.reduce((s, r) => s + r.montantN,  0);
      const tN1 = actifs.reduce((s, r) => s + r.montantN1, 0);
      const tN2 = actifs.reduce((s, r) => s + r.montantN2, 0);
      return (
        <>
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">{formatNumber(tN, 0)}</td>
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">{formatNumber(tN1, 0)}</td>
          <td className="px-2 py-1 text-xs font-medium text-right tabular-nums text-muted-foreground">{formatNumber(tN2, 0)}</td>
        </>
      );
    },
    [hypotheseActive, rowsWithAuto],
  );

  // ── Rendu d'une ligne ────────────────────────────────────────────────────
  const renderRow = useCallback(
    (row: LigneCotisationTNSRow & { id: string }, isLastInGroup = false) => {
      const i = rows.findIndex((r) => r.id === row.id);
      const autoIdx = AUTO_IDX_BY_LABEL[row.libelle];
      const autoCapable = autoIdx !== undefined;
      const effectiveCalcAuto = row.calcAuto && autoCapable;
      const acreActive = acreFlags[i] ?? false;

      return (
        <SortableTableRow
          key={row.id}
          id={row.id}
          className={cn(
            "border-b last:border-0 hover:bg-muted/20 transition-colors",
            row.groupe && "border-l-2 border-l-primary/20 bg-primary/5 hover:bg-primary/10",
            row.groupe && isLastInGroup && "border-b-2 border-b-primary/20",
            row.actif === false && "opacity-50",
          )}
        >
          <DragHandleCell />

          <Td className="pl-1">
            <input
              type="checkbox"
              checked={row.actif !== false}
              onChange={(e) => updateRow(i, { actif: e.target.checked })}
              className="h-3.5 w-3.5 accent-primary"
              aria-label="Activer"
            />
          </Td>

          <Td>
            <span className="px-1 text-sm">
              {row.libelle}
              {row.libelle === "Indemniés journalières (IJ)" && paramsGlobauxTNS.regimeSocial === "liberal" && (
                <span className="ml-1 text-[10px] text-muted-foreground italic">(non applicable PL)</span>
              )}
            </span>
          </Td>

          <Td className="text-center">
            <input
              type="checkbox"
              checked={row.calcAuto}
              disabled={!autoCapable && !row.calcAuto}
              onChange={(e) => {
                const next = e.target.checked;
                if (next && !autoCapable) return;
                updateRow(i, { calcAuto: next });
              }}
              className="h-3.5 w-3.5 accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Calcul auto"
            />
          </Td>

          <Td>
            <div className="flex items-center gap-1">
              <input
                type="text"
                inputMode="decimal"
                className={cn(cellInput, "text-right", effectiveCalcAuto && "text-muted-foreground italic")}
                value={row.montantN === 0 ? "" : row.montantN}
                placeholder={effectiveCalcAuto ? "auto" : "0"}
                readOnly={effectiveCalcAuto}
                tabIndex={effectiveCalcAuto ? -1 : undefined}
                title={acreActive ? "Réduit ACRE (max −25 %, dégressif 75−100 % PASS)" : undefined}
                onChange={(e) => updateRow(i, { montantN: Number(e.target.value.replace(",", ".")) || 0 })}
              />
              {acreActive && (
                <span className="shrink-0 rounded px-1 py-0.5 text-[10px] font-semibold leading-none bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                  ACRE
                </span>
              )}
            </div>
          </Td>

          <Td>
            <input
              type="text"
              inputMode="decimal"
              className={cn(cellInput, "text-right", effectiveCalcAuto && "text-muted-foreground italic")}
              value={row.montantN1 === 0 ? "" : row.montantN1}
              placeholder={effectiveCalcAuto ? "auto" : "0"}
              readOnly={effectiveCalcAuto}
              tabIndex={effectiveCalcAuto ? -1 : undefined}
              onChange={(e) => updateRow(i, { montantN1: Number(e.target.value.replace(",", ".")) || 0 })}
            />
          </Td>

          <Td>
            <input
              type="text"
              inputMode="decimal"
              className={cn(cellInput, "text-right", effectiveCalcAuto && "text-muted-foreground italic")}
              value={row.montantN2 === 0 ? "" : row.montantN2}
              placeholder={effectiveCalcAuto ? "auto" : "0"}
              readOnly={effectiveCalcAuto}
              tabIndex={effectiveCalcAuto ? -1 : undefined}
              onChange={(e) => updateRow(i, { montantN2: Number(e.target.value.replace(",", ".")) || 0 })}
            />
          </Td>

          <Td className="text-center px-1">
            <button
              type="button"
              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
              onClick={() => removeRow(i)}
              title="Supprimer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </Td>
        </SortableTableRow>
      );
    },
    [rows, acreFlags, paramsGlobauxTNS.regimeSocial, updateRow, removeRow],
  );

  // ── Totaux pied de tableau ────────────────────────────────────────────────
  const footer = (
    <tfoot className="border-t-2 border-border bg-muted/30">
      <tr>
        <td colSpan={4} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">Total (actifs)</td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {formatNumber(filterByHypothese(rowsWithAuto, hypotheseActive).filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN, 0), 0)}
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {formatNumber(filterByHypothese(rowsWithAuto, hypotheseActive).filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN1, 0), 0)}
        </td>
        <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
          {formatNumber(filterByHypothese(rowsWithAuto, hypotheseActive).filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN2, 0), 0)}
        </td>
        <td />
      </tr>
      {tresorieTNS && (
        <tr className="border-t border-dashed border-amber-400/50 bg-amber-50/40 dark:bg-amber-950/20">
          <td colSpan={4} className="px-2 py-1.5 text-xs font-medium text-right text-amber-700 dark:text-amber-400">
            Appels URSSAF provisionnels
          </td>
          <td className="px-2 py-1.5 text-xs font-medium text-right tabular-nums text-amber-700 dark:text-amber-400">{formatNumber(tresorieTNS.forfaitN, 0)}</td>
          <td className="px-2 py-1.5 text-xs font-medium text-right tabular-nums text-amber-700 dark:text-amber-400">{formatNumber(tresorieTNS.forfaitN1, 0)}</td>
          <td className="px-2 py-1.5 text-xs font-medium text-right tabular-nums text-amber-700 dark:text-amber-400">{formatNumber(tresorieTNS.forfaitN2, 0)}</td>
          <td />
        </tr>
      )}
      {tresorieTNS && (
        <tr className="border-t border-dashed border-amber-400/50 bg-amber-50/40 dark:bg-amber-950/20">
          <td colSpan={4} className="px-2 py-1.5 text-xs font-medium text-right text-amber-700 dark:text-amber-400">
            + Régularisation URSSAF
          </td>
          <td className="px-2 py-1.5 text-xs font-medium text-right tabular-nums text-amber-700 dark:text-amber-400">{formatNumber(0)}</td>
          <td className="px-2 py-1.5 text-xs font-medium text-right tabular-nums text-amber-700 dark:text-amber-400">{formatNumber(tresorieTNS.regN1, 0)}</td>
          <td className="px-2 py-1.5 text-xs font-medium text-right tabular-nums text-amber-700 dark:text-amber-400">{formatNumber(tresorieTNS.regN2, 0)}</td>
          <td />
        </tr>
      )}
      {tresorieTNS && (
        <tr className="border-t border-border bg-muted/50">
          <td colSpan={4} className="px-2 py-1.5 text-xs font-bold text-right text-muted-foreground">= Total décaissé URSSAF</td>
          <td className="px-2 py-1.5 text-xs font-bold text-right tabular-nums">{formatNumber(tresorieTNS.totalPayeN, 0)}</td>
          <td className="px-2 py-1.5 text-xs font-bold text-right tabular-nums">{formatNumber(tresorieTNS.totalPayeN1, 0)}</td>
          <td className="px-2 py-1.5 text-xs font-bold text-right tabular-nums">{formatNumber(tresorieTNS.totalPayeN2, 0)}</td>
          <td />
        </tr>
      )}
    </tfoot>
  );

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Cotisations TNS"
        description="Cotisations sociales du travailleur non salarié — lignes prédéfinies, calcul automatique ou saisie manuelle"
        icon={<Activity className="h-4 w-4" />}
        isDirty={isDirty}
        isSaving={isPending}
        onAdd={addRow}
        onSave={saveAll}
        onAddGroup={addGroupe}
      />

      <ParamsTNSSection dossierId={dossierId} />

      {(brutsCalcules.brutN > 0 || brutsCalcules.brutN1 > 0 || brutsCalcules.brutN2 > 0) && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-md border border-blue-300/50 bg-blue-50/50 dark:bg-blue-950/20 px-3 py-2 text-xs text-blue-700 dark:text-blue-400">
          <span className="font-semibold shrink-0">Brut calculé (net → brut)</span>
          {brutsCalcules.brutN   > 0 && <span>N : <span className="tabular-nums font-medium">{formatNumber(brutsCalcules.brutN, 0)} €</span></span>}
          {brutsCalcules.brutN1  > 0 && <span>N+1 : <span className="tabular-nums font-medium">{formatNumber(brutsCalcules.brutN1, 0)} €</span></span>}
          {brutsCalcules.brutN2  > 0 && <span>N+2 : <span className="tabular-nums font-medium">{formatNumber(brutsCalcules.brutN2, 0)} €</span></span>}
        </div>
      )}

      {acreFlags.some(Boolean) && (
        <div className="flex items-center gap-2 rounded-md border border-green-400/40 bg-green-50/60 dark:bg-green-950/30 px-3 py-2 text-xs text-green-700 dark:text-green-400">
          <span className="font-semibold">ACRE actif</span>
          <span className="text-green-600 dark:text-green-500">— réduction jusqu&apos;à 25 % max (hors CSG/CFP/retraite comp.), dégressive de 75 % à 100 % du PASS, sur l&apos;exercice N uniquement.</span>
        </div>
      )}

      <GroupedDndTable
        dnd={dnd}
        colSpan={COL_SPAN}
        groupNameColSpan={GROUP_NAME_COL_SPAN}
        renderRow={renderRow}
        renderGroupSummaryCells={renderGroupSummaryCells}
        onAddRowToGroupe={addRowToGroupe}
        emptyMessage="Aucune ligne — cliquez sur « Ajouter » pour commencer."
        footer={footer}
      >
        <thead className="bg-muted/40 border-b">
          <tr>
            <Th className="w-6" />
            <Th className="w-8">Act.</Th>
            <Th className="min-w-48">Libellé</Th>
            <Th className="w-24 text-center">Calc. auto</Th>
            <Th className="w-28 text-right">N (€)</Th>
            <Th className="w-28 text-right">N+1 (€)</Th>
            <Th className="w-28 text-right">N+2 (€)</Th>
            <Th className="w-8" />
          </tr>
        </thead>
      </GroupedDndTable>
    </section>
  );
}

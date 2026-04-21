"use client";

/**
 * Section paramètres TNS + tableau des cotisations sociales du dirigeant TNS.
 * Inclut le calcul automatique (net→brut→cotisations) et le calendrier URSSAF
 * en mode début d'activité.
 */

import { useCallback, useEffect, useMemo, useTransition } from "react";
import { toast } from "sonner";
import { Activity, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { filterByHypothese } from "@/lib/schemas/hypothese";
import { useHypotheseStore } from "@/stores/hypothese-store";
import {
  COTISATIONS_TNS_DEFAUT,
  REGIME_SOCIAL_OPTIONS,
  MODE_CALCUL_TNS_OPTIONS,
  type LigneCotisationTNSRow,
  type ParamsGlobauxTNS,
} from "@/lib/schemas/personnel";
import { usePersonnelStore } from "@/stores/personnel-store";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
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
import { SectionHeader, Th, Td, cellInput, fmt } from "./personnel-form-shared";

// ── Mapping libellé → index dans MontantsTNSLigne[] ──────────────────────────
// Nouveaux libellés (réforme 2026) + anciens pour rétrocompatibilité BDD.
const AUTO_IDX_BY_LABEL: Record<string, number> = {
  // ── Libellés courants (réforme 2026) ──────────────────────────────────────
  "Allocations familiales":                     0,
  "Maladie-maternité":                          1,
  "Indemnités journalières (IJ)":               2,
  "Retraite (base + compl) + invalidité-décès": 3,
  "CSG/CRDS":                                   4,
  "CFP (forfait PASS)":                         5,
  // ── Anciens libellés (rétrocompatibilité enregistrements BDD) ─────────────
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
  const store = usePersonnelStore();
  const params: ParamsGlobauxTNS = store.getDraft(dossierId).paramsGlobauxTNS;
  const invalidateControleStores = useInvalidateControleStores();

  // Chargement depuis la BDD au montage (priorité BDD > localStorage)
  useEffect(() => {
    fetchParamsGlobauxTNS(dossierId).then((dbParams) => {
      store.updateParamsGlobauxTNS(dossierId, dbParams);
    }).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const set = (data: Partial<ParamsGlobauxTNS>) => {
    store.updateParamsGlobauxTNS(dossierId, data);
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

/**
 * Tableau des cotisations sociales TNS avec calcul automatique (net→brut→cotisations),
 * affichage des réductions ACRE et du calendrier URSSAF en mode début d'activité.
 */
export function TableauCotisationsTNS({
  dossierId,
  initialData,
}: {
  dossierId: string;
  initialData?: LigneCotisationTNSRow[];
}) {
  const store = usePersonnelStore();
  const draft = store.getDraft(dossierId);
  const hypotheseActive = useHypotheseStore((s) => s.getActive(dossierId));
  const [isPending, startTransition] = useTransition();

  const rows = draft.cotisationsTNS;
  const isDirty = draft.hasUnsavedCotisationsTNS;

  const {
    cotisations: montantsAuto,
    bruts: brutsCalcules,
    tresorieTNS,
  } = useMemo(() => {
    const { remuN, remuN1, remuN2 } = remuTNSBase(draft.dirigeants);
    const acreN = detecterACRE(draft.dirigeants);
    const regime = draft.paramsGlobauxTNS.regimeSocial;
    const mode = draft.paramsGlobauxTNS.modeCalculTNS;

    // Bruts sur le revenu réel (DEFINITIF) — référence stable quel que soit le mode
    const simN  = trouverBrutPourNet(remuN,  regime, acreN,  { mode: "DEFINITIF" });
    const simN1 = trouverBrutPourNet(remuN1, regime, false,  { mode: "DEFINITIF" });
    const simN2 = trouverBrutPourNet(remuN2, regime, false,  { mode: "DEFINITIF" });

    const bruts = { brutN: simN.brut, brutN1: simN1.brut, brutN2: simN2.brut };

    // Les 6 lignes sauvegardées en BDD = TOUJOURS DEFINITIF (charges comptables du CR/bilan).
    const cotisations = calculerMontantsTNS(
      bruts.brutN, bruts.brutN1, bruts.brutN2,
      regime, acreN, 360, 360, 360, "DEFINITIF",
    );

    // En mode "Début d'activité forfait" : calendrier URSSAF informatif (jamais sauvegardé en BDD)
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
  }, [draft.dirigeants, draft.paramsGlobauxTNS.regimeSocial, draft.paramsGlobauxTNS.modeCalculTNS]);

  // Rows avec montants calculés injectés + flags ACRE
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

  // Initialisation : priorité aux données BDD, sinon lignes prédéfinies
  useEffect(() => {
    if (rows.length === 0) {
      store.setCotisationsTNS(
        dossierId,
        initialData && initialData.length > 0 ? initialData : COTISATIONS_TNS_DEFAUT,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId]);

  const handleUpdate = useCallback(
    (i: number, data: Partial<LigneCotisationTNSRow>) => store.updateCotisationTNS(dossierId, i, data),
    [store, dossierId],
  );
  const invalidateControleStores = useInvalidateControleStores();

  const handleSave = useCallback(() => {
    startTransition(async () => {
      const result = await saveLignesCotisationsTNS(dossierId, rowsWithAuto, {
        regimeSocial: draft.paramsGlobauxTNS.regimeSocial,
        modeCalculTNS: "DEFINITIF",
      });
      if (result.success) {
        toast.success(result.message);
        if ("ids" in result && result.ids) {
          store.setCotisationsTNS(dossierId, rowsWithAuto.map((r, idx) => ({ ...r, id: result.ids![idx] ?? r.id })));
        }
        store.markCotisationsTNSSaved(dossierId);
        invalidateControleStores(dossierId);
      } else {
        toast.error(result.error);
      }
    });
  }, [dossierId, rowsWithAuto, draft.paramsGlobauxTNS.regimeSocial, store, invalidateControleStores]);

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Cotisations TNS"
        description="Cotisations sociales du travailleur non salarié — lignes prédéfinies, calcul automatique ou saisie manuelle"
        icon={<Activity className="h-4 w-4" />}
        isDirty={isDirty}
        isSaving={isPending}
        hideAdd
        onAdd={() => void 0}
        onSave={handleSave}
      />
      <ParamsTNSSection dossierId={dossierId} />
      {(brutsCalcules.brutN > 0 || brutsCalcules.brutN1 > 0 || brutsCalcules.brutN2 > 0) && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-md border border-blue-300/50 bg-blue-50/50 dark:bg-blue-950/20 px-3 py-2 text-xs text-blue-700 dark:text-blue-400">
          <span className="font-semibold shrink-0">Brut calculé (net → brut)</span>
          {brutsCalcules.brutN   > 0 && <span>N : <span className="tabular-nums font-medium">{fmt(brutsCalcules.brutN)} €</span></span>}
          {brutsCalcules.brutN1  > 0 && <span>N+1 : <span className="tabular-nums font-medium">{fmt(brutsCalcules.brutN1)} €</span></span>}
          {brutsCalcules.brutN2  > 0 && <span>N+2 : <span className="tabular-nums font-medium">{fmt(brutsCalcules.brutN2)} €</span></span>}
        </div>
      )}
      {acreFlags.some(Boolean) && (
        <div className="flex items-center gap-2 rounded-md border border-green-400/40 bg-green-50/60 dark:bg-green-950/30 px-3 py-2 text-xs text-green-700 dark:text-green-400">
          <span className="font-semibold">ACRE actif</span>
          <span className="text-green-600 dark:text-green-500">— réduction jusqu&apos;à 25 % max (hors CSG/CFP/retraite comp.), dégressive de 75 % à 100 % du PASS, sur l&apos;exercice N uniquement.</span>
        </div>
      )}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/40 border-b">
            <tr>
              <Th className="w-8">Act.</Th>
              <Th className="min-w-48">Libellé</Th>
              <Th className="w-24 text-center">Calc. auto</Th>
              <Th className="w-28 text-right">N (€)</Th>
              <Th className="w-28 text-right">N+1 (€)</Th>
              <Th className="w-28 text-right">N+2 (€)</Th>
            </tr>
          </thead>
          <tbody>
            {rowsWithAuto.map((row, i) => {
              const autoIdx = AUTO_IDX_BY_LABEL[row.libelle];
              const autoCapable = autoIdx !== undefined;
              const effectiveCalcAuto = row.calcAuto && autoCapable;

              return (
                <tr
                  key={row.id ?? `tns-${i}`}
                  className={cn("border-b last:border-0 hover:bg-muted/20 transition-colors", row.actif === false && "opacity-50")}
                >
                  <Td className="pl-2">
                    <input
                      type="checkbox"
                      checked={row.actif !== false}
                      onChange={(e) => handleUpdate(i, { actif: e.target.checked })}
                      className="h-3.5 w-3.5 accent-primary"
                      aria-label="Activer"
                    />
                  </Td>
                  <Td>
                    <span className="px-2 text-sm">{row.libelle}</span>
                    {row.libelle === "Indemnités journalières (IJ)" && draft.paramsGlobauxTNS.regimeSocial === "liberal" && (
                      <span className="ml-1 text-[10px] text-muted-foreground italic">(non applicable PL)</span>
                    )}
                  </Td>
                  <Td className="text-center">
                    <input
                      type="checkbox"
                      checked={row.calcAuto}
                      disabled={!autoCapable && !row.calcAuto}
                      onChange={(e) => {
                        const next = e.target.checked;
                        if (next && !autoCapable) return;
                        handleUpdate(i, { calcAuto: next });
                      }}
                      className="h-3.5 w-3.5 accent-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Calcul auto"
                    />
                  </Td>
                  <Td>
                    <div className="flex items-center">
                      <input
                        type="text"
                        inputMode="decimal"
                        className={cn(cellInput, "text-right", effectiveCalcAuto && "text-muted-foreground italic")}
                        value={row.montantN === 0 ? "" : row.montantN}
                        placeholder={effectiveCalcAuto ? "auto" : "0"}
                        readOnly={effectiveCalcAuto}
                        tabIndex={effectiveCalcAuto ? -1 : undefined}
                        title={acreFlags[i] ? "Réduit ACRE (max −25 %, dégressif 75−100 % PASS)" : undefined}
                        onChange={(e) => handleUpdate(i, { montantN: Number(e.target.value.replace(",", ".")) || 0 })}
                      />
                      {acreFlags[i] && (
                        <span className="shrink-0 mr-1 rounded px-1 py-0.5 text-[10px] font-semibold leading-none bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
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
                      onChange={(e) => handleUpdate(i, { montantN1: Number(e.target.value.replace(",", ".")) || 0 })}
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
                      onChange={(e) => handleUpdate(i, { montantN2: Number(e.target.value.replace(",", ".")) || 0 })}
                    />
                  </Td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 border-border bg-muted/30">
            <tr>
              <td colSpan={3} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">Total (actifs)</td>
              <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                {fmt(filterByHypothese(rowsWithAuto, hypotheseActive).filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN, 0))}
              </td>
              <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                {fmt(filterByHypothese(rowsWithAuto, hypotheseActive).filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN1, 0))}
              </td>
              <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                {fmt(filterByHypothese(rowsWithAuto, hypotheseActive).filter((r) => r.actif !== false).reduce((s, r) => s + r.montantN2, 0))}
              </td>
            </tr>
            {tresorieTNS && (
              <tr className="border-t border-dashed border-amber-400/50 bg-amber-50/40 dark:bg-amber-950/20">
                <td colSpan={3} className="px-2 py-1.5 text-xs font-medium text-right text-amber-700 dark:text-amber-400">
                  Appels URSSAF provisionnels
                </td>
                <td className="px-2 py-1.5 text-xs font-medium text-right tabular-nums text-amber-700 dark:text-amber-400">{fmt(tresorieTNS.forfaitN)}</td>
                <td className="px-2 py-1.5 text-xs font-medium text-right tabular-nums text-amber-700 dark:text-amber-400">{fmt(tresorieTNS.forfaitN1)}</td>
                <td className="px-2 py-1.5 text-xs font-medium text-right tabular-nums text-amber-700 dark:text-amber-400">{fmt(tresorieTNS.forfaitN2)}</td>
              </tr>
            )}
            {tresorieTNS && (
              <tr className="border-t border-dashed border-amber-400/50 bg-amber-50/40 dark:bg-amber-950/20">
                <td colSpan={3} className="px-2 py-1.5 text-xs font-medium text-right text-amber-700 dark:text-amber-400">
                  + Régularisation URSSAF
                </td>
                <td className="px-2 py-1.5 text-xs font-medium text-right tabular-nums text-amber-700 dark:text-amber-400">{fmt(0)}</td>
                <td className="px-2 py-1.5 text-xs font-medium text-right tabular-nums text-amber-700 dark:text-amber-400">{fmt(tresorieTNS.regN1)}</td>
                <td className="px-2 py-1.5 text-xs font-medium text-right tabular-nums text-amber-700 dark:text-amber-400">{fmt(tresorieTNS.regN2)}</td>
              </tr>
            )}
            {tresorieTNS && (
              <tr className="border-t border-border bg-muted/50">
                <td colSpan={3} className="px-2 py-1.5 text-xs font-bold text-right text-muted-foreground">= Total décaissé URSSAF</td>
                <td className="px-2 py-1.5 text-xs font-bold text-right tabular-nums">{fmt(tresorieTNS.totalPayeN)}</td>
                <td className="px-2 py-1.5 text-xs font-bold text-right tabular-nums">{fmt(tresorieTNS.totalPayeN1)}</td>
                <td className="px-2 py-1.5 text-xs font-bold text-right tabular-nums">{fmt(tresorieTNS.totalPayeN2)}</td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>
    </section>
  );
}

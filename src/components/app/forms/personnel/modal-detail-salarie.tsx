"use client";

/**
 * Modal Détail Rémunération Salarié
 * ─────────────────────────────────
 * Accessible depuis le bouton « Détail » du tableau Rémunération des salariés.
 * Permet de :
 *  - Cocher commission / prime / cotisation congés
 *  - Saisir la répartition mensuelle (effectif + brut individuel) sur N / N+1 / N+2
 *  - Recalculer automatiquement montantN / montantN1 / montantN2
 *  - Ajuster les taux de cotisations
 */

import { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, CopyCheck } from "lucide-react";
import {
  createEmptyDetailMensuel,
  totalBrutFromDetail,
  type LigneSalarieRow,
  type DetailMensuelExercice,
} from "@/lib/schemas/personnel";
import { numVal } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import type {
  ExerciceCalendrierEntry,
  ExerciceConfig,
  ExercicesConfig,
} from "@/hooks/use-activite-calculs";

// ── Types & helpers calendrier ───────────────────────────────────────────────────

const TOUS_MOIS = [
  "Jan.", "Fév.", "Mar.", "Avr.", "Mai", "Juin",
  "Juil.", "Aoû.", "Sep.", "Oct.", "Nov.", "Déc.",
] as const;

function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function buildMoisLabels(
  startMonth: number,
  startYear: number,
  duree: number,
): readonly string[] {
  return Array.from({ length: duree }, (_, i) => {
    const monthIdx = (startMonth + i) % 12;
    const yearOffset = Math.floor((startMonth + i) / 12);
    const yr = (startYear + yearOffset) % 100;
    return `${TOUS_MOIS[monthIdx]} ${String(yr).padStart(2, "0")}`;
  });
}

/**
 * Distribue un montant annuel uniformément sur les mois actifs de l'exercice.
 * Si le détail existant contient déjà des données, il est restitué tel quel.
 */
function initDetailFromMontant(
  existing: DetailMensuelExercice | undefined | null,
  montantAnnuel: number,
  config: ExerciceConfig,
): DetailMensuelExercice {
  const existingTotal = existing ? totalBrutFromDetail(existing) : 0;

  // Cas 1 : détail existant et total déjà correct → on le conserve tel quel
  if (existingTotal > 0 && Math.abs(existingTotal - montantAnnuel) < 0.01) {
    return existing!;
  }

  // Cas 2 : détail existant mais montant modifié dans le formulaire
  //         → mise à l'échelle proportionnelle pour préserver la répartition mäensuelle
  if (existingTotal > 0 && montantAnnuel > 0) {
    const ratio = montantAnnuel / existingTotal;
    const newBrut = existing!.brutIndividuel.map(v => Math.round(v * ratio * 100) / 100);
    // Correction de l'arrondi sur le dernier mois de l'exercice
    const lastAbsIdx = (config.startMonth + config.duree - 1) % 12;
    const currentSum = newBrut.reduce((s, v) => s + v, 0);
    newBrut[lastAbsIdx] = Math.round((newBrut[lastAbsIdx] + montantAnnuel - currentSum) * 100) / 100;
    return { ...existing!, brutIndividuel: newBrut };
  }

  // Cas 3 : pas de détail → distribution uniforme avec correction d'arrondi sur le dernier mois
  if (montantAnnuel > 0 && config.duree > 0) {
    const brutParMois = Math.round((montantAnnuel / config.duree) * 100) / 100;
    const detail = createEmptyDetailMensuel();
    let cumul = 0;
    for (let i = 0; i < config.duree; i++) {
      const absIdx = (config.startMonth + i) % 12;
      detail.effectif[absIdx] = 1;
      if (i < config.duree - 1) {
        detail.brutIndividuel[absIdx] = brutParMois;
        cumul += brutParMois;
      } else {
        detail.brutIndividuel[absIdx] = Math.round((montantAnnuel - cumul) * 100) / 100;
      }
    }
    return detail;
  }

  return createEmptyDetailMensuel();
}

function buildExercicesConfig(
  dateDebutExerciceN?: string,
  exercices?: ExerciceCalendrierEntry[],
): ExercicesConfig {
  const DEFAULT: ExerciceConfig = { startMonth: 0, startYear: 0, duree: 12 };
  if (!dateDebutExerciceN || !exercices || exercices.length === 0) {
    return { N: DEFAULT, N1: DEFAULT, N2: DEFAULT };
  }

  const startDate  = parseLocalDate(dateDebutExerciceN);
  const startMonth = startDate.getMonth();
  const startYear  = startDate.getFullYear();

  const exN  = exercices[0];
  const exN1 = exercices[1];
  const exN2 = exercices[2];

  const clotureN  = exN  ? parseLocalDate(exN.dateCloture)  : null;
  const clotureN1 = exN1 ? parseLocalDate(exN1.dateCloture) : null;

  const startN1Month = clotureN  ? (clotureN.getMonth()  + 1) % 12 : 0;
  const startN1Year  = clotureN
    ? clotureN.getFullYear() + (clotureN.getMonth() === 11 ? 1 : 0)
    : startYear + 1;
  const startN2Month = clotureN1 ? (clotureN1.getMonth() + 1) % 12 : 0;
  const startN2Year  = clotureN1
    ? clotureN1.getFullYear() + (clotureN1.getMonth() === 11 ? 1 : 0)
    : startYear + 2;

  return {
    N:  { startMonth,            startYear,            duree: exN?.duree  ?? 12 },
    N1: { startMonth: startN1Month, startYear: startN1Year, duree: exN1?.duree ?? 12 },
    N2: { startMonth: startN2Month, startYear: startN2Year, duree: exN2?.duree ?? 12 },
  };
}


/**
 * Reporte le détail mensuel d'un exercice source vers un exercice cible.
 * Copie la saisie mois par mois (position relative), tronque ou complète par des zéros.
 */
function resampleDetailMensuel(
  source: DetailMensuelExercice,
  sourceConfig: ExerciceConfig,
  targetConfig: ExerciceConfig,
): DetailMensuelExercice {
  const next = createEmptyDetailMensuel();
  const duree = Math.min(sourceConfig.duree, targetConfig.duree);
  for (let i = 0; i < duree; i++) {
    const srcIdx = (sourceConfig.startMonth + i) % 12;
    const tgtIdx = (targetConfig.startMonth + i) % 12;
    next.effectif[tgtIdx] = source.effectif[srcIdx] ?? 0;
    next.brutIndividuel[tgtIdx] = source.brutIndividuel[srcIdx] ?? 0;
  }
  return next;
}

// ── Types internes ────────────────────────────────────────────────────────────

interface ModalDetailSalarieProps {
  open: boolean;
  row: LigneSalarieRow;
  onClose: () => void;
  onApply: (updated: Partial<LigneSalarieRow>) => void;
  dateDebutExerciceN?: string;
  exercices?: ExerciceCalendrierEntry[];
}

// ── Sous-composant : tableau mensuel pour un exercice ─────────────────────────

function TableauMensuel({
  detail,
  onChange,
  exerciceConfig,
}: {
  detail: DetailMensuelExercice;
  onChange: (next: DetailMensuelExercice) => void;
  exerciceConfig: ExerciceConfig;
}) {
  const totalAnnuel = useMemo(() => totalBrutFromDetail(detail), [detail]);
  const moisLabels  = useMemo(
    () => buildMoisLabels(exerciceConfig.startMonth, exerciceConfig.startYear, exerciceConfig.duree),
    [exerciceConfig],
  );

  const setEffectif = useCallback(
    (idx: number, val: string) => {
      const next = { ...detail, effectif: [...detail.effectif] };
      next.effectif[idx] = numVal(val);
      onChange(next);
    },
    [detail, onChange],
  );

  const setBrut = useCallback(
    (idx: number, val: string) => {
      const next = { ...detail, brutIndividuel: [...detail.brutIndividuel] };
      next.brutIndividuel[idx] = numVal(val);
      onChange(next);
    },
    [detail, onChange],
  );

  const redistribuer = useCallback(() => {
    if (totalAnnuel <= 0 || exerciceConfig.duree <= 0) return;
    const bruParMois = Math.round((totalAnnuel / exerciceConfig.duree) * 100) / 100;
    const next = createEmptyDetailMensuel();
    let cumul = 0;
    for (let i = 0; i < exerciceConfig.duree; i++) {
      const absIdx = (exerciceConfig.startMonth + i) % 12;
      next.effectif[absIdx] = 1;
      if (i < exerciceConfig.duree - 1) {
        next.brutIndividuel[absIdx] = bruParMois;
        cumul += bruParMois;
      } else {
        next.brutIndividuel[absIdx] = Math.round((totalAnnuel - cumul) * 100) / 100;
      }
    }
    onChange(next);
  }, [totalAnnuel, exerciceConfig, onChange]);

  const cellCls =
    "h-7 w-full border-0 bg-transparent px-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none";

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-muted/40 border-b sticky top-0">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-28">
              Mois
            </th>
            <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground w-24">
              Effectif
            </th>
            <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground w-32">
              Brut indiv. (€)
            </th>
            <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground w-32">
              Total brut (€)
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: exerciceConfig.duree }, (_, i) => {
            const absIdx = (exerciceConfig.startMonth + i) % 12;
            const mois   = moisLabels[i] ?? "";
            const eff    = detail.effectif[absIdx] ?? 0;
            const brut   = detail.brutIndividuel[absIdx] ?? 0;
            const total  = eff * brut;
            return (
              <tr
                key={i}
                className="border-b last:border-0 hover:bg-muted/20 transition-colors"
              >
                <td className="px-3 py-0 text-sm font-medium">{mois}</td>
                <td className="px-0 py-0">
                  <input
                    type="text"
                    inputMode="decimal"
                    className={cellCls}
                    value={eff === 0 ? "" : eff}
                    placeholder="0"
                    aria-label={`Effectif ${mois}`}
                    onChange={(e) => setEffectif(absIdx, e.target.value)}
                  />
                </td>
                <td className="px-0 py-0">
                  <input
                    type="text"
                    inputMode="decimal"
                    className={cellCls}
                    value={brut === 0 ? "" : brut}
                    placeholder="0"
                    aria-label={`Brut individuel ${mois}`}
                    onChange={(e) => setBrut(absIdx, e.target.value)}
                  />
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums text-sm text-muted-foreground">
                  {total > 0 ? formatNumber(total) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="border-t-2 border-border bg-muted/30">
          <tr>
            <td colSpan={4} className="px-2 py-1.5">
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                  onClick={redistribuer}
                  disabled={totalAnnuel <= 0}
                  title="Répartir le total uniformément sur tous les mois"
                >
                  <RefreshCw className="h-3 w-3" />
                  Répartir uniformément
                </Button>
                <span className="text-xs font-semibold text-muted-foreground mr-1">
                  Total : <span className="text-foreground font-bold tabular-nums">{formatNumber(totalAnnuel)} €</span>
                </span>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── Modal principale ──────────────────────────────────────────────────────────

export function ModalDetailSalarie({
  open,
  row,
  onClose,
  onApply,
  dateDebutExerciceN,
  exercices,
}: ModalDetailSalarieProps) {
  // Config calculée une fois à la création (le composant est remonté via `key` à chaque ouverture)
  const initialConfig = buildExercicesConfig(dateDebutExerciceN, exercices);

  // Draft interne — initialisé depuis `row` à chaque ouverture (via key dans parent)
  const [hasCommission, setHasCommission] = useState(row.hasCommission ?? false);
  const [hasPrime, setHasPrime] = useState(row.hasPrime ?? false);
  const [cotisationConges, setCotisationConges] = useState(row.cotisationConges ?? false);
  const [tauxCotSal, setTauxCotSal] = useState(row.tauxCotSal ?? 22);
  const [tauxCotPat, setTauxCotPat] = useState(row.tauxCotPat ?? 42);

  // Si le détail est vide mais qu'un montant global existe, on le distribue uniformément
  const [detailN, setDetailN] = useState<DetailMensuelExercice>(() =>
    initDetailFromMontant(row.detailMensuelN, row.montantN, initialConfig.N),
  );
  const [detailN1, setDetailN1] = useState<DetailMensuelExercice>(() =>
    initDetailFromMontant(row.detailMensuelN1, row.montantN1, initialConfig.N1),
  );
  const [detailN2, setDetailN2] = useState<DetailMensuelExercice>(() =>
    initDetailFromMontant(row.detailMensuelN2, row.montantN2, initialConfig.N2),
  );

  const [activeTab, setActiveTab] = useState<"n" | "n1" | "n2">("n");

  const exercicesConfig = useMemo(
    () => buildExercicesConfig(dateDebutExerciceN, exercices),
    [dateDebutExerciceN, exercices],
  );

  const totalN = useMemo(() => totalBrutFromDetail(detailN), [detailN]);
  const totalN1 = useMemo(() => totalBrutFromDetail(detailN1), [detailN1]);
  const totalN2 = useMemo(() => totalBrutFromDetail(detailN2), [detailN2]);
  const hasMonthlyData = totalN > 0 || totalN1 > 0 || totalN2 > 0;

  type ExKey = "n" | "n1" | "n2";
  const EX_LABELS: Record<ExKey, string> = { n: "N", n1: "N+1", n2: "N+2" };
  const detailByEx: Record<ExKey, DetailMensuelExercice> = useMemo(
    () => ({ n: detailN, n1: detailN1, n2: detailN2 }),
    [detailN, detailN1, detailN2],
  );
  const configByEx: Record<ExKey, ExerciceConfig> = useMemo(
    () => ({ n: exercicesConfig.N, n1: exercicesConfig.N1, n2: exercicesConfig.N2 }),
    [exercicesConfig],
  );
  const setDetailByEx: Record<ExKey, React.Dispatch<React.SetStateAction<DetailMensuelExercice>>> = {
    n: setDetailN,
    n1: setDetailN1,
    n2: setDetailN2,
  };

  const handleReporter = useCallback(
    (source: ExKey, targets: ExKey[]) => {
      const srcDetail = detailByEx[source];
      const srcConfig = configByEx[source];
      for (const target of targets) {
        const resampled = resampleDetailMensuel(srcDetail, srcConfig, configByEx[target]);
        setDetailByEx[target](resampled);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [detailByEx, configByEx],
  );

  const handleApply = useCallback(() => {
    // Les montants annuels sont toujours recalculés depuis le total du détail mensuel.
    // Si le total est nul, on n'enregistre pas le détail (évite un détail stale à zéro
    // qui bloquerait le calcul si l'utilisateur modifie montantN directement ensuite).
    const patch: Partial<LigneSalarieRow> = {
      hasCommission,
      hasPrime,
      cotisationConges,
      tauxCotSal,
      tauxCotPat,
      detailMensuelN:  totalN  > 0 ? detailN  : undefined,
      detailMensuelN1: totalN1 > 0 ? detailN1 : undefined,
      detailMensuelN2: totalN2 > 0 ? detailN2 : undefined,
      montantN: totalN,
      montantN1: totalN1,
      montantN2: totalN2,
    };

    onApply(patch);
    onClose();
  }, [
    hasCommission, hasPrime, cotisationConges, tauxCotSal, tauxCotPat,
    detailN, detailN1, detailN2, totalN, totalN1, totalN2,
    onApply, onClose,
  ]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
        {/* ── En-tête ── */}
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="text-base font-semibold">
            Détail rémunération — {row.libelle || "salarié"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Répartition mensuelle et paramètres de cotisations
          </p>
        </DialogHeader>

        {/* ── Corps scrollable ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">

          {/* ── Options ── */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Options
            </h4>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasCommission}
                  onChange={(e) => setHasCommission(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm">Commission variable</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasPrime}
                  onChange={(e) => setHasPrime(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm">Prime(s)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={cotisationConges}
                  onChange={(e) => setCotisationConges(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm">Cotisation caisse congés payés</span>
              </label>
            </div>
          </section>

          <Separator />

          {/* ── Répartition mensuelle ── */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground shrink-0">
                Répartition mensuelle
              </h4>
              <div className="flex items-center gap-1.5 flex-wrap">
                {hasMonthlyData && (
                  <Badge variant="outline" className="text-emerald-600 border-emerald-400 text-xs">
                    Totaux recalculés depuis le détail
                  </Badge>
                )}
                {/* Reporter la répartition vers les autres exercices */}
                {(["n", "n1", "n2"] as ExKey[])
                  .filter((target) => target !== activeTab)
                  .map((target) => (
                    <button
                      key={target}
                      type="button"
                      title={`Reporter la répartition de l'exercice ${EX_LABELS[activeTab]} vers l'exercice ${EX_LABELS[target]}`}
                      onClick={() => handleReporter(activeTab, [target])}
                      className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium border border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                    >
                      <CopyCheck className="h-3 w-3" />
                      {`→ ${EX_LABELS[target]}`}
                    </button>
                  ))}
                <button
                  type="button"
                  title={`Reporter la répartition de l'exercice ${EX_LABELS[activeTab]} vers tous les autres exercices`}
                  onClick={() =>
                    handleReporter(
                      activeTab,
                      (["n", "n1", "n2"] as ExKey[]).filter((t) => t !== activeTab),
                    )
                  }
                  className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium border border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                >
                  <CopyCheck className="h-3 w-3" />→ Tous
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-1">
              Le total brut annuel de chaque exercice sera recalculé automatiquement
              depuis la répartition mensuelle (Effectif × Brut individuel).
            </p>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "n" | "n1" | "n2")} className="w-full">
              <TabsList className="h-8">
                <TabsTrigger value="n" className="text-xs h-7">
                  Exercice N
                  {totalN > 0 && (
                    <span className="ml-1.5 text-xs tabular-nums text-muted-foreground">
                      ({formatNumber(totalN)} €)
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="n1" className="text-xs h-7">
                  Exercice N+1
                  {totalN1 > 0 && (
                    <span className="ml-1.5 text-xs tabular-nums text-muted-foreground">
                      ({formatNumber(totalN1)} €)
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="n2" className="text-xs h-7">
                  Exercice N+2
                  {totalN2 > 0 && (
                    <span className="ml-1.5 text-xs tabular-nums text-muted-foreground">
                      ({formatNumber(totalN2)} €)
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="n" className="mt-3">
                <TableauMensuel detail={detailN} onChange={setDetailN} exerciceConfig={exercicesConfig.N} />
              </TabsContent>
              <TabsContent value="n1" className="mt-3">
                <TableauMensuel detail={detailN1} onChange={setDetailN1} exerciceConfig={exercicesConfig.N1} />
              </TabsContent>
              <TabsContent value="n2" className="mt-3">
                <TableauMensuel detail={detailN2} onChange={setDetailN2} exerciceConfig={exercicesConfig.N2} />
              </TabsContent>
            </Tabs>
          </section>

          <Separator />

          {/* ── Cotisations sociales ── */}
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Taux de cotisations sociales
            </h4>
            <div className="grid grid-cols-2 gap-4 max-w-sm">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground" htmlFor="tauxCotSal">
                  Cotisations salariales (%)
                </label>
                <div className="flex items-center gap-1 rounded-md border bg-background px-2">
                  <input
                    id="tauxCotSal"
                    type="text"
                    inputMode="decimal"
                    className="h-8 flex-1 bg-transparent text-sm text-right focus:outline-none"
                    value={tauxCotSal}
                    onChange={(e) => setTauxCotSal(numVal(e.target.value))}
                  />
                  <span className="text-xs text-muted-foreground shrink-0">%</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground" htmlFor="tauxCotPat">
                  Cotisations patronales (%)
                </label>
                <div className="flex items-center gap-1 rounded-md border bg-background px-2">
                  <input
                    id="tauxCotPat"
                    type="text"
                    inputMode="decimal"
                    className="h-8 flex-1 bg-transparent text-sm text-right focus:outline-none"
                    value={tauxCotPat}
                    onChange={(e) => setTauxCotPat(numVal(e.target.value))}
                  />
                  <span className="text-xs text-muted-foreground shrink-0">%</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ── Pied ── */}
        <DialogFooter className="px-6 py-4 border-t shrink-0 flex-row gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button size="sm" onClick={handleApply}>
            Appliquer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


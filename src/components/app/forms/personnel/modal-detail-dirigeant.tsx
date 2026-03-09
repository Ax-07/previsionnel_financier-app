"use client";

/**
 * Modal Détail Rémunération Dirigeant
 * ────────────────────────────────────
 * Accessible depuis le bouton « Détail » du tableau Rémunération du dirigeant.
 * Permet de :
 *  - Saisir la répartition mensuelle (montant par mois) sur N / N+1 / N+2
 *  - Recalculer automatiquement montantN / montantN1 / montantN2
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
import { RefreshCw } from "lucide-react";
import {
  createEmptyDetailMensuel,
  type LigneDirigeantRow,
  type DetailMensuelExercice,
} from "@/lib/schemas/personnel";

// ── Types & helpers calendrier ───────────────────────────────────────────────

interface ExerciceCalendrierEntry { dateCloture: string; duree: number; annee: number; }
interface ExerciceConfig { startMonth: number; startYear: number; duree: number; }
type ExercicesConfig = Record<"N" | "N1" | "N2", ExerciceConfig>;

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
 * Distribue un montant annuel uniformément sur les mois actifs de l'exercice.
 * Si le détail existant contient déjà des données, il est restitué tel quel.
 */
function initDetailFromMontant(
  existing: DetailMensuelExercice | undefined | null,
  montantAnnuel: number,
  config: ExerciceConfig,
): DetailMensuelExercice {
  const existingTotal = existing ? totalFromDetail(existing) : 0;

  // Cas 1 : détail existant et total déjà correct → on le conserve tel quel
  if (existingTotal > 0 && Math.abs(existingTotal - montantAnnuel) < 0.01) {
    return existing!;
  }

  // Cas 2 : détail existant mais montant modifié dans le formulaire
  //         → mise à l'échelle proportionnelle pour préserver la répartition mensuelle
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
    const montantMensuel = Math.round((montantAnnuel / config.duree) * 100) / 100;
    const detail = createEmptyDetailMensuel();
    let cumul = 0;
    for (let i = 0; i < config.duree; i++) {
      const absIdx = (config.startMonth + i) % 12;
      detail.effectif[absIdx] = 1;
      if (i < config.duree - 1) {
        detail.brutIndividuel[absIdx] = montantMensuel;
        cumul += montantMensuel;
      } else {
        detail.brutIndividuel[absIdx] = Math.round((montantAnnuel - cumul) * 100) / 100;
      }
    }
    return detail;
  }

  return createEmptyDetailMensuel();
}

// ── Constantes ────────────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function numVal(v: string): number {
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) ? 0 : n;
}

/** Somme des montants mensuels d'un exercice (effectif × brut ou montant direct). */
function totalFromDetail(detail: DetailMensuelExercice): number {
  return detail.brutIndividuel.reduce((acc, v) => acc + (v ?? 0), 0);
}

// ── Types internes ────────────────────────────────────────────────────────────

interface ModalDetailDirigeantProps {
  open: boolean;
  row: LigneDirigeantRow;
  onClose: () => void;
  onApply: (updated: Partial<LigneDirigeantRow>) => void;
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
  const totalAnnuel = useMemo(() => totalFromDetail(detail), [detail]);
  const moisLabels  = useMemo(
    () => buildMoisLabels(exerciceConfig.startMonth, exerciceConfig.startYear, exerciceConfig.duree),
    [exerciceConfig],
  );

  const setMontant = useCallback(
    (idx: number, val: string) => {
      const next = {
        ...detail,
        brutIndividuel: [...detail.brutIndividuel],
        effectif: detail.effectif.map(() => 1), // effectif toujours 1 pour le dirigeant
      };
      next.brutIndividuel[idx] = numVal(val);
      next.effectif[idx] = 1;
      onChange(next);
    },
    [detail, onChange],
  );

  const redistribuer = useCallback(() => {
    if (totalAnnuel <= 0 || exerciceConfig.duree <= 0) return;
    const montantMensuel = Math.round((totalAnnuel / exerciceConfig.duree) * 100) / 100;
    const next = createEmptyDetailMensuel();
    let cumul = 0;
    for (let i = 0; i < exerciceConfig.duree; i++) {
      const absIdx = (exerciceConfig.startMonth + i) % 12;
      next.effectif[absIdx] = 1;
      if (i < exerciceConfig.duree - 1) {
        next.brutIndividuel[absIdx] = montantMensuel;
        cumul += montantMensuel;
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
            <th className="px-2 py-2 text-right text-xs font-medium text-muted-foreground">
              Montant mensuel (€)
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: exerciceConfig.duree }, (_, i) => {
            const absIdx  = (exerciceConfig.startMonth + i) % 12;
            const mois    = moisLabels[i] ?? "";
            const montant = detail.brutIndividuel[absIdx] ?? 0;
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
                    value={montant === 0 ? "" : montant}
                    placeholder="0"
                    onChange={(e) => setMontant(absIdx, e.target.value)}
                    aria-label={`Montant ${mois}`}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="border-t bg-muted/40">
          <tr>
            <td colSpan={2} className="px-2 py-1.5">
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
                <span className="text-xs font-semibold mr-1">
                  Total : <span className="text-primary font-bold tabular-nums">{fmt(totalAnnuel)} €</span>
                </span>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function ModalDetailDirigeant({
  open,
  row,
  onClose,
  onApply,
  dateDebutExerciceN,
  exercices,
}: ModalDetailDirigeantProps) {
  // Config calculée une fois à la création (le composant est remonté via `key` à chaque ouverture)
  const initialConfig = buildExercicesConfig(dateDebutExerciceN, exercices);

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

  const exercicesConfig = useMemo(
    () => buildExercicesConfig(dateDebutExerciceN, exercices),
    [dateDebutExerciceN, exercices],
  );

  const totalN  = useMemo(() => totalFromDetail(detailN),  [detailN]);
  const totalN1 = useMemo(() => totalFromDetail(detailN1), [detailN1]);
  const totalN2 = useMemo(() => totalFromDetail(detailN2), [detailN2]);

  const hasDetailN  = totalN  > 0;
  const hasDetailN1 = totalN1 > 0;
  const hasDetailN2 = totalN2 > 0;

  const handleApply = useCallback(() => {
    // Les montants annuels sont toujours recalculés depuis le total du détail mensuel
    const patch: Partial<LigneDirigeantRow> = {
      detailMensuelN:  detailN,
      detailMensuelN1: detailN1,
      detailMensuelN2: detailN2,
      montantN:  totalN,
      montantN1: totalN1,
      montantN2: totalN2,
    };

    onApply(patch);
  }, [detailN, detailN1, detailN2, totalN, totalN1, totalN2, onApply]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Détail mensuel — {row.libelle || "Rémunération dirigeant"}
          </DialogTitle>
        </DialogHeader>

        {/* Répartition mensuelle par exercice */}
        <Tabs defaultValue="N" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="N" className="text-xs gap-1.5">
              Exercice N
              {hasDetailN && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                  {fmt(totalN)} €
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="N1" className="text-xs gap-1.5">
              Exercice N+1
              {hasDetailN1 && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                  {fmt(totalN1)} €
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="N2" className="text-xs gap-1.5">
              Exercice N+2
              {hasDetailN2 && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                  {fmt(totalN2)} €
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="N" className="mt-3">
            <TableauMensuel detail={detailN} onChange={setDetailN} exerciceConfig={exercicesConfig.N} />
          </TabsContent>
          <TabsContent value="N1" className="mt-3">
            <TableauMensuel detail={detailN1} onChange={setDetailN1} exerciceConfig={exercicesConfig.N1} />
          </TabsContent>
          <TabsContent value="N2" className="mt-3">
            <TableauMensuel detail={detailN2} onChange={setDetailN2} exerciceConfig={exercicesConfig.N2} />
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2 pt-2">
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

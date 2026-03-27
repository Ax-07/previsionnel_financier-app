"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowBigDown, ArrowBigUp, RefreshCw, DollarSign, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChargesStore } from "@/stores/charges-store";
import { useActiviteStore } from "@/stores/activite-store";
import type { ChargeExploitationRow } from "@/lib/schemas/charges";

// ── Types locaux ─────────────────────────────────────────────────────────────

type ExerciceKey = "N" | "N1" | "N2";
type Categorie = "FOURNITURE_CONSOMMABLE" | "SERVICE_EXTERIEUR";
type ModeCalc = "FIXE" | "POURCENTAGE_CA";

interface ExerciceCalendrierEntry {
  dateCloture: string;
  duree: number;
  annee: number;
}

interface ExerciceConfig {
  startMonth: number; // 0–11
  startYear: number;
  duree: number;
}

type ExercicesConfig = Record<ExerciceKey, ExerciceConfig>;

interface DetailChargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dossierId: string;
  chargeIndex: number;
  categorie: Categorie;
  dateDebutExerciceN?: string;
  exercices?: ExerciceCalendrierEntry[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const TOUS_MOIS = [
  "Jan.", "Fév.", "Mar.", "Avr.", "Mai", "Juin",
  "Juil.", "Aoû.", "Sep.", "Oct.", "Nov.", "Déc.",
] as const;

/** Parse une string "YYYY-MM-DD" en Date locale (sans décalage UTC). */
function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Génère les étiquettes « Mar. 26 » pour chaque mois de l'exercice. */
function buildMoisLabels(startMonth: number, startYear: number, duree: number): readonly string[] {
  return Array.from({ length: duree }, (_, i) => {
    const moisIdx = (startMonth + i) % 12;
    const yearOffset = Math.floor((startMonth + i) / 12);
    const yy = String((startYear + yearOffset) % 100).padStart(2, "0");
    return `${TOUS_MOIS[moisIdx]} ${yy}`;
  });
}

/** Répartition équitable sur `duree` mois. */
function buildEvenSaisonnalite(duree: number): number[] {
  const val = +(100 / duree).toFixed(2);
  const last = +(100 - val * (duree - 1)).toFixed(2);
  return [...Array(duree - 1).fill(val), last];
}

/** Calcule startMonth, startYear et duree pour chaque exercice. */
function buildExercicesConfig(
  dateDebutN: string | undefined,
  exercices: ExerciceCalendrierEntry[] | undefined,
): ExercicesConfig {
  const currentYear = new Date().getFullYear();
  const DEFAULT: ExerciceConfig = { startMonth: 0, startYear: currentYear, duree: 12 };
  if (!dateDebutN) return { N: DEFAULT, N1: DEFAULT, N2: DEFAULT };

  const [yearNStr, monthNStr] = dateDebutN.split("-");
  const startN     = parseInt(monthNStr, 10) - 1;
  const startYearN = parseInt(yearNStr, 10);
  const dureeN     = exercices?.[0]?.duree ?? 12;

  let startN1 = 0, startYearN1 = startYearN;
  const dureeN1 = exercices?.[1]?.duree ?? 12;
  if (exercices?.[0]?.dateCloture) {
    const clot = parseLocalDate(exercices[0].dateCloture);
    clot.setDate(clot.getDate() + 1);
    startN1     = clot.getMonth();
    startYearN1 = clot.getFullYear();
  }

  let startN2 = 0, startYearN2 = startYearN1;
  const dureeN2 = exercices?.[2]?.duree ?? 12;
  if (exercices?.[1]?.dateCloture) {
    const clot = parseLocalDate(exercices[1].dateCloture);
    clot.setDate(clot.getDate() + 1);
    startN2     = clot.getMonth();
    startYearN2 = clot.getFullYear();
  }

  return {
    N:  { startMonth: startN,  startYear: startYearN,  duree: dureeN  },
    N1: { startMonth: startN1, startYear: startYearN1, duree: dureeN1 },
    N2: { startMonth: startN2, startYear: startYearN2, duree: dureeN2 },
  };
}

function numVal(v: string) {
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function fmt(v: number, dec = 0) {
  return v === 0 ? "—" : v.toLocaleString("fr-FR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

// Calcul montant mensuel = montantAnnuel × (saisonnalité / 100)
function calcMontants(montantAnnuel: number, saison: number[]): number[] {
  return saison.map((p) => +(montantAnnuel * (p / 100)).toFixed(2));
}

const cellInput =
  "h-7 w-full border-0 bg-transparent px-1 text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none min-w-0";

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn("px-2 py-1.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap", className)}>
      {children}
    </th>
  );
}

// ── Tableau mensuel générique ────────────────────────────────────────────────

interface LigneMensuelle {
  label: string;
  values: number[];
  total: number;
  format: "euro" | "percent";
  editable?: boolean;
  onChange?: (idx: number, val: string) => void;
  highlight?: boolean;
  totalClass?: string;
}

function fmtCell(v: number, f: LigneMensuelle["format"]) {
  if (f === "euro") return v === 0 ? "—" : v.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
  return v.toFixed(2);
}

function fmtTotalCell(v: number, f: LigneMensuelle["format"]) {
  if (f === "euro") return v === 0 ? "—" : v.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
  return `${v.toFixed(2)} %`;
}

function TableauMensuel({ lignes, moisLabels }: { lignes: LigneMensuelle[]; moisLabels?: readonly string[] }) {
  const mois = moisLabels ?? TOUS_MOIS;
  return (
    <div className="rounded border border-border overflow-x-auto">
      <table className="text-sm border-collapse" style={{ minWidth: `${Math.max(900, 160 + mois.length * 64)}px`, width: "100%" }}>
        <thead className="bg-muted/50">
          <tr>
            <th className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap sticky left-0 bg-muted/50 z-10 w-40">
              Libellé
            </th>
            {mois.map((m) => (
              <th key={m} className="px-1 py-1.5 text-center text-xs font-medium text-muted-foreground whitespace-nowrap w-16">
                {m}
              </th>
            ))}
            <th className="px-2 py-1.5 text-right text-xs font-medium text-muted-foreground whitespace-nowrap w-20 border-l border-border">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((ligne, rowIdx) => (
            <tr
              key={rowIdx}
              className={cn(
                "border-t border-border",
                ligne.highlight ? "bg-muted/20" : "bg-background hover:bg-muted/10 transition-colors",
              )}
            >
              <td className={cn(
                "px-2 py-1.5 text-xs whitespace-nowrap sticky left-0 z-10",
                ligne.highlight ? "bg-muted/20 font-semibold text-foreground" : "bg-background text-muted-foreground",
              )}>
                {ligne.label}
              </td>
              {ligne.values.map((val, idx) => (
                <td key={idx} className="px-0 py-0 align-middle border-r border-border/40 last:border-r-0 w-14">
                  {ligne.editable ? (
                    <input
                      type="number"
                      className={cn(cellInput, "text-right")}
                      value={val === 0 ? "" : val}
                      placeholder="0"
                      step={ligne.format === "percent" ? "0.01" : "1"}
                      onChange={(e) => ligne.onChange?.(idx, e.target.value)}
                    />
                  ) : (
                    <span className={cn(
                      "block px-1 py-1.5 text-xs text-right tabular-nums",
                      val === 0 ? "text-muted-foreground/40" : ligne.highlight ? "font-semibold" : "",
                    )}>
                      {fmtCell(val, ligne.format)}
                    </span>
                  )}
                </td>
              ))}
              <td className={cn(
                "px-2 py-1.5 text-xs font-semibold text-right tabular-nums w-20 border-l border-border",
                ligne.totalClass,
              )}>
                {fmtTotalCell(ligne.total, ligne.format)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Corps du dialog (key → réinitialisation auto des états) ──────────────────

interface DialogBodyProps {
  dossierId: string;
  currentIndex: number;
  categorie: Categorie;
  charge: ChargeExploitationRow;
  exercicesConfig: ExercicesConfig;
}

function DialogBody({ dossierId, currentIndex, categorie, charge, exercicesConfig }: DialogBodyProps) {
  const { updateFourniture, updateService } = useChargesStore();
  const updateCharge = categorie === "FOURNITURE_CONSOMMABLE" ? updateFourniture : updateService;

  const activiteDraft = useActiviteStore((s) => s.getDraft(dossierId));
  const activites = activiteDraft.activites;

  // ── Helpers pour lire detailCalc stocké ────────────────
  const stored = charge.detailCalc;
  const storedTaux = stored?.tauxParActivite;
  const storedSel  = stored?.activitesSel;

  // ── Mode de calcul — initialisé depuis le store ─────────
  const [modeCalc, setModeCalc] = useState<ModeCalc>(
    stored?.modeCalc ?? "FIXE"
  );

  // ── Mode % CA : taux et sélection par activité ──────────
  const [tauxParActivite, setTauxParActivite] = useState<Record<ExerciceKey, Record<number, number>>>(() => {
    if (storedTaux) {
      return {
        N:  Object.fromEntries(Object.entries(storedTaux["N"]  ?? {}).map(([k, v]) => [Number(k), v])),
        N1: Object.fromEntries(Object.entries(storedTaux["N1"] ?? {}).map(([k, v]) => [Number(k), v])),
        N2: Object.fromEntries(Object.entries(storedTaux["N2"] ?? {}).map(([k, v]) => [Number(k), v])),
      };
    }
    return { N: {}, N1: {}, N2: {} };
  });

  const [activitesSel, setActivitesSel] = useState<Record<number, boolean>>(() => {
    if (storedSel) {
      return Object.fromEntries(Object.entries(storedSel).map(([k, v]) => [Number(k), v]));
    }
    return {};
  });

  // ── Helpers de calcul ────────────────────────────────────

  function getMontant(ex: ExerciceKey) {
    return ex === "N" ? charge.montantN : ex === "N1" ? charge.montantN1 : charge.montantN2;
  }

  function getActiviteMontant(activiteIdx: number, ex: ExerciceKey) {
    const a = activites[activiteIdx];
    if (!a) return 0;
    return ex === "N" ? a.montantN : ex === "N1" ? a.montantN1 : a.montantN2;
  }

  function calcBaseActivite(activiteIdx: number, ex: ExerciceKey) {
    const taux = (tauxParActivite[ex]?.[activiteIdx] ?? 0) / 100;
    return +(getActiviteMontant(activiteIdx, ex) * taux).toFixed(2);
  }

  function totalBaseCA(ex: ExerciceKey) {
    return activites.reduce((sum, _, i) => {
      if (!activitesSel[i]) return sum;
      return sum + calcBaseActivite(i, ex);
    }, 0);
  }

  /**
   * Calcule la saisonnalité pondérée depuis les activités sélectionnées.
   * Chaque activité contribue proportionnellement à son montant dans le total.
   * Fallback : saisonnalité de l'année N si N1/N2 non renseignée, puis répartition équitable.
   */
  function computeSaisonnaliteFromActivites(ex: ExerciceKey): number[] {
    const duree = exercicesConfig[ex].duree;
    const exKey = ex === "N" ? "N" : ex === "N1" ? "N1" : "N2";
    const total = totalBaseCA(ex);
    if (total === 0) return buildEvenSaisonnalite(duree);

    const result = Array(duree).fill(0) as number[];
    for (let i = 0; i < activites.length; i++) {
      if (!activitesSel[i]) continue;
      const contribution = calcBaseActivite(i, ex);
      if (contribution === 0) continue;
      const weight = contribution / total;
      const saisons = activites[i]?.saisonnaliteCA as Record<string, number[]> | undefined;
      // Fallback : saisonnalité de l'année N si l'année cible n'est pas renseignée
      const actSaisonRaw = saisons?.[exKey] ?? saisons?.["N"];
      const actSaison = Array.isArray(actSaisonRaw) && actSaisonRaw.length >= duree
        ? actSaisonRaw
        : buildEvenSaisonnalite(duree);
      for (let m = 0; m < duree; m++) {
        result[m] += weight * (actSaison[m] ?? 0);
      }
    }
    // Normaliser à 100 % pour absorber les arrondis
    const sum = result.reduce((a, b) => a + b, 0);
    if (sum > 0.01) {
      const normalized = result.map((v) => +(v * 100 / sum).toFixed(2));
      // Ajustement du dernier mois pour sum = 100 exactement
      const diff = +(100 - normalized.slice(0, -1).reduce((a, b) => a + b, 0)).toFixed(2);
      normalized[normalized.length - 1] = diff;
      return normalized;
    }
    return buildEvenSaisonnalite(duree);
  }

  // ── Saisonnalité mensuelle — initialisée depuis le store ou depuis activités ──
  const [saisonnalite, setSaisonnalite] = useState<Record<ExerciceKey, number[]>>(() => {
    const savedSaison = stored?.saisonnaliteCA;
    return {
      N:  Array.isArray(savedSaison?.["N"])  ? savedSaison["N"]  : buildEvenSaisonnalite(exercicesConfig.N.duree),
      N1: Array.isArray(savedSaison?.["N1"]) ? savedSaison["N1"] : buildEvenSaisonnalite(exercicesConfig.N1.duree),
      N2: Array.isArray(savedSaison?.["N2"]) ? savedSaison["N2"] : buildEvenSaisonnalite(exercicesConfig.N2.duree),
    };
  });

  // ── Persistance : sync tous les états dans le store dès qu'ils changent ──
  // (le store persiste en localStorage ; la DB est mise à jour lors du Save)
  useEffect(() => {
    updateCharge(dossierId, currentIndex, {
      detailCalc: {
        modeCalc,
        saisonnaliteCA: saisonnalite,
        tauxParActivite: {
          N:  Object.fromEntries(Object.entries(tauxParActivite.N).map(([k, v]) => [k, v])),
          N1: Object.fromEntries(Object.entries(tauxParActivite.N1).map(([k, v]) => [k, v])),
          N2: Object.fromEntries(Object.entries(tauxParActivite.N2).map(([k, v]) => [k, v])),
        },
        activitesSel: Object.fromEntries(Object.entries(activitesSel).map(([k, v]) => [k, v])),
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeCalc, saisonnalite, tauxParActivite, activitesSel]);

  // ── Mode % CA : recalcul montants + saisonnalité quand taux/sélection changent ──
  useEffect(() => {
    if (modeCalc !== "POURCENTAGE_CA") return;
    const n  = totalBaseCA("N");
    const n1 = totalBaseCA("N1");
    const n2 = totalBaseCA("N2");
    updateCharge(dossierId, currentIndex, { montantN: n, montantN1: n1, montantN2: n2 });
    // Recalcule la saisonnalité pondérée depuis les activités
    setSaisonnalite({
      N:  computeSaisonnaliteFromActivites("N"),
      N1: computeSaisonnaliteFromActivites("N1"),
      N2: computeSaisonnaliteFromActivites("N2"),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeCalc, tauxParActivite, activitesSel]);

  function handleTaux(ex: ExerciceKey, activiteIdx: number, val: string) {
    setTauxParActivite((prev) => ({
      ...prev,
      [ex]: { ...prev[ex], [activiteIdx]: numVal(val) },
    }));
  }

  function handleSaison(ex: ExerciceKey, idx: number, val: string) {
    setSaisonnalite((prev) => {
      const updated = [...prev[ex]];
      updated[idx] = numVal(val);
      // Auto-switch à PERSONNALISEE dès que la répartition devient non-uniforme
      const isUniform = updated.every((v) => Math.abs(v - updated[0]!) < 0.01);
      if (!isUniform) {
        updateCharge(dossierId, currentIndex, { frequence: "PERSONNALISEE" });
      }
      return { ...prev, [ex]: updated };
    });
  }

  function handleRepartir(ex: ExerciceKey) {
    // Répartition équitable → revenir en MENSUELLE
    updateCharge(dossierId, currentIndex, { frequence: "MENSUELLE" });
    setSaisonnalite((prev) => ({ ...prev, [ex]: buildEvenSaisonnalite(exercicesConfig[ex].duree) }));
  }

  function handleMontantFixe(ex: ExerciceKey, val: string) {
    const v = numVal(val);
    if (ex === "N") {
      const n1 = +(v * (1 + charge.evolutionN1 / 100)).toFixed(2);
      const n2 = +(n1 * (1 + charge.evolutionN2 / 100)).toFixed(2);
      updateCharge(dossierId, currentIndex, { montantN: v, montantN1: n1, montantN2: n2 });
    } else if (ex === "N1") {
      const n2 = +(v * (1 + charge.evolutionN2 / 100)).toFixed(2);
      updateCharge(dossierId, currentIndex, { montantN1: v, montantN2: n2 });
    } else {
      updateCharge(dossierId, currentIndex, { montantN2: v });
    }
  }

  // ── Changement de mode : synchronise aussi la fréquence dans le store ──
  function handleSetModeCalc(mode: ModeCalc) {
    setModeCalc(mode);
    if (mode === "POURCENTAGE_CA") {
      // Distribution saisonnière pilotée par le CA → fréquence Personnalisée
      updateCharge(dossierId, currentIndex, { frequence: "PERSONNALISEE" });
    } else {
      // Retour en FIXE → réinitialiser à Mensuelle (l'utilisateur peut repasser en
      // Personnalisée via handleSaison s'il modifie la répartition manuellement)
      updateCharge(dossierId, currentIndex, { frequence: "MENSUELLE" });
    }
  }

  // ── Rendu ────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Toggle mode de calcul ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 p-1 rounded-lg bg-muted/50 border border-border w-fit">
        <button
          type="button"
          onClick={() => handleSetModeCalc("FIXE")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
            modeCalc === "FIXE"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <DollarSign className="h-3 w-3" />
          Valeur fixe
        </button>
        <button
          type="button"
          onClick={() => handleSetModeCalc("POURCENTAGE_CA")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
            modeCalc === "POURCENTAGE_CA"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Percent className="h-3 w-3" />
          % du CA HT
        </button>
      </div>

      {/* ── Mode FIXE : saisie directe des montants ────────────────────── */}
      {modeCalc === "FIXE" && (
        <div className="rounded border border-border bg-muted/20 px-4 py-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Montants annuels
          </p>
          <div className="grid grid-cols-3 gap-4">
            {(["N", "N1", "N2"] as ExerciceKey[]).map((ex) => (
              <div key={ex} className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Exercice {ex === "N" ? "N" : ex} (€)
                </label>
                <input
                  type="number"
                  className="h-8 w-full rounded border border-border bg-background px-2 text-right text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={getMontant(ex) || ""}
                  placeholder="0"
                  onChange={(e) => handleMontantFixe(ex, e.target.value)}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground pt-1">
            N+1 et N+2 sont recalculés automatiquement depuis N avec les taux d&apos;évolution saisis dans le tableau.
          </p>
        </div>
      )}

      {/* ── Mode % CA : tableau activités ─────────────────────────────── */}
      {modeCalc === "POURCENTAGE_CA" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Calcul sur le CA des activités
            </p>
            {activites.length === 0 && (
              <p className="text-xs text-amber-600">
                Aucune activité — saisir d&apos;abord dans l&apos;onglet Activité.
              </p>
            )}
          </div>

          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-muted/50">
                <tr>
                  <Th className="w-8 text-center">Sél.</Th>
                  <Th className="min-w-36">Activité</Th>
                  <Th className="w-24">Hypothèse</Th>
                  <Th className="w-14 text-center">N %</Th>
                  <Th className="w-24 text-right">N (€)</Th>
                  <Th className="w-14 text-center">N+1 %</Th>
                  <Th className="w-24 text-right">N+1 (€)</Th>
                  <Th className="w-14 text-center">N+2 %</Th>
                  <Th className="w-24 text-right">N+2 (€)</Th>
                </tr>
              </thead>
              <tbody>
                {activites.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-muted-foreground text-xs py-5">
                      Aucune activité saisie.
                    </td>
                  </tr>
                ) : (
                  activites.map((a, i) => {
                    const sel = activitesSel[i] ?? false;
                    return (
                      <tr
                        key={i}
                        className={cn(
                          "border-t border-border bg-background hover:bg-muted/30 transition-colors",
                          !sel && "opacity-50",
                        )}
                      >
                        <td className="text-center px-1.5">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 cursor-pointer accent-primary"
                            checked={sel}
                            onChange={(e) =>
                              setActivitesSel((prev) => ({ ...prev, [i]: e.target.checked }))
                            }
                          />
                        </td>
                        <td className="px-2 py-1.5 text-xs font-medium">
                          {a.libelle || <span className="text-muted-foreground/50 italic">Sans nom</span>}
                        </td>
                        <td className="px-2 py-1.5 text-xs text-muted-foreground">{a.hypothese}</td>

                        {(["N", "N1", "N2"] as ExerciceKey[]).map((ex) => (
                          <>
                            <td key={`${ex}-pct`} className="p-0">
                              <input
                                type="number"
                                className={cn(cellInput, "text-right")}
                                value={tauxParActivite[ex][i] ?? ""}
                                placeholder="0"
                                step={0.01}
                                disabled={!sel}
                                onChange={(e) => handleTaux(ex, i, e.target.value)}
                              />
                            </td>
                            <td key={`${ex}-base`} className="px-2 py-1.5 text-xs text-right tabular-nums text-muted-foreground bg-muted/20">
                              {fmt(calcBaseActivite(i, ex), 0)}
                            </td>
                          </>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
              {activites.length > 0 && (
                <tfoot className="border-t-2 border-border bg-muted/40">
                  <tr>
                    <td colSpan={4} className="px-2 py-1.5 text-xs font-semibold text-right text-muted-foreground">
                      Total charge calculée
                    </td>
                    <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                      {fmt(totalBaseCA("N"))} €
                    </td>
                    <td />
                    <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                      {fmt(totalBaseCA("N1"))} €
                    </td>
                    <td />
                    <td className="px-2 py-1.5 text-xs font-semibold text-right tabular-nums">
                      {fmt(totalBaseCA("N2"))} €
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Résumé des montants calculés */}
          <div className="flex items-center gap-2 rounded border border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
            <Percent className="h-3 w-3 shrink-0" />
            <span>
              Montants mis à jour automatiquement :
              <span className="font-semibold text-foreground mx-1">N = {fmt(getMontant("N"))} €</span>·
              <span className="font-semibold text-foreground mx-1">N+1 = {fmt(getMontant("N1"))} €</span>·
              <span className="font-semibold text-foreground mx-1">N+2 = {fmt(getMontant("N2"))} €</span>
            </span>
          </div>
        </div>
      )}

      {/* ── Répartition mensuelle (toujours visible) ───────────────────── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Répartition mensuelle
        </p>

        <Tabs defaultValue="N" className="w-full space-y-3">
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="N" className="text-xs">Exercice N</TabsTrigger>
            <TabsTrigger value="N1" className="text-xs">N+1</TabsTrigger>
            <TabsTrigger value="N2" className="text-xs">N+2</TabsTrigger>
          </TabsList>

          {(["N", "N1", "N2"] as ExerciceKey[]).map((ex) => {
            const cfg = exercicesConfig[ex];
            const saison = saisonnalite[ex];
            const totalSaison = +saison.reduce((s, v) => s + v, 0).toFixed(2);
            const saisonOk = Math.abs(totalSaison - 100) < 0.1;
            // En mode % CA, lire le montant calculé directement depuis l'état local
            // (totalBaseCA) plutôt que depuis le store (charge.montantN1 etc.) qui
            // n'est mis à jour qu'après le prochain cycle de rendu via useEffect.
            const montant = modeCalc === "POURCENTAGE_CA" ? totalBaseCA(ex) : getMontant(ex);
            const montants = calcMontants(montant, saison);
            const totalMontants = montants.reduce((a, b) => a + b, 0);
            const moisLabels = buildMoisLabels(cfg.startMonth, cfg.startYear, cfg.duree);

            return (
              <TabsContent key={ex} value={ex} className="space-y-3 mt-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Charge à répartir :{" "}
                    <span className="font-semibold text-foreground">
                      {montant.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €
                    </span>
                    {" "}— total saisonnalité :{" "}
                    <span className={cn("font-semibold", saisonOk ? "text-green-600 dark:text-green-400" : "text-destructive")}>
                      {totalSaison.toFixed(2)} %
                    </span>
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => handleRepartir(ex)}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Répartir équitablement
                  </Button>
                </div>

                <TableauMensuel
                  moisLabels={moisLabels}
                  lignes={[
                    {
                      label: "Saisonnalité (%)",
                      values: saison,
                      total: totalSaison,
                      format: "percent",
                      editable: true,
                      onChange: (i, v) => handleSaison(ex, i, v),
                      totalClass: saisonOk
                        ? "text-green-600 dark:text-green-400"
                        : "text-destructive",
                    },
                    {
                      label: "Montant charge (€)",
                      values: montants,
                      total: totalMontants,
                      format: "euro",
                      highlight: true,
                    },
                  ]}
                />
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
}

// ── Composant principal ──────────────────────────────────────────────────────

export function DetailChargeDialog({
  open,
  onOpenChange,
  dossierId,
  chargeIndex,
  categorie,
  dateDebutExerciceN,
  exercices,
}: DetailChargeDialogProps) {
  const store = useChargesStore();
  const draft = store.getDraft(dossierId);

  const rows = categorie === "FOURNITURE_CONSOMMABLE" ? draft.fournitures : draft.services;
  const total = rows.length;
  const exercicesConfig = buildExercicesConfig(dateDebutExerciceN, exercices);

  const [currentIndex, setCurrentIndex] = useState(chargeIndex);

  // Sync currentIndex quand le dialog s'ouvre sur une ligne différente.
  // DetailChargeDialog est toujours monté (jamais démonté) → useState n'init qu'une fois.
  useEffect(() => {
    if (open) setCurrentIndex(chargeIndex);
  }, [open, chargeIndex]);

  const goTo = useCallback(
    (idx: number) => {
      if (idx >= 0 && idx < total) setCurrentIndex(idx);
    },
    [total],
  );

  const charge = rows[currentIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-start gap-4 pr-8">
          {total > 1 && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => goTo(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Charge précédente"
              >
                <ArrowBigUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => goTo(currentIndex + 1)}
                disabled={currentIndex === total - 1}
                className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Charge suivante"
              >
                <ArrowBigDown className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="flex flex-col">
            <DialogTitle className="text-base font-semibold truncate">
              Détail : {charge?.libelle || "Sans nom"}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {categorie === "FOURNITURE_CONSOMMABLE" ? "Fourniture consommable" : "Service extérieur"}{" "}
              — {currentIndex + 1} / {total}
            </p>
          </div>
        </DialogHeader>

        {charge ? (
          /* key=currentIndex → React recrée DialogBody et remet les états locaux à zéro */
          <DialogBody
            key={currentIndex}
            dossierId={dossierId}
            currentIndex={currentIndex}
            categorie={categorie}
            charge={charge}
            exercicesConfig={exercicesConfig}
          />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">Charge introuvable.</p>
        )}

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link2, Link2Off, ArrowBigDown, ArrowBigUp, CopyCheck, ArrowDownToLine, ChevronDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useActiviteStore } from "@/stores/activite-store";
import { MODES_CA, MODES_MARGE, MODES_EXIGIBILITE_TVA, TAUX_TVA_OPTIONS } from "@/lib/schemas/activite";

// ── Types locaux ─────────────────────────────────────────────────────────────

type ExerciceKey = "N" | "N1" | "N2";

/** Entrée calendaire d'un exercice — isomorphe à ExerciceFormValues */
interface ExerciceCalendrierEntry {
  dateCloture: string;
  duree: number;
  annee: number;
}

interface DetailActiviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dossierId: string;
  activiteIndex: number;
  dateDebutExerciceN?: string;
  exercices?: ExerciceCalendrierEntry[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const TOUS_MOIS = [
  "Jan.",
  "Fév.",
  "Mar.",
  "Avr.",
  "Mai",
  "Juin",
  "Juil.",
  "Aoû.",
  "Sep.",
  "Oct.",
  "Nov.",
  "Déc.",
] as const;

/** Parse une string "YYYY-MM-DD" en Date locale (sans décalage UTC). */
function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

interface ExerciceConfig {
  startMonth: number; // 0–11 (0 = Jan)
  startYear: number; // ex. 2026
  duree: number; // nombre de mois réels (1–24)
}

type ExercicesConfig = Record<ExerciceKey, ExerciceConfig>;

/** Génère les étiquettes de mois « Mar. 26 » à partir du mois/année de départ et de la durée. */
function buildMoisLabels(startMonth: number, startYear: number, duree: number): readonly string[] {
  return Array.from({ length: duree }, (_, i) => {
    const moisIdx = (startMonth + i) % 12;
    const yearOffset = Math.floor((startMonth + i) / 12);
    const yy = String((startYear + yearOffset) % 100).padStart(2, "0");
    return `${TOUS_MOIS[moisIdx]} ${yy}`;
  });
}

/** Répartition équitable sur `duree` mois (dernier mois absorbe l'arrondi). */
function buildEvenSaisonnalite(duree: number): number[] {
  const val = +(100 / duree).toFixed(2);
  const last = +(100 - val * (duree - 1)).toFixed(2);
  return [...Array(duree - 1).fill(val), last];
}

/** Calcule startMonth, startYear et duree pour chaque exercice depuis les données entreprise. */
function buildExercicesConfig(
  dateDebutN: string | undefined,
  exercices: ExerciceCalendrierEntry[] | undefined,
): ExercicesConfig {
  const currentYear = new Date().getFullYear();
  const DEFAULT: ExerciceConfig = { startMonth: 0, startYear: currentYear, duree: 12 };
  if (!dateDebutN) return { N: DEFAULT, N1: DEFAULT, N2: DEFAULT };

  const [yearNStr, monthNStr] = dateDebutN.split("-");
  const startN = parseInt(monthNStr, 10) - 1;
  const startYearN = parseInt(yearNStr, 10);
  const dureeN = exercices?.[0]?.duree ?? 12;

  let startN1 = 0,
    startYearN1 = startYearN;
  const dureeN1 = exercices?.[1]?.duree ?? 12;
  if (exercices?.[0]?.dateCloture) {
    const clot = parseLocalDate(exercices[0].dateCloture);
    clot.setDate(clot.getDate() + 1);
    startN1 = clot.getMonth();
    startYearN1 = clot.getFullYear();
  }

  let startN2 = 0,
    startYearN2 = startYearN1;
  const dureeN2 = exercices?.[2]?.duree ?? 12;
  if (exercices?.[1]?.dateCloture) {
    const clot = parseLocalDate(exercices[1].dateCloture);
    clot.setDate(clot.getDate() + 1);
    startN2 = clot.getMonth();
    startYearN2 = clot.getFullYear();
  }

  return {
    N: { startMonth: startN, startYear: startYearN, duree: dureeN },
    N1: { startMonth: startN1, startYear: startYearN1, duree: dureeN1 },
    N2: { startMonth: startN2, startYear: startYearN2, duree: dureeN2 },
  };
}

/**
 * Rééchantillonne un tableau de saisonnalité vers une nouvelle longueur cible
 * en répartissant proportionnellement, puis renormalise à 100 %.
 */
function resampleSaisonnalite(source: number[], targetLen: number): number[] {
  if (targetLen === source.length) return [...source];
  const result: number[] = [];
  const srcLen = source.length;
  for (let i = 0; i < targetLen; i++) {
    // position proportionnelle dans la source
    const ratio = (i / targetLen) * srcLen;
    const lo = Math.floor(ratio);
    const hi = Math.min(lo + 1, srcLen - 1);
    const frac = ratio - lo;
    result.push(source[lo]! * (1 - frac) + source[hi]! * frac);
  }
  // Renormalise à 100 %
  const total = result.reduce((s, v) => s + v, 0);
  if (total === 0) return Array(targetLen).fill(+(100 / targetLen).toFixed(4));
  return result.map((v) => +((v / total) * 100).toFixed(4));
}

function numVal(v: string) {
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function intVal(v: string) {
  const n = parseInt(v, 10);
  return isNaN(n) ? 0 : n;
}

// Styles identiques à activite-form.tsx
const cellInput =
  "h-7 w-full border-0 bg-transparent px-1 text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none min-w-0";

const cellSelect =
  "h-7 w-full border-0 bg-transparent px-1 text-sm focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none cursor-pointer";

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn("px-2 py-1.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap", className)}>
      {children}
    </th>
  );
}

function ParamLabel({ children }: { children?: React.ReactNode }) {
  return (
    <td className="px-2 py-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap w-40 border-t border-border">
      {children}
    </td>
  );
}

function ParamCell({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("py-0 align-middle border-t border-border w-44", className)}>{children}</td>;
}

// ── Tableau mensuel générique (lignes = catégories, colonnes = mois) ─────────

interface LigneMensuelle {
  label: string;
  values: number[]; // 12 valeurs mensuelles
  total: number;
  format: "euro" | "percent" | "decimal";
  editable?: boolean;
  onChange?: (idx: number, val: string) => void;
  highlight?: boolean; // fond accentué + gras
  totalClass?: string; // classes CSS pour la cellule Total
}

function fmtVal(v: number, format: LigneMensuelle["format"]): string {
  if (format === "euro") return v === 0 ? "—" : v.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
  if (format === "percent") return v.toFixed(2);
  return v.toFixed(0);
}

function fmtTotal(v: number, format: LigneMensuelle["format"]): string {
  if (format === "euro") return v === 0 ? "—" : v.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
  if (format === "percent") return `${v.toFixed(2)} %`;
  return v.toFixed(0);
}

function TableauMensuel({ lignes, moisLabels }: { lignes: LigneMensuelle[]; moisLabels?: readonly string[] }) {
  const mois = moisLabels ?? TOUS_MOIS;
  return (
    <div className="rounded border border-border overflow-x-auto">
      <table className="text-sm border-collapse" style={{ minWidth: "960px", width: "100%" }}>
        <thead className="bg-muted/50">
          <tr>
            <th className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap sticky left-0 bg-muted/50 z-10 w-44">
              Libellé
            </th>
            {mois.map((m) => (
              <th
                key={m}
                className="px-1 py-1.5 text-center text-xs font-medium text-muted-foreground whitespace-nowrap w-15"
              >
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
                ligne.highlight ? "bg-muted/20" : "bg-background hover:bg-muted/20 transition-colors",
              )}
            >
              {/* Libellé — sticky */}
              <td
                className={cn(
                  "px-2 py-1.5 text-xs whitespace-nowrap sticky left-0 z-10",
                  ligne.highlight ? "bg-muted/20 font-semibold text-foreground" : "bg-background text-muted-foreground",
                )}
              >
                {ligne.label}
              </td>

              {/* Cellules mensuelles */}
              {ligne.values.map((val, idx) => (
                <td key={idx} className="px-0 py-0 align-middle border-r border-border/40 last:border-r-0 w-15">
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
                    <span
                      className={cn(
                        "block px-1 py-1.5 text-xs text-right tabular-nums",
                        val === 0 ? "text-muted-foreground/40" : ligne.highlight ? "font-semibold" : "",
                      )}
                    >
                      {fmtVal(val, ligne.format)}
                    </span>
                  )}
                </td>
              ))}

              {/* Total */}
              <td
                className={cn(
                  "px-2 py-1.5 text-xs font-semibold text-right tabular-nums w-20 border-l border-border",
                  ligne.totalClass,
                )}
              >
                {fmtTotal(ligne.total, ligne.format)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Composant interne : corps de la dialog (key=currentIndex → reset auto) ──

interface DialogBodyProps {
  dossierId: string;
  currentIndex: number;
  exercicesConfig: ExercicesConfig;
}

function DialogBody({ dossierId, currentIndex, exercicesConfig }: DialogBodyProps) {
  const { getDraft, updateActivite } = useActiviteStore();
  const draft = getDraft(dossierId);
  const activite = draft.activites[currentIndex];

  // Paramètres locaux (pas encore dans le schéma)
  const [modeCA, setModeCA] = useState<string>("CA_GLOBAL");
  const [encours, setEncours] = useState(false);
  const [exigibiliteTVAVentes, setExigibiliteTVAVentes] = useState("FACTURATION");
  const [modeMarge, setModeMarge] = useState("TAUX_MARGE");
  const [exigibiliteTVAAchats, setExigibiliteTVAAchats] = useState("FACTURATION");

  // Saisonnalité CA — par exercice (doit sommer à 100 %)
  // La longueur du tableau suit la durée réelle de l'exercice
  const [saisonnalite, setSaisonnalite] = useState<Record<ExerciceKey, number[]>>(() => {
    const stored = activite?.saisonnaliteCA as Record<string, number[]> | undefined;
    return {
      N: stored?.N ?? buildEvenSaisonnalite(exercicesConfig.N.duree),
      N1: stored?.N1 ?? buildEvenSaisonnalite(exercicesConfig.N1.duree),
      N2: stored?.N2 ?? buildEvenSaisonnalite(exercicesConfig.N2.duree),
    };
  });

  // Synchronisation saisonnalité CA ↔ Achats
  const [syncSaisonnalite, setSyncSaisonnalite] = useState(true);

  // Saisonnalité Achats — indépendante quand syncSaisonnalite = false
  const [saisonnaliteAchats, setSaisonnaliteAchats] = useState<Record<ExerciceKey, number[]>>(() => {
    const storedAchats = activite?.saisonnaliteAchats as Record<string, number[]> | undefined;
    if (storedAchats)
      return {
        N: storedAchats.N ?? buildEvenSaisonnalite(exercicesConfig.N.duree),
        N1: storedAchats.N1 ?? buildEvenSaisonnalite(exercicesConfig.N1.duree),
        N2: storedAchats.N2 ?? buildEvenSaisonnalite(exercicesConfig.N2.duree),
      };
    const storedCA = activite?.saisonnaliteCA as Record<string, number[]> | undefined;
    return {
      N: storedCA?.N ?? buildEvenSaisonnalite(exercicesConfig.N.duree),
      N1: storedCA?.N1 ?? buildEvenSaisonnalite(exercicesConfig.N1.duree),
      N2: storedCA?.N2 ?? buildEvenSaisonnalite(exercicesConfig.N2.duree),
    };
  });

  // Achats de stock ponctuel par exercice (éditables par mois) — chargés depuis les données persistées
  const [achatsStockPonctuel, setAchatsStockPonctuel] = useState<Record<ExerciceKey, number[]>>(() => {
    const stored = activite?.achatsStockPonctuel as Record<string, number[]> | undefined;
    return {
      N:  stored?.N  ?? Array(exercicesConfig.N.duree).fill(0),
      N1: stored?.N1 ?? Array(exercicesConfig.N1.duree).fill(0),
      N2: stored?.N2 ?? Array(exercicesConfig.N2.duree).fill(0),
    };
  });

  // Import saisonnalité depuis une autre ligne
  const [importPopoverOpen, setImportPopoverOpen] = useState(false);

  if (!activite) return null;

  const getMontant = (ex: ExerciceKey) =>
    ex === "N" ? activite.montantN : ex === "N1" ? activite.montantN1 : activite.montantN2;

  function handleSaisonnalite(ex: ExerciceKey, idx: number, val: string) {
    setSaisonnalite((prev) => {
      const updated = [...prev[ex]];
      updated[idx] = numVal(val);
      const next = { ...prev, [ex]: updated };
      // Persist dans le store
      if (syncSaisonnalite) {
        setSaisonnaliteAchats(next);
        updateActivite(dossierId, currentIndex, { saisonnaliteCA: next, saisonnaliteAchats: next });
      } else {
        updateActivite(dossierId, currentIndex, { saisonnaliteCA: next });
      }
      return next;
    });
  }

  function handleSaisonnaliteAchats(ex: ExerciceKey, idx: number, val: string) {
    setSaisonnaliteAchats((prev) => {
      const updated = [...prev[ex]];
      updated[idx] = numVal(val);
      const next = { ...prev, [ex]: updated };
      updateActivite(dossierId, currentIndex, { saisonnaliteAchats: next });
      return next;
    });
  }

  function handleAchatPonctuel(ex: ExerciceKey, idx: number, val: string) {
    setAchatsStockPonctuel((prev) => {
      const updated = [...prev[ex]];
      updated[idx] = numVal(val);
      const next = { ...prev, [ex]: updated };
      // Persiste dans le store → marque la section comme modifiée (isDirty)
      updateActivite(dossierId, currentIndex, { achatsStockPonctuel: next });
      return next;
    });
  }

  function handleImportFrom(sourceIdx: number) {
    const source = draft.activites[sourceIdx];
    if (!source) return;
    const srcCA = source.saisonnaliteCA as Record<string, number[]> | undefined | null;
    const srcAchats = source.saisonnaliteAchats as Record<string, number[]> | undefined | null;
    const nextCA: Record<ExerciceKey, number[]> = {
      N: resampleSaisonnalite(srcCA?.N ?? buildEvenSaisonnalite(exercicesConfig.N.duree), exercicesConfig.N.duree),
      N1: resampleSaisonnalite(srcCA?.N1 ?? buildEvenSaisonnalite(exercicesConfig.N1.duree), exercicesConfig.N1.duree),
      N2: resampleSaisonnalite(srcCA?.N2 ?? buildEvenSaisonnalite(exercicesConfig.N2.duree), exercicesConfig.N2.duree),
    };
    const nextAchats: Record<ExerciceKey, number[]> = syncSaisonnalite
      ? nextCA
      : {
          N: resampleSaisonnalite(srcAchats?.N ?? nextCA.N, exercicesConfig.N.duree),
          N1: resampleSaisonnalite(srcAchats?.N1 ?? nextCA.N1, exercicesConfig.N1.duree),
          N2: resampleSaisonnalite(srcAchats?.N2 ?? nextCA.N2, exercicesConfig.N2.duree),
        };
    setSaisonnalite(nextCA);
    setSaisonnaliteAchats(nextAchats);
    updateActivite(dossierId, currentIndex, { saisonnaliteCA: nextCA, saisonnaliteAchats: nextAchats });
    setImportPopoverOpen(false);
  }

  return (
    <Tabs defaultValue="N" className="w-full space-y-4">
      <TabsList className="grid w-full grid-cols-3 h-8">
        <TabsTrigger value="N" className="text-xs">
          Exercice N
        </TabsTrigger>
        <TabsTrigger value="N1" className="text-xs">
          N+1
        </TabsTrigger>
        <TabsTrigger value="N2" className="text-xs">
          N+2
        </TabsTrigger>
      </TabsList>

      {(["N", "N1", "N2"] as ExerciceKey[]).map((ex) => {
        const saison = saisonnalite[ex];
        const totalSaison = saison.reduce((s, v) => s + v, 0);
        const montant = getMontant(ex);
        const tauxMarge = activite.tauxMarge ?? 0;
        const stocksJours = activite.stocks ?? 0;
        const ponctuel = achatsStockPonctuel[ex];

        // ── Calculs mensuels ───────────────────────────────────────
        const productions = saison.map((p) => montant * (p / 100));
        const marges = productions.map((p) => p * (tauxMarge / 100));
        const consommes = productions.map((p, i) => p - marges[i]);
        const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
        const saisonOk = Math.abs(totalSaison - 100) < 0.01;

        // ── Calculs Achats (saisonnalité indépendante si désynchronisée) ─
        const saisonAchats = syncSaisonnalite ? saison : saisonnaliteAchats[ex];
        const totalSaisonAchats = saisonAchats.reduce((s, v) => s + v, 0);
        const saisonAchatsOk = Math.abs(totalSaisonAchats - 100) < 0.1;
        const totalConsommes = sum(consommes);
        const consommesAchats = saisonAchats.map((p) => totalConsommes * (p / 100));
        const dureeEx = exercicesConfig[ex].duree;
        const stocksFauxAch: number[] = [];
        const stocksInitAch: number[] = [];
        const achatsEff: number[] = [];
        for (let j = 0; j < dureeEx; j++) {
          const si = j === 0 ? 0 : stocksFauxAch[j - 1];
          stocksInitAch[j] = si;
          const sf = consommesAchats[j] * (stocksJours / 30);
          stocksFauxAch[j] = sf;
          achatsEff[j] = consommesAchats[j] + ponctuel[j] + sf - si;
        }

        const moisLabels = buildMoisLabels(exercicesConfig[ex].startMonth, exercicesConfig[ex].startYear, dureeEx);

        return (
          <TabsContent key={ex} value={ex} className="space-y-5 mt-0">
            {/* ── Paramètres ────────────────────────────────────────── */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Paramètres</p>
              <div className="rounded border border-border overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-muted/50">
                    <tr>
                      <Th className="w-44">Paramètre CA</Th>
                      <Th className="w-44">Valeur</Th>
                      <Th className="w-2 bg-border/30" />
                      <Th className="w-44">Paramètre Achats</Th>
                      <Th className="w-44">Valeur</Th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-background">
                      <ParamLabel>Mode CA</ParamLabel>
                      <ParamCell>
                        <select className={cellSelect} value={modeCA} onChange={(e) => setModeCA(e.target.value)}>
                          {MODES_CA.map((m) => (
                            <option key={m.value} value={m.value} className="bg-background text-foreground">
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </ParamCell>
                      <td className="bg-border/30 border-t border-border" />
                      <ParamLabel>Marge globale</ParamLabel>
                      <ParamCell>
                        <select className={cellSelect} value={modeMarge} onChange={(e) => setModeMarge(e.target.value)}>
                          {MODES_MARGE.map((m) => (
                            <option key={m.value} value={m.value} className="bg-background text-foreground">
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </ParamCell>
                    </tr>
                    <tr className="bg-background">
                      <ParamLabel>Encours</ParamLabel>
                      <ParamCell>
                        <select
                          className={cellSelect}
                          value={encours ? "avec" : "sans"}
                          onChange={(e) => setEncours(e.target.value === "avec")}
                        >
                          <option value="sans" className="bg-background text-foreground">
                            Sans encours
                          </option>
                          <option value="avec" className="bg-background text-foreground">
                            Avec encours
                          </option>
                        </select>
                      </ParamCell>
                      <td className="bg-border/30 border-t border-border" />
                      <ParamLabel>Taux marge (%)</ParamLabel>
                      <ParamCell>
                        <input
                          type="number"
                          className={cn(cellInput, "text-right")}
                          value={tauxMarge === 0 ? "" : tauxMarge}
                          placeholder="0"
                          onChange={(e) =>
                            updateActivite(dossierId, currentIndex, { tauxMarge: numVal(e.target.value) })
                          }
                        />
                      </ParamCell>
                    </tr>
                    <tr className="bg-background">
                      <ParamLabel>Règl. clients (j)</ParamLabel>
                      <ParamCell>
                        <input
                          type="number"
                          className={cn(cellInput, "text-right")}
                          value={activite.reglementClients === 0 ? "" : (activite.reglementClients ?? "")}
                          placeholder="0"
                          onChange={(e) =>
                            updateActivite(dossierId, currentIndex, { reglementClients: intVal(e.target.value) })
                          }
                        />
                      </ParamCell>
                      <td className="bg-border/30 border-t border-border" />
                      <ParamLabel>Stocks (j)</ParamLabel>
                      <ParamCell>
                        <input
                          type="number"
                          className={cn(cellInput, "text-right")}
                          value={stocksJours === 0 ? "" : stocksJours}
                          placeholder="0"
                          onChange={(e) => updateActivite(dossierId, currentIndex, { stocks: intVal(e.target.value) })}
                        />
                      </ParamCell>
                    </tr>
                    <tr className="bg-background">
                      <ParamLabel>TVA ventes (%)</ParamLabel>
                      <ParamCell>
                        <select
                          className={cellSelect}
                          value={activite.tvaVentes.toString()}
                          onChange={(e) =>
                            updateActivite(dossierId, currentIndex, { tvaVentes: numVal(e.target.value) })
                          }
                        >
                          {TAUX_TVA_OPTIONS.map((t) => (
                            <option key={t.value} value={t.value.toString()} className="bg-background text-foreground">
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </ParamCell>
                      <td className="bg-border/30 border-t border-border" />
                      <ParamLabel>Règl. fournisseurs (j)</ParamLabel>
                      <ParamCell>
                        <input
                          type="number"
                          className={cn(cellInput, "text-right")}
                          value={activite.reglementFournisseurs === 0 ? "" : (activite.reglementFournisseurs ?? "")}
                          placeholder="0"
                          onChange={(e) =>
                            updateActivite(dossierId, currentIndex, { reglementFournisseurs: intVal(e.target.value) })
                          }
                        />
                      </ParamCell>
                    </tr>
                    <tr className="bg-background">
                      <ParamLabel>Exigibilité TVA ventes</ParamLabel>
                      <ParamCell>
                        <select
                          className={cellSelect}
                          value={exigibiliteTVAVentes}
                          onChange={(e) => setExigibiliteTVAVentes(e.target.value)}
                        >
                          {MODES_EXIGIBILITE_TVA.map((m) => (
                            <option key={m.value} value={m.value} className="bg-background text-foreground">
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </ParamCell>
                      <td className="bg-border/30 border-t border-border" />
                      <ParamLabel>TVA achats (%)</ParamLabel>
                      <ParamCell>
                        <select
                          className={cellSelect}
                          value={activite.tvaAchats.toString()}
                          onChange={(e) =>
                            updateActivite(dossierId, currentIndex, { tvaAchats: numVal(e.target.value) })
                          }
                        >
                          {TAUX_TVA_OPTIONS.map((t) => (
                            <option key={t.value} value={t.value.toString()} className="bg-background text-foreground">
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </ParamCell>
                    </tr>
                    <tr className="bg-background">
                      <ParamLabel />
                      <ParamCell />
                      <td className="bg-border/30 border-t border-border" />
                      <ParamLabel>Exigibilité TVA achats</ParamLabel>
                      <ParamCell>
                        <select
                          className={cellSelect}
                          value={exigibiliteTVAAchats}
                          onChange={(e) => setExigibiliteTVAAchats(e.target.value)}
                        >
                          {MODES_EXIGIBILITE_TVA.map((m) => (
                            <option key={m.value} value={m.value} className="bg-background text-foreground">
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </ParamCell>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Tableau Chiffre d'affaires ───────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {"Chiffre d'affaires"}
                </p>
                {/* Reporter la saisonnalité CA vers les autres exercices */}
                <div className="flex items-center gap-1">
                  {/* Importer depuis une autre ligne */}
                  {draft.activites.length > 1 && (
                    <>
                      <span className="h-4 w-px bg-border mx-0.5" />
                      <Popover open={importPopoverOpen} onOpenChange={setImportPopoverOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium border border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                          >
                            <ArrowDownToLine className="h-3 w-3" />
                            Importer saisonnalité
                            <ChevronDown className="h-3 w-3 opacity-60" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-56 p-1.5">
                          <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Importer depuis…
                          </p>
                          {draft.activites.map((a, i) => {
                            if (i === currentIndex) return null;
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleImportFrom(i)}
                                className="w-full text-left rounded px-2 py-1.5 text-sm hover:bg-muted transition-colors truncate"
                              >
                                {a.libelle || `Ligne ${i + 1}`}
                              </button>
                            );
                          })}
                        </PopoverContent>
                      </Popover>
                    </>
                  )}
                  {(["N", "N1", "N2"] as ExerciceKey[])
                    .filter((target) => target !== ex)
                    .map((target) => {
                      const targetLen = exercicesConfig[target].duree;
                      return (
                        <button
                          key={target}
                          type="button"
                          title={`Reporter cette saisonnalité sur l'exercice ${target}`}
                          onClick={() => {
                            const resampled = resampleSaisonnalite(saisonnalite[ex], targetLen);
                            const nextCA = { ...saisonnalite, [target]: resampled };
                            setSaisonnalite(nextCA);
                            const nextAchats = syncSaisonnalite
                              ? nextCA
                              : {
                                  ...saisonnaliteAchats,
                                  [target]: resampleSaisonnalite(saisonnaliteAchats[ex], targetLen),
                                };
                            setSaisonnaliteAchats(nextAchats);
                            updateActivite(dossierId, currentIndex, {
                              saisonnaliteCA: nextCA,
                              saisonnaliteAchats: nextAchats,
                            });
                          }}
                          className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium border border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                        >
                          <CopyCheck className="h-3 w-3" />
                          {`→ ${target}`}
                        </button>
                      );
                    })}
                  {/* Reporter sur TOUS les autres exercices d'un coup */}
                  <button
                    type="button"
                    title="Reporter cette saisonnalité sur tous les exercices"
                    onClick={() => {
                      const others = (["N", "N1", "N2"] as ExerciceKey[]).filter((t) => t !== ex);
                      let nextCA = { ...saisonnalite };
                      let nextAchats = { ...saisonnaliteAchats };
                      for (const target of others) {
                        const resampled = resampleSaisonnalite(saisonnalite[ex], exercicesConfig[target].duree);
                        nextCA = { ...nextCA, [target]: resampled };
                        nextAchats = syncSaisonnalite
                          ? { ...nextAchats, [target]: resampled }
                          : {
                              ...nextAchats,
                              [target]: resampleSaisonnalite(saisonnaliteAchats[ex], exercicesConfig[target].duree),
                            };
                      }
                      setSaisonnalite(nextCA);
                      setSaisonnaliteAchats(nextAchats);
                      updateActivite(dossierId, currentIndex, {
                        saisonnaliteCA: nextCA,
                        saisonnaliteAchats: nextAchats,
                      });
                    }}
                    className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium border border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                  >
                    <CopyCheck className="h-3 w-3" />→ Tous
                  </button>
                </div>
              </div>
              <TableauMensuel
                moisLabels={moisLabels}
                lignes={[
                  { label: "Production vendue", values: productions, total: montant, format: "euro" },
                  {
                    label: "Saisonnalité (%)",
                    values: saison,
                    total: totalSaison,
                    format: "percent",
                    editable: true,
                    onChange: (i, v) => handleSaisonnalite(ex, i, v),
                    totalClass: saisonOk ? "text-green-600 dark:text-green-400" : "text-destructive",
                  },
                  { label: "Consommation", values: consommes, total: sum(consommes), format: "euro" },
                  { label: "Achat", values: consommes, total: sum(consommes), format: "euro" },
                  {
                    label: "Marge sur production",
                    values: marges,
                    total: sum(marges),
                    format: "euro",
                    highlight: true,
                  },
                ]}
              />
            </div>

            {/* ── Tableau Marge globale ────────────────────────────── */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Marge globale
              </p>
              <TableauMensuel
                moisLabels={moisLabels}
                lignes={[
                  {
                    label: "Taux de marge (%)",
                    values: Array(dureeEx).fill(tauxMarge),
                    total: tauxMarge,
                    format: "percent",
                  },
                  {
                    label: "Marge sur production",
                    values: marges,
                    total: sum(marges),
                    format: "euro",
                    highlight: true,
                  },
                ]}
              />
            </div>

            {/* ── Tableau Achats / Stocks ──────────────────────────── */}
            <div>
              <div className="flex items-center justify-between pb-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Achats / Stocks</p>
                <div className="flex items-center gap-2">
                  {/* Reporter la saisonnalité Achats (si désynchronisée) vers les autres exercices */}
                  {!syncSaisonnalite && (
                    <div className="flex items-center gap-1">
                      {(["N", "N1", "N2"] as ExerciceKey[])
                        .filter((target) => target !== ex)
                        .map((target) => {
                          const targetLen = exercicesConfig[target].duree;
                          return (
                            <button
                              key={target}
                              type="button"
                              title={`Reporter la saisonnalité achats sur l'exercice ${target}`}
                              onClick={() => {
                                const resampled = resampleSaisonnalite(saisonnaliteAchats[ex], targetLen);
                                const next = { ...saisonnaliteAchats, [target]: resampled };
                                setSaisonnaliteAchats(next);
                                updateActivite(dossierId, currentIndex, { saisonnaliteAchats: next });
                              }}
                              className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium border border-amber-400/60 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 transition-colors"
                            >
                              <CopyCheck className="h-3 w-3" />
                              {`→ ${target}`}
                            </button>
                          );
                        })}
                      {/* Reporter achats sur TOUS les autres exercices d'un coup */}
                      <button
                        type="button"
                        title="Reporter la saisonnalité achats sur tous les exercices"
                        onClick={() => {
                          const others = (["N", "N1", "N2"] as ExerciceKey[]).filter((t) => t !== ex);
                          let next = { ...saisonnaliteAchats };
                          for (const target of others) {
                            next = {
                              ...next,
                              [target]: resampleSaisonnalite(saisonnaliteAchats[ex], exercicesConfig[target].duree),
                            };
                          }
                          setSaisonnaliteAchats(next);
                          updateActivite(dossierId, currentIndex, { saisonnaliteAchats: next });
                        }}
                        className="flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium border border-amber-400/60 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 transition-colors"
                      >
                        <CopyCheck className="h-3 w-3" />→ Tous
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !syncSaisonnalite;
                      setSyncSaisonnalite(next);
                      if (next) {
                        setSaisonnaliteAchats(saisonnalite);
                        updateActivite(dossierId, currentIndex, { saisonnaliteAchats: saisonnalite });
                      }
                    }}
                    className={cn(
                      "flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium border transition-colors",
                      syncSaisonnalite
                        ? "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
                        : "border-amber-400/60 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400",
                    )}
                  >
                    {syncSaisonnalite ? (
                      <>
                        <Link2 className="h-3 w-3" /> Saisonnalité synchronisée avec CA
                      </>
                    ) : (
                      <>
                        <Link2Off className="h-3 w-3" /> Saisonnalité indépendante
                      </>
                    )}
                  </button>
                </div>
              </div>
              <TableauMensuel
                moisLabels={moisLabels}
                lignes={[
                  { label: "Achats consommés", values: consommesAchats, total: sum(consommesAchats), format: "euro" },
                  {
                    label: "Achats de stock ponctuel",
                    values: ponctuel,
                    total: sum(ponctuel),
                    format: "euro",
                    editable: true,
                    onChange: (i, v) => handleAchatPonctuel(ex, i, v),
                  },
                  { label: "Stock initial", values: stocksInitAch, total: stocksInitAch[0], format: "euro" },
                  {
                    label: "Stocks (jours)",
                    values: Array(dureeEx).fill(stocksJours),
                    total: stocksJours,
                    format: "decimal",
                  },
                  {
                    label: "Stock final",
                    values: stocksFauxAch,
                    total: stocksFauxAch[dureeEx - 1] ?? 0,
                    format: "euro",
                  },
                  {
                    label: "Achats effectués",
                    values: achatsEff,
                    total: sum(achatsEff),
                    format: "euro",
                    highlight: true,
                  },
                  {
                    label: "Saisonnalité achats (%)",
                    values: saisonAchats,
                    total: totalSaisonAchats,
                    format: "percent",
                    editable: !syncSaisonnalite,
                    onChange: (i, v) => handleSaisonnaliteAchats(ex, i, v),
                    totalClass: saisonAchatsOk ? "text-green-600 dark:text-green-400" : "text-destructive",
                  },
                ]}
              />
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

// ── Composant principal ──────────────────────────────────────────────────────

export function DetailActiviteDialog({
  open,
  onOpenChange,
  dossierId,
  activiteIndex,
  dateDebutExerciceN,
  exercices,
}: DetailActiviteDialogProps) {
  const draft = useActiviteStore((s) => s.getDraft(dossierId));
  const total = draft.activites.length;
  // Calcule startMonth et duree pour chaque exercice depuis les données entreprise
  const exercicesConfig = buildExercicesConfig(dateDebutExerciceN, exercices);

  // Index courant — navigable en interne, initialisé depuis le parent
  const [currentIndex, setCurrentIndex] = useState(activiteIndex);

  const goTo = useCallback(
    (idx: number) => {
      if (idx >= 0 && idx < total) setCurrentIndex(idx);
    },
    [total],
  );

  const activite = draft.activites[currentIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-start gap-4 pr-8">
          {total > 1 && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => goTo(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Activité précédente"
              >
                <ArrowBigUp />
              </button>
              <button
                type="button"
                onClick={() => goTo(currentIndex + 1)}
                disabled={currentIndex === total - 1}
                className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Activité suivante"
              >
                <ArrowBigDown />
              </button>
            </div>
          )}
          <DialogTitle className="text-base font-semibold truncate">
            Détail : {activite?.libelle || "Sans nom"}
          </DialogTitle>
        </DialogHeader>

        {/* key=currentIndex → React recrée DialogBody et réinitialise tous ses états locaux */}
        <DialogBody
          key={currentIndex}
          dossierId={dossierId}
          currentIndex={currentIndex}
          exercicesConfig={exercicesConfig}
        />

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

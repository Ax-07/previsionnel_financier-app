"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalculatorIcon, RefreshCwIcon, LandmarkIcon, WandSparklesIcon, ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useSimulateurStore, defaultInput } from "@/stores/simulateur-paie-store";
import { simulate } from "@/lib/paie/simulate";
import { netToGross } from "@/lib/paie/engine/net-to-gross";
import type { SimulationInput } from "@/lib/paie/types";
import { PARAMS_2026 } from "@/lib/paie/params/2026";
import { AVAILABLE_MILLESIMES, DEFAULT_MILLESIME } from "@/lib/paie/params/index";
// ── Conventions collectives (Lot 6) — déclenche l'auto-enregistrement ──────
import "@/lib/paie/conventions";
import { CONVENTION_CATALOG } from "@/lib/paie/conventions/catalog";

// ─────────────────────────────────────────────────────────────────────────────
// Schéma de validation Zod
// ─────────────────────────────────────────────────────────────────────────────

const schema = z.object({
  // Salarié
  statut: z.enum(["cadre", "non_cadre"]),
  typeContrat: z.enum(["CDI", "CDD", "apprentissage", "contrat_pro", "stage"]),
  heuresContrat: z.number().min(1).max(300),
  brutMensuel: z.number().min(0),
  netCible: z.number().min(0).optional(),
  primesSoumises: z.number().min(0).optional(),
  heuresSupplementaires: z.number().min(0).optional(),
  avantagesEnNature: z.number().min(0).optional(),
  tauxPAS: z.number().min(0).max(50).optional(),
  // Absences & proratisation
  absencesNonRemunerees: z.number().min(0).optional(),
  dateEntree: z.string().optional(),
  dateSortie: z.string().optional(),
  moisReference: z.string().optional(),
  // Régime Alsace-Moselle
  alsaceMoselle: z.boolean().optional(),
  // Apprentissage
  anneeApprenti: z.enum(["1", "2", "3"]).optional(),
  ageApprenti: z.number().min(15).max(35).optional(),
  dateDebutAvantMars2025: z.boolean().optional(),
  // Entreprise
  effectif: z.number().min(1),
  tauxATMP: z.number().min(0).max(100),
  tauxMobilite: z.number().min(0).max(30).optional(),
  // Convention collective
  conventionCode: z.string().optional(),
  // Paramètres réglementaires
  millesime: z.string(),
});

type FormValues = z.infer<typeof schema>;

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────────────────────────────────────

interface SimulateurFormProps {
  /** Input initial (deep-link depuis le prévisionnel) */
  initialInput?: Partial<SimulationInput>;
}

export function SimulateurForm({ initialInput }: SimulateurFormProps) {
  const { mode, setMode, setResultat, setErreur, setCalcEnCours, reset } =
    useSimulateurStore();

  const form = useForm<FormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: {
      statut: (initialInput?.salarié?.statut as "cadre" | "non_cadre") ?? "non_cadre",
      typeContrat: (initialInput?.salarié?.typeContrat as FormValues["typeContrat"]) ?? "CDI",
      heuresContrat: initialInput?.salarié?.heuresContrat ?? 151.66669,
      brutMensuel: initialInput?.salarié?.brutMensuel ?? defaultInput.salarié.brutMensuel,
      netCible: undefined,
      primesSoumises: 0,
      heuresSupplementaires: 0,
      avantagesEnNature: 0,
      absencesNonRemunerees: 0,
      dateEntree: "",
      dateSortie: "",
      moisReference: "",
      alsaceMoselle: false,
      tauxPAS: initialInput?.salarié?.tauxPAS ?? 0,
      effectif: initialInput?.entreprise?.effectif ?? 10,
      tauxATMP: initialInput?.entreprise?.tauxATMP !== undefined
        ? initialInput.entreprise.tauxATMP * 100
        : 2.1,
      tauxMobilite: initialInput?.entreprise?.tauxMobilite !== undefined
        ? (initialInput.entreprise.tauxMobilite ?? 0) * 100
        : 0,
      anneeApprenti: "1",
      ageApprenti: 20,
      dateDebutAvantMars2025: false,
      conventionCode: undefined,
      millesime: DEFAULT_MILLESIME,
    },
  });

  const typeContratWatch = form.watch("typeContrat");
  const estAlternance = typeContratWatch === "apprentissage";

  // ── Panneau absences / proratisation ─────────────────────────────────────
  const [absencesOuvertes, setAbsencesOuvertes] = useState(false);

  // ── Panneau convention collective ─────────────────────────────────────────
  const [conventionOuverte, setConventionOuverte] = useState(false);

  // Liste triée alphabétiquement pour le sélecteur
  const conventions = Array.from(CONVENTION_CATALOG.entries()).sort(
    (a, b) => a[1].label.localeCompare(b[1].label, "fr")
  );

  // ── Gestion auto des heures supplémentaires ───────────────────────────────
  // Quand heuresContrat > 151,67h (ex. contrat 39h/sem = 169h), les heures
  // au-delà du légal sont automatiquement des heures supplémentaires.
  const HEURES_LEGALES = 151.66669;
  const [hsAutoCalc, setHsAutoCalc] = useState(true);

  // Synchronise le champ heuresSupplementaires si l'auto-calcul est actif
  useEffect(() => {
    if (!hsAutoCalc) return;
    const subscription = form.watch((values, { name }) => {
      if (name !== "heuresContrat") return;
      const h = values.heuresContrat ?? HEURES_LEGALES;
      if (h > HEURES_LEGALES) {
        const hSup = Math.round((h - HEURES_LEGALES) * 100000) / 100000;
        form.setValue("heuresSupplementaires", hSup, { shouldDirty: false });
      } else {
        form.setValue("heuresSupplementaires", 0, { shouldDirty: false });
      }
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hsAutoCalc]);

  /**
   * Calcule le SMIC brut proratisé selon les heures contractuelles,
   * puis l'injecte dans le bon champ selon le mode de calcul.
   * En mode net→brut, simule d'abord pour obtenir le net SMIC.
   */
  function appliquerSmic() {
    const heures = form.getValues("heuresContrat") || 151.66669;
    // brutMensuel = salaire de base (heures normales uniquement)
    // Les HS sont calculées séparément par le moteur
    const smicBrut = Math.round(PARAMS_2026.smicHoraire * Math.min(heures, HEURES_LEGALES) * 100) / 100;

    if (mode === "brut_to_net") {
      form.setValue("brutMensuel", smicBrut, { shouldDirty: true });
    } else {
      // On simule avec le brut SMIC pour récupérer le net correspondant
      try {
        const currentValues = form.getValues();
        const inputSmic = buildInput({ ...currentValues, brutMensuel: smicBrut });
        const res = simulate({ ...inputSmic, salarié: { ...inputSmic.salarié, brutMensuel: smicBrut } });
        const netSmic = Math.round(res.netAPayer * 100) / 100;
        form.setValue("netCible", netSmic, { shouldDirty: true });
      } catch {
        // Fallback : on injecte juste le brut dans le champ net (approximation)
        form.setValue("netCible", smicBrut, { shouldDirty: true });
      }
    }
  }

  // Recalcul automatique à chaque modification du formulaire
  useEffect(() => {
    const subscription = form.watch((values) => {
      handleSubmit(values as FormValues);
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function buildInput(values: FormValues): SimulationInput {
    return {
      salarié: {
        statut: values.statut,
        typeContrat: values.typeContrat,
        heuresContrat: values.heuresContrat,
        brutMensuel: mode === "brut_to_net" ? values.brutMensuel : 0,
        primesSoumises: values.primesSoumises,
        heuresSupplementaires: values.heuresSupplementaires,
        avantagesEnNature: values.avantagesEnNature,
        absencesNonRemunerees: values.absencesNonRemunerees,
        alsaceMoselle: values.alsaceMoselle ?? false,
        ...(values.dateEntree ? { dateEntree: values.dateEntree } : {}),
        ...(values.dateSortie ? { dateSortie: values.dateSortie } : {}),
        ...(values.moisReference ? { moisReference: values.moisReference } : {}),
        tauxPAS: (values.tauxPAS ?? 0) / 100,
        modePAS: values.tauxPAS ? "personnalise" : "neutre",
        ...(values.conventionCode ? { conventionCode: values.conventionCode } : {}),
        ...(values.typeContrat === "apprentissage" && values.anneeApprenti && values.ageApprenti
          ? {
              apprentissage: {
                generation: values.dateDebutAvantMars2025
                  ? "avant_mars_2025"
                  : "depuis_mars_2025",
                annee: Number(values.anneeApprenti) as 1 | 2 | 3,
                ageApprenti: values.ageApprenti,
              },
            }
          : {}),
      },
      entreprise: {
        effectif: values.effectif,
        tauxATMP: (values.tauxATMP ?? 2.1) / 100,
        tauxMobilite: ((values.tauxMobilite ?? 0) / 100),
      },
      millesime: values.millesime,
    };
  }

  function handleSubmit(values: FormValues) {
    try {
      setCalcEnCours(true);
      const input = buildInput(values);

      if (mode === "net_to_brut" && values.netCible && values.netCible > 0) {
        const résultat = netToGross(values.netCible, input, simulate);
        if (résultat) {
          const inputFinal = { ...input, salarié: { ...input.salarié, brutMensuel: résultat.brutSoumis } };
          setResultat(inputFinal, résultat);
        } else {
          setErreur("Impossible de converger vers ce net cible. Vérifiez les paramètres.");
        }
      } else if (mode === "brut_to_net" && values.brutMensuel >= 0) {
        const résultat = simulate(input);
        setResultat(input, résultat);
      }
    } catch {
      setErreur("Erreur de calcul. Vérifiez les paramètres saisis.");
    } finally {
      setCalcEnCours(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-6"
      >
        {/* ── Mode de calcul ── */}
        <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3">
          <span
            className={mode === "brut_to_net" ? "text-sm font-semibold" : "text-sm text-muted-foreground"}
          >
            Brut → Net
          </span>
          <Switch
            checked={mode === "net_to_brut"}
            onCheckedChange={(v) => setMode(v ? "net_to_brut" : "brut_to_net")}
            aria-label="Basculer entre mode brut→net et net→brut"
          />
          <span
            className={mode === "net_to_brut" ? "text-sm font-semibold" : "text-sm text-muted-foreground"}
          >
            Net → Brut
          </span>
        </div>

        {/* ── Rémunération principale ── */}
        <section className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Rémunération
          </h3>

          {mode === "brut_to_net" ? (
            <FormField
              control={form.control}
              name="brutMensuel"
              render={({ field }) => {
                const heures = form.watch("heuresContrat") || 151.66669;
                const smicBase = Math.round(PARAMS_2026.smicHoraire * Math.min(heures, HEURES_LEGALES) * 100) / 100;
                return (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Salaire brut mensuel (€)</FormLabel>
                      <button
                        type="button"
                        onClick={appliquerSmic}
                        className="flex items-center gap-1 rounded border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/15 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors"
                        title={`Appliquer le SMIC — base ${Math.min(heures, HEURES_LEGALES).toFixed(2)} h légales${heures > HEURES_LEGALES ? " (HS calculées séparément)" : ""}`}
                      >
                        <LandmarkIcon className="size-3" />
                        Au SMIC — {smicBase.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                      </button>
                    </div>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={String(PARAMS_2026.smicMensuel.toFixed(2))}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          ) : (
            <FormField
              control={form.control}
              name="netCible"
              render={({ field }) => {
                const heures = form.watch("heuresContrat") || 151.66669;
                const smicBrut = Math.round(PARAMS_2026.smicHoraire * heures * 100) / 100;
                return (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Net à payer cible (€)</FormLabel>
                      <button
                        type="button"
                        onClick={appliquerSmic}
                        className="flex items-center gap-1 rounded border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/15 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary transition-colors"
                        title={`Calculer le net correspondant au SMIC brut proratisé (${smicBrut.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €)`}
                      >
                        <LandmarkIcon className="size-3" />
                        Net SMIC
                      </button>
                    </div>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="1 500"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="primesSoumises"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primes soumises (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avantagesEnNature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avantages en nature (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="heuresSupplementaires"
              render={({ field }) => {
                const heures = form.watch("heuresContrat") ?? HEURES_LEGALES;
                const hsAuto = hsAutoCalc && heures > HEURES_LEGALES;
                const hsCalculees = Math.round((heures - HEURES_LEGALES) * 100000) / 100000;
                return (
                  <FormItem>
                    <div className="flex items-center justify-between gap-1">
                      <FormLabel>Heures supplémentaires</FormLabel>
                      {hsAuto ? (
                        <span className="flex items-center gap-1 rounded border border-green-300 bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:border-green-700 dark:bg-green-950/30 dark:text-green-400">
                          <WandSparklesIcon className="size-3" />
                          Auto · {hsCalculees.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} h
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setHsAutoCalc(true);
                            if (heures > HEURES_LEGALES) {
                              form.setValue("heuresSupplementaires", hsCalculees);
                            }
                          }}
                          className="text-[10px] text-primary underline underline-offset-2 hover:no-underline focus:outline-none"
                        >
                          Recalculer auto
                        </button>
                      )}
                    </div>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0"
                        className={hsAuto ? "bg-muted/40" : ""}
                        {...field}
                        onChange={(e) => {
                          setHsAutoCalc(false);
                          field.onChange(parseFloat(e.target.value) || 0);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="tauxPAS"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taux PAS (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="50"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <Separator />

        {/* ── Profil salarié ── */}
        <section className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Profil salarié
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="statut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="non_cadre">Non-cadre</SelectItem>
                      <SelectItem value="cadre">Cadre</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="typeContrat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de contrat</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CDI">CDI</SelectItem>
                      <SelectItem value="CDD">CDD</SelectItem>
                      <SelectItem value="apprentissage">Apprentissage</SelectItem>
                      <SelectItem value="contrat_pro">Contrat pro</SelectItem>
                      <SelectItem value="stage">Stage</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="heuresContrat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Heures contractuelles / mois
                  <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                    (35h = 151,67 · 39h = 169)
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="1"
                    max="300"
                    {...field}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 151.66669;
                      field.onChange(val);
                      // Réactiver l'auto-calcul dès que l'utilisateur change les heures
                      setHsAutoCalc(true);
                    }}
                  />
                </FormControl>
                {(form.watch("heuresContrat") ?? 0) > HEURES_LEGALES && (
                  <p className="text-[11px] text-muted-foreground">
                    {Math.round((form.watch("heuresContrat") - HEURES_LEGALES) * 100) / 100} h/mois au-delà
                    du légal ({HEURES_LEGALES} h) — comptées comme heures supplémentaires
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* ── Paramètres apprentissage ── */}
        {estAlternance && (
          <>
            <Separator />
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Paramètres apprentissage
                </h3>
                <Badge variant="secondary">Règles spécifiques 2026</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="anneeApprenti"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Année du cycle</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1re année</SelectItem>
                          <SelectItem value="2">2e année</SelectItem>
                          <SelectItem value="3">3e année</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ageApprenti"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{"Âge de l'apprenti"}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="15"
                          max="35"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 20)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name="dateDebutAvantMars2025"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                          id="dateDebutAvantMars2025"
                        />
                      </FormControl>
                      <Label htmlFor="dateDebutAvantMars2025" className="text-sm leading-none">
                        Contrat débuté avant le 1er mars 2025
                      </Label>
                    </FormItem>
                  )}
                />
              </div>
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                {form.watch("dateDebutAvantMars2025")
                  ? "Exonération SS salariale + CSG/CRDS jusqu'à 79 % du SMIC (≈ 1 440 €)"
                  : "Exonération SS salariale + CSG/CRDS jusqu'à 50 % du SMIC (≈ 912 €)"}
              </p>
            </section>
          </>
        )}

        <Separator />

        {/* ── Absences & proratisation ── */}
        <section className="flex flex-col gap-3">
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
            onClick={() => setAbsencesOuvertes((v) => !v)}
            aria-expanded={absencesOuvertes}
          >
            {absencesOuvertes
              ? <ChevronDownIcon className="size-4" />
              : <ChevronRightIcon className="size-4" />}
            Absences & proratisation
          </button>

          {absencesOuvertes && (
            <div className="flex flex-col gap-4 pl-6 border-l-2 border-muted">

              {/* Absence non rémunérée */}
              <FormField
                control={form.control}
                name="absencesNonRemunerees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Retenue absence non rémunérée (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <p className="text-[11px] text-muted-foreground">
                      Déduit du brut soumis (maladie, absence injustifiée, congé sans solde…)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Proratisation entrée / sortie */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateEntree"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d&apos;entrée</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <p className="text-[11px] text-muted-foreground">Proratise le PMSS et la RGDU</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateSortie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de sortie</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <p className="text-[11px] text-muted-foreground">Proratise le PMSS et la RGDU</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="moisReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mois de référence (pour proratisation)</FormLabel>
                    <FormControl>
                      <Input
                        type="month"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <p className="text-[11px] text-muted-foreground">
                      Laissez vide pour utiliser le mois courant
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Alsace-Moselle */}
              <FormField
                control={form.control}
                name="alsaceMoselle"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                        id="alsaceMoselle"
                      />
                    </FormControl>
                    <div>
                      <Label htmlFor="alsaceMoselle" className="text-sm font-medium leading-none">
                        Régime local Alsace-Moselle
                      </Label>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        +1,50 % maladie salarié (dép. 57, 67, 68)
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          )}
        </section>

        <Separator />

        {/* ── Convention collective ── */}
        <section className="flex flex-col gap-3">
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
            onClick={() => setConventionOuverte((v) => !v)}
            aria-expanded={conventionOuverte}
          >
            {conventionOuverte
              ? <ChevronDownIcon className="size-4" />
              : <ChevronRightIcon className="size-4" />}
            Convention collective
            {form.watch("conventionCode") && (
              <Badge variant="outline" className="ml-auto normal-case font-normal text-[10px]">
                IDCC {form.watch("conventionCode")}
              </Badge>
            )}
          </button>

          {conventionOuverte && (
            <div className="flex flex-col gap-3 pl-6 border-l-2 border-muted">
              <FormField
                control={form.control}
                name="conventionCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Convention applicable</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === "__none__" ? undefined : v)}
                      value={field.value ?? "__none__"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Aucune (régime général)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Aucune (régime général)</SelectItem>
                        {conventions.map(([code, meta]) => (
                          <SelectItem key={code} value={code}>
                            IDCC {code} — {meta.label}
                            {meta.statut === "partial" ? " ●" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      Applique la prévoyance obligatoire et la politique de maintien salarial
                      conventionnel. Les conventions marquées ● sont partiellement implémentées.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </section>

        <Separator />

        {/* ── Paramètres entreprise ── */}
        <section className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Entreprise
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="effectif"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effectif</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="10"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tauxATMP"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taux AT/MP (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="2.1"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="tauxMobilite"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Versement mobilité (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="30"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* ── Millésime réglementaire ── */}
        {AVAILABLE_MILLESIMES.length > 1 && (
          <>
            <Separator />
            <section className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Paramètres réglementaires
              </h3>
              <FormField
                control={form.control}
                name="millesime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Millésime</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AVAILABLE_MILLESIMES.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      Barèmes réglementaires applicables (SMIC, PASS, taux Urssaf)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>
          </>
        )}

        {/* ── Actions ── */}
        <div className="flex gap-2">
          <Button type="submit" className="flex-1 gap-2">
            <CalculatorIcon className="size-4" />
            Calculer
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              form.reset();
              reset();
            }}
            aria-label="Réinitialiser"
          >
            <RefreshCwIcon className="size-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
}

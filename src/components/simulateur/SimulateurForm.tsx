"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CalculatorIcon, RefreshCwIcon } from "lucide-react";
import { useSimulateurStore, defaultInput } from "@/stores/simulateur-paie-store";
import { simulate } from "@/lib/paie/simulate";
import { netToGross } from "@/lib/paie/engine/net-to-gross";
import type { SimulationInput } from "@/lib/paie/types";
import { PARAMS_2026 } from "@/lib/paie/params/2026";
import { AVAILABLE_MILLESIMES, DEFAULT_MILLESIME } from "@/lib/paie/params/index";
// ── Conventions collectives — déclenche l'auto-enregistrement ──────────────
import "@/lib/paie/conventions";
import { simulateurSchema, type FormValues, HEURES_LEGALES } from "./simulateur-schema";
import { SectionProfilSalarie } from "./sections/section-profil-salarie";
import { SectionRemuneration } from "./sections/section-remuneration";
import { SectionApprentissage } from "./sections/section-apprentissage";
import { SectionAbsences } from "./sections/section-absences";
import { SectionConvention } from "./sections/section-convention";
import { SectionEntreprise } from "./sections/section-entreprise";
import { SectionMutuelle } from "./sections/section-mutuelle";
import { SectionMillesime } from "./sections/section-millesime";
import { ContratPeriodeForm } from "./ContratPeriodeForm";

// ─────────────────────────────────────────────────────────────────────────────
// Composant principal — orchestrateur des blocs de formulaire
// ─────────────────────────────────────────────────────────────────────────────

interface SimulateurFormProps {
  /** Input initial (deep-link depuis le prévisionnel) */
  initialInput?: Partial<SimulationInput>;
  /** Mode d'affichage : bulletin unique ou période de contrat */
  modeSimulateur?: "bulletin" | "contrat";
  /** Callback de lancement de la simulation contrat */
  onSimulateContrat?: (dateDebut: string, dateFin: string, joursCPPris: number) => void;
  /** Simulation contrat en cours */
  contratLoading?: boolean;
  /** Erreur de simulation contrat */
  contratError?: string | null;
}

export function SimulateurForm({
  initialInput,
  modeSimulateur = "bulletin",
  onSimulateContrat,
  contratLoading,
  contratError,
}: SimulateurFormProps) {
  const { mode, setMode, setResultat, setErreur, setCalcEnCours, reset } =
    useSimulateurStore();

  const form = useForm<FormValues>({
    resolver: standardSchemaResolver(simulateurSchema),
    defaultValues: {
      statut: (initialInput?.salarié?.statut as "cadre" | "non_cadre") ?? "non_cadre",
      typeContrat: (initialInput?.salarié?.typeContrat as FormValues["typeContrat"]) ?? "CDI",
      heuresContrat: initialInput?.salarié?.heuresContrat ?? HEURES_LEGALES,
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
      tauxPAS:
        initialInput?.salarié?.tauxPAS !== undefined
          ? initialInput.salarié.tauxPAS * 100
          : 0,
      effectif: initialInput?.entreprise?.effectif ?? 10,
      tauxATMP:
        initialInput?.entreprise?.tauxATMP !== undefined
          ? initialInput.entreprise.tauxATMP * 100
          : 2.08,
      tauxMobilite:
        initialInput?.entreprise?.tauxMobilite !== undefined
          ? (initialInput.entreprise.tauxMobilite ?? 0) * 100
          : 0,
      anneeApprenti: "1",
      ageApprenti: 20,
      dateDebutAvantMars2025: false,
      conventionCode: undefined,
      mutuelleActive: true,
      mutuelleMontant: 40,
      mutuellePartEmployeur: 50,
      millesime: DEFAULT_MILLESIME,
    },
  });

  const typeContrat = form.watch("typeContrat");
  const estAlternance = typeContrat === "apprentissage";

  // ── Auto-calcul des heures supplémentaires ────────────────────────────────
  const [hsAutoCalc, setHsAutoCalc] = useState(true);

  useEffect(() => {
    if (!hsAutoCalc) return;
    const subscription = form.watch((values, { name }) => {
      if (name !== "heuresContrat") return;
      const h = values.heuresContrat ?? HEURES_LEGALES;
      if (h > HEURES_LEGALES) {
        form.setValue(
          "heuresSupplementaires",
          Math.round((h - HEURES_LEGALES) * 100000) / 100000,
          { shouldDirty: false },
        );
      } else {
        form.setValue("heuresSupplementaires", 0, { shouldDirty: false });
      }
    });
    return () => subscription.unsubscribe();
  }, [hsAutoCalc, form]);

  // ── Recalcul automatique à chaque modification (debounce 300ms) ──────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;

  const debouncedSubmit = useCallback(
    (values: Record<string, unknown>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const parsed = simulateurSchema.safeParse(values);
        if (parsed.success) {
          handleSubmitRef.current(parsed.data);
        }
      }, 300);
    },
    [],
  );

  useEffect(() => {
    const subscription = form.watch((values) => {
      debouncedSubmit(values);
    });
    return () => {
      subscription.unsubscribe();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form, debouncedSubmit]);

  // ── Construction de SimulationInput depuis les valeurs du formulaire ───────
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
        ...(values.typeContrat === "apprentissage" &&
        values.anneeApprenti &&
        values.ageApprenti
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
        tauxMobilite: (values.tauxMobilite ?? 0) / 100,
        ...(values.mutuelleActive && values.mutuelleMontant && values.mutuelleMontant > 0
          ? {
              mutuelle: {
                montantMensuel: values.mutuelleMontant,
                partEmployeur: (values.mutuellePartEmployeur ?? 50) / 100,
              },
            }
          : {}),
      },
      millesime: values.millesime,
    };
  }

  /**
   * Calcule le SMIC brut proratisé selon les heures contractuelles,
   * puis l'injecte dans le bon champ selon le mode de calcul.
   * En mode net→brut, simule d'abord pour obtenir le net SMIC correspondant.
   */
  function appliquerSmic() {
    const heures = form.getValues("heuresContrat") || HEURES_LEGALES;
    const smicBrut =
      Math.round(PARAMS_2026.smicHoraire * Math.min(heures, HEURES_LEGALES) * 100) / 100;

    if (mode === "brut_to_net") {
      form.setValue("brutMensuel", smicBrut, { shouldDirty: true });
    } else {
      try {
        const inputSmic = buildInput({ ...form.getValues(), brutMensuel: smicBrut });
        const res = simulate({ ...inputSmic, salarié: { ...inputSmic.salarié, brutMensuel: smicBrut } });
        form.setValue("netCible", Math.round(res.netAPayer * 100) / 100, { shouldDirty: true });
      } catch (err) {
        console.warn("[appliquerSmic] Échec de la simulation SMIC net, fallback sur brut :", err);
        form.setValue("netCible", smicBrut, { shouldDirty: true });
      }
    }
  }

  function handleSubmit(values: FormValues) {
    try {
      setCalcEnCours(true);
      const input = buildInput(values);

      if (mode === "net_to_brut" && values.netCible && values.netCible > 0) {
        const résultat = netToGross(values.netCible, input, simulate);
        if (résultat) {
          setResultat(
            { ...input, salarié: { ...input.salarié, brutMensuel: résultat.brutSoumis } },
            résultat,
          );
        } else {
          setErreur("Impossible de converger vers ce net cible. Vérifiez les paramètres.");
        }
      } else if (mode === "brut_to_net" && values.brutMensuel >= 0) {
        setResultat(input, simulate(input));
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[SimulateurForm] Erreur de calcul :", err);
      }
      setErreur("Erreur de calcul. Vérifiez les paramètres saisis.");
    } finally {
      setCalcEnCours(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Rendu — modifier l'ordre des <Section*> pour réorganiser l'interface
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-6">

        {/* Bloc 2 — Profil salarié (statut, type contrat, heures) */}
        <Separator />
        <SectionProfilSalarie
          form={form}
          onResetHsAutoCalc={() => setHsAutoCalc(true)}
        />

        {/* Bloc 10 — Période de contrat (conditionnel) */}
        {modeSimulateur === "contrat" && onSimulateContrat && (
          <>
            <Separator />
            <ContratPeriodeForm
              onSimulate={onSimulateContrat}
              typeContrat={typeContrat}
              loading={contratLoading}
              error={contratError}
            />
          </>
        )}

        {/* Bloc 3 — Rémunération (brut/net, primes, HS, PAS) */}
        <Separator />
        <SectionRemuneration
          form={form}
          mode={mode}
          onModeChange={setMode}
          hsAutoCalc={hsAutoCalc}
          setHsAutoCalc={setHsAutoCalc}
          onAppliquerSmic={appliquerSmic}
        />

        {/* Bloc 4 — Paramètres apprentissage (conditionnel) */}
        {estAlternance && (
          <>
            <Separator />
            <SectionApprentissage form={form} />
          </>
        )}

        {/* Bloc 5 — Absences & proratisation */}
        <Separator />
        <SectionAbsences form={form} />

        {/* Bloc 6 — Convention collective */}
        <Separator />
        <SectionConvention form={form} />

        {/* Bloc 7 — Paramètres entreprise */}
        <Separator />
        <SectionEntreprise form={form} />

        {/* Bloc 8 — Mutuelle obligatoire */}
        <Separator />
        <SectionMutuelle form={form} />

        {/* Bloc 9 — Millésime réglementaire (conditionnel) */}
        {AVAILABLE_MILLESIMES.length > 1 && (
          <>
            <Separator />
            <SectionMillesime form={form} />
          </>
        )}

        {/* Actions */}
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
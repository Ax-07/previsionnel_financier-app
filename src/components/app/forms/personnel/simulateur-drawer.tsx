"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSimulateurStore } from "@/stores/simulateur-paie-store";
import { usePersonnelStore } from "@/stores/personnel-store";
import { useScenarioDataStore } from "@/stores/scenario-data-store";
import { saveLignesSalaries } from "@/app/actions/personnel";
import { SimulateurForm } from "@/components/simulateur/SimulateurForm";
import { BulletinDisplay } from "@/components/simulateur/BulletinDisplay";
import { FinancialSummary } from "@/components/simulateur/FinancialSummary";
import type { InjectPreviData } from "@/components/simulateur/FinancialSummary";
import { ContratResultats } from "@/components/simulateur/ContratResultats";
import type { InjectDetailData } from "@/components/simulateur/ContratResultats";
import { ContratPeriodeForm } from "@/components/simulateur/ContratPeriodeForm";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { FileTextIcon, CalendarDaysIcon } from "lucide-react";
import { toast } from "sonner";
import type { SimulationInput } from "@/lib/paie/types";
import type { SimulationContratResultat } from "@/lib/paie/contrat/types";
import { simulateContrat } from "@/lib/paie/contrat/simulate-contrat";

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface SimulateurDrawerProps {
  open: boolean;
  onClose: () => void;
  dossierId: string;
  salarieId: string;
  salarieIdx: number;
  libelle: string;
  brutMensuel: number;
  /** Date de démarrage du dossier — transmise depuis le formulaire personnel */
  debutExercice: Date | null;
  /** Appelé après une injection réussie */
  onInjected: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Drawer (Sheet) intégré à l'onglet Personnel permettant de simuler la paie
 * d'un salarié et d'injecter les résultats directement dans le prévisionnel,
 * sans quitter la page.
 */
export function SimulateurDrawer({
  open,
  onClose,
  dossierId,
  salarieId,
  salarieIdx,
  libelle,
  brutMensuel,
  debutExercice,
  onInjected,
}: SimulateurDrawerProps) {
  const { resultat, input, erreur } = useSimulateurStore();
  const personnelStore = usePersonnelStore();

  /**
   * Mémorise le dernier salarieIdx simulé pour ne réinitialiser
   * le store que lorsqu'on change de salarié, pas à chaque fermeture/ouverture.
   */
  const prevSalarieIdxRef = useRef<number | null>(null);

  // ── Simulation contrat (multi-mois) ────────────────────────────────────
  const [contratResultat, setContratResultat] = useState<SimulationContratResultat | null>(null);
  const [contratLoading, setContratLoading] = useState(false);
  const [contratError, setContratError] = useState<string | null>(null);

  // Reset uniquement lors du changement de salarié — conserve les résultats
  // si on ferme puis rouvre le drawer pour le même salarié.
  useEffect(() => {
    if (open && prevSalarieIdxRef.current !== salarieIdx) {
      useSimulateurStore.getState().reset();
      setContratResultat(null);
      setContratError(null);
      prevSalarieIdxRef.current = salarieIdx;
    }
  }, [open, salarieIdx]);

  const handleSimulateContrat = useCallback(
    (dateDebut: string, dateFin: string, joursCPPris: number) => {
      if (!input) {
        setContratError(
          "Veuillez d'abord configurer les paramètres du salarié dans le formulaire.",
        );
        return;
      }
      setContratLoading(true);
      setContratError(null);
      try {
        const result = simulateContrat({
          baseInput: input,
          periode: { dateDebut, dateFin },
          joursCPPris,
        });
        setContratResultat(result);
      } catch (err) {
        setContratError(
          err instanceof Error ? err.message : "Erreur lors de la simulation de la période.",
        );
        setContratResultat(null);
      } finally {
        setContratLoading(false);
      }
    },
    [input],
  );

  // ── Injection bulletin unique → taux patronal/salarial ─────────────────

  const handleInjectPrevi = async (data: InjectPreviData) => {
    if (!dossierId) {
      toast.error("Impossible d'identifier le dossier cible.");
      return;
    }
    personnelStore.updateSalarie(dossierId, salarieIdx, {
      tauxCotPat: data.tauxCotPat,
      tauxCotSal: data.tauxCotSal,
    });
    if (salarieId) personnelStore.markSimulateurInjected(dossierId, salarieId);

    const updatedRows = personnelStore.getDraft(dossierId).salaries;
    const result = await saveLignesSalaries(dossierId, updatedRows);

    if (result.success) {
      await useScenarioDataStore.getState().reload(dossierId);
      toast.success(
        `Taux patronal ${data.tauxCotPat.toFixed(2)} % appliqué à « ${libelle || "salarié"} » et sauvegardé.`,
      );
      onInjected();
      onClose();
    } else {
      toast.error(result.error ?? "Erreur lors de la sauvegarde des charges.");
    }
  };

  // ── Injection période contrat → détail mensuel brut par mois ───────────

  const handleInjectDetail = async (data: InjectDetailData) => {
    if (!dossierId) {
      toast.error("Impossible d'identifier le dossier cible.");
      return;
    }
    personnelStore.updateSalarie(dossierId, salarieIdx, {
      tauxCotPat: data.tauxCotPat,
      tauxCotSal: data.tauxCotSal,
      montantN: data.montantN,
      montantN1: data.montantN1,
      montantN2: data.montantN2,
      detailMensuelN: data.detailMensuelN,
      detailMensuelN1: data.detailMensuelN1,
      detailMensuelN2: data.detailMensuelN2,
    });
    if (salarieId) personnelStore.markSimulateurInjected(dossierId, salarieId);

    const updatedRows = personnelStore.getDraft(dossierId).salaries;
    const result = await saveLignesSalaries(dossierId, updatedRows);

    if (result.success) {
      await useScenarioDataStore.getState().reload(dossierId);
      toast.success(
        `Détail mensuel injecté pour « ${libelle || "salarié"} » — brut total N : ${data.montantN.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €.`,
      );
      onInjected();
      onClose();
    } else {
      toast.error(result.error ?? "Erreur lors de la sauvegarde des charges.");
    }
  };

  // ── Input initial pour le simulateur ──────────────────────────────────

  const initialInput: Partial<SimulationInput> = {
    salarié: {
      statut: "non_cadre",
      typeContrat: "CDI",
      heuresContrat: 151.66669,
      brutMensuel,
    },
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent
        side="right"
        className="w-full max-w-[96vw] overflow-y-auto sm:max-w-[900px] xl:max-w-[1100px] p-0"
      >
        <SheetHeader className="px-6 pt-5 pb-3 border-b">
          <SheetTitle className="text-base font-semibold">
            Simulateur de paie
            {libelle && (
              <span className="text-muted-foreground font-normal ml-2">— {libelle}</span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-0 lg:flex-row lg:h-[calc(100vh-70px)]">
          {/* ── Colonne gauche : formulaire salarié ── */}
          <div className="w-full shrink-0 overflow-y-auto border-b lg:w-80 xl:w-96 lg:border-b-0 lg:border-r">
            <div className="p-5">
              <SimulateurForm
                initialInput={initialInput}
                modeSimulateur="bulletin"
                onSimulateContrat={handleSimulateContrat}
                contratLoading={contratLoading}
                contratError={contratError}
              />
            </div>
          </div>

          {/* ── Colonne droite : résultats ── */}
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="bulletin" className="flex flex-col h-full">
              <TabsList className="mx-5 mt-4 mb-0 shrink-0 self-start">
                <TabsTrigger value="bulletin" className="gap-1.5 text-xs">
                  <FileTextIcon className="size-3.5" />
                  Bulletin
                </TabsTrigger>
                <TabsTrigger value="periode" className="gap-1.5 text-xs">
                  <CalendarDaysIcon className="size-3.5" />
                  Période
                </TabsTrigger>
              </TabsList>

              {/* ── Onglet bulletin unique ── */}
              <TabsContent value="bulletin" className="p-5 space-y-4 flex-1">
                {erreur && (
                  <p className="text-sm text-destructive">{erreur}</p>
                )}
                {resultat && input ? (
                  <>
                    <BulletinDisplay resultat={resultat} input={input} />
                    <Separator />
                    <FinancialSummary
                      resultat={resultat}
                      onInjectPrevi={handleInjectPrevi}
                    />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Configurez les paramètres du salarié et lancez la simulation.
                  </p>
                )}
              </TabsContent>

              {/* ── Onglet période contrat ── */}
              <TabsContent value="periode" className="p-5 space-y-4 flex-1">
                <ContratPeriodeForm
                  onSimulate={handleSimulateContrat}
                  typeContrat={input?.salarié.typeContrat ?? "CDI"}
                  loading={contratLoading}
                  error={contratError}
                />
                {contratResultat && (
                  <>
                    <Separator />
                    <ContratResultats
                      resultat={contratResultat}
                      estCDD={input?.salarié.typeContrat === "CDD"}
                      dateDemarrage={debutExercice ?? undefined}
                      onInjectDetail={handleInjectDetail}
                    />
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

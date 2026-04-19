"use client";

import { Suspense, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSimulateurStore } from "@/stores/simulateur-paie-store";
import { usePersonnelStore } from "@/stores/personnel-store";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
import { saveLignesSalaries } from "@/app/actions/personnel";
import { SimulateurForm } from "@/components/simulateur/SimulateurForm";
import { BulletinDisplay } from "@/components/simulateur/BulletinDisplay";
import { FinancialSummary } from "@/components/simulateur/FinancialSummary";
import { AnnualProjection } from "@/components/simulateur/AnnualProjection";
import { ScenariosManager } from "@/components/simulateur/ScenariosManager";
import { ContratResultats } from "@/components/simulateur/ContratResultats";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CalculatorIcon,
  LoaderCircleIcon,
  DownloadIcon,
  PrinterIcon,
  BookmarkPlusIcon,
  CalendarDaysIcon,
  FileTextIcon,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { SimulationInput } from "@/lib/paie/types";
import type { SimulationContratResultat } from "@/lib/paie/contrat/types";
import { simulateContrat } from "@/lib/paie/contrat/simulate-contrat";
import { downloadBulletinJSON } from "@/lib/paie/export/json";
import { downloadBulletinCSV } from "@/lib/paie/export/csv";
import { downloadBulletinPdf } from "@/lib/paie/export/pdf";

// ── Contenu (useSearchParams requiert d'être dans un composant sous Suspense) ─

function SimulateurPageContent() {
  const params = useSearchParams();
  const router = useRouter();

  // Paramètres deep-link depuis le prévisionnel
  const dossierId = params.get("dossierId") ?? "";
  const salarieId = params.get("salarieId") ?? "";
  const libelle = params.get("libelle") ?? "";
  const returnUrl = params.get("returnUrl") ?? (dossierId ? `/app/dossier/${dossierId}` : "");
  const isFromPrevi = !!dossierId;

  const brutMensuel = parseFloat(params.get("brutMensuel") ?? "0") || 2000;
  const statut = params.get("statut") === "cadre" ? ("cadre" as const) : ("non_cadre" as const);

  const initialInput: Partial<SimulationInput> | undefined = isFromPrevi
    ? {
        salarié: {
          statut,
          typeContrat: "CDI",
          heuresContrat: 151.66669,
          brutMensuel,
        },
      }
    : undefined;

  const { resultat, input, erreur, calcEnCours, addScenario } = useSimulateurStore();
  const personnelStore = usePersonnelStore();
  const invalidateControleStores = useInvalidateControleStores();

  // État local export PDF (chargement async)
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleInjectPrevi = async (tauxCotPat: number) => {
    if (!dossierId || !salarieId) {
      toast.error("Impossible d'identifier le salarié cible.");
      return;
    }
    const draft = personnelStore.getDraft(dossierId);
    const idx = draft.salaries.findIndex((r) => r.id === salarieId);
    if (idx === -1) {
      toast.error("Salarié introuvable dans le prévisionnel.");
      return;
    }
    personnelStore.updateSalarie(dossierId, idx, { tauxCotPat });
    personnelStore.markSimulateurInjected(dossierId, salarieId);

    const updatedRows = personnelStore.getDraft(dossierId).salaries;
    const result = await saveLignesSalaries(dossierId, updatedRows);

    if (result.success) {
      invalidateControleStores(dossierId);
      toast.success(
        `Taux patronal de ${tauxCotPat.toFixed(2)} % appliqué à « ${libelle || "salarié"} » et sauvegardé.`,
      );
      if (returnUrl) router.push(returnUrl);
    } else {
      toast.error(result.error ?? "Erreur lors de la sauvegarde des charges.");
    }
  };

  // ── Handlers export ────────────────────────────────────────────────────

  function handleExportJson() {
    if (!input || !resultat) return;
    downloadBulletinJSON(input, resultat);
    toast.success("Bulletin exporté en JSON.");
  }

  function handleExportCsv() {
    if (!input || !resultat) return;
    downloadBulletinCSV(input, resultat);
    toast.success("Bulletin exporté en CSV.");
  }

  async function handleExportPdf() {
    if (!input || !resultat) return;
    setPdfLoading(true);
    try {
      await downloadBulletinPdf(input, resultat);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la génération du PDF.");
    } finally {
      setPdfLoading(false);
    }
  }

  function handleSaveScenario() {
    if (!input || !resultat) return;
    const brut = input.salarié.brutMensuel;
    const nom = `${input.salarié.statut === "cadre" ? "Cadre" : "Non-cadre"} — ${brut.toLocaleString("fr-FR")} € brut`;
    addScenario(nom);
    toast.success("Scénario sauvegardé.");
  }

  // ── Mode page : bulletin unique vs période contrat ────────────────────
  const [modeSimulateur, setModeSimulateur] = useState<"bulletin" | "contrat">("bulletin");

  // ── Simulation contrat (multi-mois) ────────────────────────────────────
  const [contratResultat, setContratResultat] = useState<SimulationContratResultat | null>(null);
  const [contratLoading, setContratLoading] = useState(false);
  const [contratError, setContratError] = useState<string | null>(null);

  const handleSimulateContrat = useCallback(
    (dateDebut: string, dateFin: string, joursCPPris: number) => {
      if (!input) {
        setContratError("Veuillez d'abord configurer les paramètres du salarié dans le formulaire.");
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">

      {/* ── Breadcrumb prévisionnel ── */}
      {isFromPrevi && (
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <Link
            href={returnUrl}
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ArrowLeftIcon className="size-3.5" />
            Retour au prévisionnel
          </Link>
          {libelle && (
            <>
              <span className="text-border">·</span>
              <span>
                Simulation pour :{" "}
                <strong className="text-foreground">{libelle}</strong>
              </span>
            </>
          )}
        </div>
      )}

      {/* ── En-tête de page ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <CalculatorIcon className="size-5 text-primary" />
          <h1 className="text-2xl font-bold md:text-3xl">
            Simulateur de fiche de paie
          </h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Calculez les cotisations sociales 2026 selon les paramètres réglementaires
          en vigueur (Régime général — Agirc-Arrco — RGDU). Obtenez le taux de charges
          patronales à reporter dans votre prévisionnel.
        </p>
      </div>

      <Separator className="mb-6" />

      {/* ── Sélecteur de mode : bulletin unique vs période contrat ── */}
      <div className="mb-6">
        <Tabs
          value={modeSimulateur}
          onValueChange={(v) => setModeSimulateur(v as "bulletin" | "contrat")}
        >
          <TabsList>
            <TabsTrigger value="bulletin" className="gap-1.5">
              <FileTextIcon className="size-4" />
              Bulletin unique
            </TabsTrigger>
            <TabsTrigger value="contrat" className="gap-1.5">
              <CalendarDaysIcon className="size-4" />
              Période de contrat
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ── Disposition principale ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">

        {/* ── Colonne gauche : formulaire ── */}
        <div className="rounded-xl border bg-card p-4 lg:sticky lg:top-6 lg:self-start">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Paramètres
          </h2>
          <SimulateurForm
            initialInput={initialInput}
            modeSimulateur={modeSimulateur}
            onSimulateContrat={handleSimulateContrat}
            contratLoading={contratLoading}
            contratError={contratError}
          />
        </div>

        {/* ── Colonne droite : résultats ── */}
        <div className="flex flex-col gap-4">

          {/* ═══════════════════════════════════════════════════════════════════
              Mode Bulletin unique
              ═══════════════════════════════════════════════════════════════════ */}
          {modeSimulateur === "bulletin" && (
            <>
              {/* Erreur */}
              {erreur && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertCircleIcon className="size-4 mt-0.5 shrink-0" />
                  <span>{erreur}</span>
                </div>
              )}

              {/* Calcul en cours */}
              {calcEnCours && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircleIcon className="size-4 animate-spin" />
                  Calcul en cours…
                </div>
              )}

              {/* Pas encore de résultat */}
              {!resultat && !erreur && !calcEnCours && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center text-muted-foreground">
                  <CalculatorIcon className="size-12 mb-3 opacity-30" />
                  <p className="text-sm font-medium">Renseignez les paramètres</p>
                  <p className="text-xs mt-1">{"Les résultats s'affichent ici automatiquement"}</p>
                </div>
              )}

              {/* Résultat */}
              {resultat && (
                <Tabs defaultValue="bulletin" className="w-full">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
                    <TabsList>
                      <TabsTrigger value="bulletin">Bulletin</TabsTrigger>
                      <TabsTrigger value="synthese">Synthèse</TabsTrigger>
                      <TabsTrigger value="annuel">Coût annuel</TabsTrigger>
                      <TabsTrigger value="scenarios">Scénarios</TabsTrigger>
                    </TabsList>

                    {/* Actions export */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={handleSaveScenario}
                        title="Sauvegarder comme scénario comparatif"
                      >
                        <BookmarkPlusIcon className="mr-1.5 size-3.5" />
                        Scénario
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={handleExportJson}
                        title="Télécharger le bulletin en JSON"
                      >
                        <DownloadIcon className="mr-1.5 size-3.5" />
                        JSON
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={handleExportCsv}
                        title="Télécharger les cotisations en CSV"
                      >
                        <DownloadIcon className="mr-1.5 size-3.5" />
                        CSV
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={handleExportPdf}
                        disabled={pdfLoading}
                        title="Imprimer / Exporter en PDF"
                      >
                        <PrinterIcon className="mr-1.5 size-3.5" />
                        {pdfLoading ? "Génération…" : "PDF"}
                      </Button>
                    </div>
                  </div>

                  {/* Bulletin */}
                  <TabsContent value="bulletin">
                    <div className="rounded-xl border bg-card p-4">
                      <BulletinDisplay resultat={resultat} input={input!} />
                    </div>
                  </TabsContent>

                  {/* Synthèse */}
                  <TabsContent value="synthese">
                    <div className="rounded-xl border bg-card p-4">
                      <FinancialSummary
                        resultat={resultat}
                        onInjectPrevi={isFromPrevi ? handleInjectPrevi : undefined}
                      />
                    </div>
                  </TabsContent>

                  {/* Projection annuelle */}
                  <TabsContent value="annuel">
                    <AnnualProjection resultat={resultat} />
                  </TabsContent>

                  {/* Scénarios */}
                  <TabsContent value="scenarios">
                    <div className="rounded-xl border bg-card p-4">
                      <ScenariosManager />
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              Mode Période de contrat
              ═══════════════════════════════════════════════════════════════════ */}
          {modeSimulateur === "contrat" && (
            <>
              {/* Message d'aide */}
              {!contratResultat && !contratError && !contratLoading && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center text-muted-foreground">
                  <CalendarDaysIcon className="size-12 mb-3 opacity-30" />
                  <p className="text-sm font-medium">Simulation multi-mois</p>
                  <p className="text-xs mt-1 max-w-sm">
                    Configurez les paramètres du salarié, puis définissez la période de contrat
                    pour générer les fiches de paie de chaque mois avec le suivi des congés payés.
                  </p>
                </div>
              )}

              {/* Chargement */}
              {contratLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircleIcon className="size-4 animate-spin" />
                  Génération des bulletins en cours…
                </div>
              )}

              {/* Résultats contrat */}
              {contratResultat && !contratLoading && (
                <div className="rounded-xl border bg-card p-4">
                  <ContratResultats
                    resultat={contratResultat}
                    estCDD={input?.salarié.typeContrat === "CDD"}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SimulateurPaiePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-muted-foreground">
          Chargement…
        </div>
      }
    >
      <SimulateurPageContent />
    </Suspense>
  );
}

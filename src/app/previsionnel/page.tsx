import {
  InboxIcon,
} from "lucide-react";
import AppHeader from "@/components/app/app-header";
import { NouveauDossierDialog } from "@/components/app/nouveau-dossier-dialog";
import { DossierCard } from "@/components/app/dossier-card";
import { fetchDossiers } from "@/app/actions/dossier";

export default async function AppDashboardPage() {
  const dossiers = await fetchDossiers();

  return (
    <>
      <AppHeader />

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

          {/* ── En-tête de page ───────────────────────────────────── */}
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Mes dossiers</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {dossiers.length === 0
                  ? "Aucun dossier pour l'instant."
                  : `${dossiers.length} dossier${dossiers.length > 1 ? "s" : ""}`}
              </p>
            </div>
            <NouveauDossierDialog />
          </div>

          {/* ── Grille des dossiers ───────────────────────────────── */}
          {dossiers.length === 0 ? (
            <EmptyState />
          ) : (
            <ul
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              aria-label="Liste des dossiers"
            >
              {dossiers.map((d) => (
                <li key={d.id}>
                  <DossierCard dossier={d} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
      <InboxIcon className="mb-4 size-10 text-muted-foreground/50" />
      <h2 className="text-base font-semibold">Aucun dossier</h2>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Créez votre premier dossier prévisionnel pour démarrer.
      </p>
      <NouveauDossierDialog />
    </div>
  );
}


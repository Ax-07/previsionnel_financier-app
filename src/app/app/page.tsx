import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  FolderOpenIcon,
  CalendarIcon,
  ClockIcon,
  InboxIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import AppHeader from "@/components/app/app-header";
import { NouveauDossierDialog } from "@/components/app/nouveau-dossier-dialog";
import { fetchDossiers } from "@/app/actions/dossier";
import { cn } from "@/lib/utils";

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
                  <Link
                    href={`/app/dossier/${d.id}`}
                    className="group block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
                  >
                    <Card className="h-full transition-shadow group-hover:shadow-md">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FolderOpenIcon className="size-4 shrink-0 text-muted-foreground" />
                            <span className="truncate font-semibold text-sm leading-snug">
                              {d.nom}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0 text-xs",
                              d.typeDossier === "CREATION"
                                ? "border-blue-300 text-blue-700 dark:text-blue-400"
                                : "border-amber-300 text-amber-700 dark:text-amber-400"
                            )}
                          >
                            {d.typeDossier === "CREATION" ? "Création" : "Reprise"}
                          </Badge>
                        </div>
                        {d.reference && (
                          <p className="text-xs text-muted-foreground">
                            Réf.&nbsp;{d.reference}
                          </p>
                        )}
                      </CardHeader>

                      <CardContent className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="size-3 shrink-0" />
                          <span>
                            Démarrage&nbsp;:{" "}
                            {format(d.dateDemarrage, "d MMM yyyy", { locale: fr })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ClockIcon className="size-3 shrink-0" />
                          <span>Projection sur {d.dureeProjection}&nbsp;ans</span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground/60">
                          Modifié{" "}
                          {format(d.updatedAt, "d MMM yyyy 'à' HH'h'mm", {
                            locale: fr,
                          })}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
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


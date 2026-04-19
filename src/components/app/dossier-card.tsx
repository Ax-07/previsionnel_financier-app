"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  FolderOpenIcon,
  CalendarIcon,
  ClockIcon,
  MoreVerticalIcon,
  Trash2Icon,
  Loader2Icon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { deleteDossier } from "@/app/actions/dossier";
import type { DossierListItem } from "@/app/actions/dossier";

interface DossierCardProps {
  dossier: DossierListItem;
}

export function DossierCard({ dossier: d }: DossierCardProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteDossier(d.id);
      if (result.success) {
        setShowDeleteDialog(false);
        router.refresh();
      } else {
        // TODO: afficher un toast d'erreur
        console.error("[deleteDossier]", result.error);
        setShowDeleteDialog(false);
      }
    });
  }

  return (
    <>
      <div className="group relative h-full">
        <Link
          href={`/previsionnel/dossier/${d.id}`}
          className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
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

        {/* Menu contextuel — positionné hors du <Link> */}
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.preventDefault()}
                aria-label={`Actions pour ${d.nom}`}
              >
                <MoreVerticalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setShowDeleteDialog(true)}
              >
                <Trash2Icon className="mr-2 size-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le dossier</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement le dossier{" "}
              <strong>« {d.nom} »</strong>&nbsp;? Cette action est irréversible
              et supprimera toutes les données associées (scénarios, saisies,
              calculs…).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Suppression…
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

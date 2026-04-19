"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteDossier } from "@/app/actions/dossier";
import { toast } from "sonner";

interface DeleteDossierButtonProps {
  dossierId: string;
  dossierNom?: string;
}

/**
 * Bouton de suppression d'un dossier avec dialog de confirmation.
 * Redirige vers /previsionnel après suppression réussie.
 */
export function DeleteDossierButton({
  dossierId,
  dossierNom,
}: DeleteDossierButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteDossier(dossierId);
      if (result.success) {
        setOpen(false);
        toast.success("Dossier supprimé avec succès.");
        router.push("/previsionnel");
      } else {
        toast.error(result.error);
        setOpen(false);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-1.5">
          <Trash2Icon className="size-3.5" />
          Supprimer le dossier
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer le dossier</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer définitivement
            {dossierNom ? (
              <>
                {" "}
                le dossier <strong>« {dossierNom} »</strong>
              </>
            ) : (
              " ce dossier"
            )}
            &nbsp;? Cette action est irréversible et supprimera toutes les
            données associées (scénarios, saisies, calculs…).
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
  );
}

"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useRouter } from "next/navigation";
import { PlusIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createDossierSchema,
  type CreateDossierValues,
  TYPES_DOSSIER,
  DUREES_PROJECTION,
} from "@/lib/schemas/dossier";
import { createDossier } from "@/app/actions/dossier";
import { cn } from "@/lib/utils";

export const NouveauDossierDialog: React.FC<React.ComponentProps<typeof DialogTrigger>> = ({className, ...props}) => {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateDossierValues>({
    resolver: standardSchemaResolver(createDossierSchema),
    defaultValues: {
      nom: "",
      typeDossier: "CREATION",
      dateDemarrage: new Date().toISOString().split("T")[0],
      dureeProjection: 3,
      reference: "",
    },
  });

  /** Réinitialise et ferme la modale */
  function handleClose(nextOpen: boolean) {
    if (!nextOpen) reset();
    setOpen(nextOpen);
  }

  async function onSubmit(data: CreateDossierValues) {
    const result = await createDossier(data);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(`Dossier « ${data.nom} » créé avec succès.`);
    setOpen(false);
    reset();
    // Rafraîchit les données serveur puis redirige vers le nouveau dossier
    router.refresh();
    router.push(`/previsionnel/dossier/${result.dossierId}`);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className={cn("gap-1.5", className)} {...props}>
          <PlusIcon className="size-4" />
          <span className="hidden sm:inline">Nouveau dossier</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un nouveau dossier</DialogTitle>
          <DialogDescription>
            Renseignez les informations essentielles pour démarrer votre
            prévisionnel.
          </DialogDescription>
        </DialogHeader>

        <form
          id="nouveau-dossier-form"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          {/* Nom du dossier */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nd-nom">
              Nom du dossier <span aria-hidden="true" className="text-destructive">*</span>
            </Label>
            <Input
              id="nd-nom"
              placeholder="Ex\u00a0: Boulangerie Dupont"
              aria-invalid={!!errors.nom}
              aria-describedby={errors.nom ? "nd-nom-err" : undefined}
              {...register("nom")}
            />
            {errors.nom && (
              <p id="nd-nom-err" className="text-destructive text-xs">
                {errors.nom.message}
              </p>
            )}
          </div>

          {/* Type de dossier */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nd-type">Type de dossier</Label>
            <Select
              defaultValue="CREATION"
              onValueChange={(v) =>
                setValue("typeDossier", v as "CREATION" | "REPRISE")
              }
            >
              <SelectTrigger id="nd-type" aria-label="Type de dossier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES_DOSSIER.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date de démarrage + durée sur la même ligne */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nd-date">
                Date de démarrage <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <Input
                id="nd-date"
                type="date"
                aria-invalid={!!errors.dateDemarrage}
                aria-describedby={
                  errors.dateDemarrage ? "nd-date-err" : undefined
                }
                {...register("dateDemarrage")}
              />
              {errors.dateDemarrage && (
                <p id="nd-date-err" className="text-destructive text-xs">
                  {errors.dateDemarrage.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nd-duree">Durée de projection</Label>
              <Select
                defaultValue="3"
                onValueChange={(v) =>
                  setValue("dureeProjection", Number(v) as 3 | 5)
                }
              >
                <SelectTrigger id="nd-duree" aria-label="Durée de projection">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DUREES_PROJECTION.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Référence (optionnelle) */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nd-ref">
              Référence{" "}
              <span className="text-muted-foreground text-xs">(optionnel)</span>
            </Label>
            <Input
              id="nd-ref"
              placeholder="Ex\u00a0: 2026-001"
              aria-invalid={!!errors.reference}
              aria-describedby={errors.reference ? "nd-ref-err" : undefined}
              {...register("reference")}
            />
            {errors.reference && (
              <p id="nd-ref-err" className="text-destructive text-xs">
                {errors.reference.message}
              </p>
            )}
          </div>

        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isSubmitting}>Annuler</Button>
          </DialogClose>
          <Button
            type="submit"
            form="nouveau-dossier-form"
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
            )}
            Créer le dossier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

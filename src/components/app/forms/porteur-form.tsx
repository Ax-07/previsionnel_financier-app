"use client";

import { useCallback, useEffect, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { usePorteurStore } from "@/stores/porteur-store";
import { useInvalidateControleStores } from "@/hooks/use-invalidate-controle-stores";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SaveIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  porteurSchema,
  type PorteurFormValues,
  CIVILITES,
  FONCTIONS,
} from "@/lib/schemas/porteur";
import { upsertPorteur } from "@/app/actions/porteur";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface PorteurFormProps {
  dossierId: string;
  defaultValues?: Partial<PorteurFormValues>;
}

// ── Sous-composants ──────────────────────────────────────────────────────────

function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "text-sm font-semibold uppercase tracking-wide text-muted-foreground",
        className
      )}
    >
      {children}
    </h3>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function PorteurForm({
  dossierId,
  defaultValues,
}: PorteurFormProps) {
  const [isPending, startTransition] = useTransition();
  const { getDraft, setDraft, clearDraft } = usePorteurStore();
  const invalidateControleStores = useInvalidateControleStores();

  const form = useForm<PorteurFormValues>({
    resolver: standardSchemaResolver(porteurSchema),
    defaultValues: {
      reference: "",
      raisonSociale: "",
      nom: "",
      siret: "",
      activiteSociete: "",
      responsableCivilite: "",
      responsableNom: "",
      responsablePrenom: "",
      responsableFonction: "",
      adresse1: "",
      adresse2: "",
      codePostal: "",
      ville: "",
      pays: "France",
      telephone: "",
      portable: "",
      telecopie: "",
      email: "",
      ...defaultValues,
    },
  });

  const {
    formState: { isDirty, isSubmitSuccessful },
    control,
  } = form;

  // Appliquer le brouillon après le montage (client uniquement) pour éviter le mismatch d'hydratation SSR
  useEffect(() => {
    const draft = getDraft(dossierId);
    if (draft && Object.keys(draft).length > 0) {
      form.reset({ ...form.getValues(), ...draft }, { keepDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync store à chaque modification du formulaire
  // On ne sauvegarde que les champs réellement modifiés (dirtyFields),
  // pour éviter d'écraser les valeurs serveur avec des chaînes vides intouchées.
  const watchedValues = useWatch({ control });
  useEffect(() => {
    if (isDirty) {
      const dirtyFields = form.formState.dirtyFields;
      const dirtyValues = Object.fromEntries(
        Object.entries(watchedValues).filter(
          ([key]) => dirtyFields[key as keyof PorteurFormValues]
        )
      );
      setDraft(dossierId, dirtyValues as Partial<PorteurFormValues>);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValues, isDirty]);

  const onSubmit = useCallback(
    (values: PorteurFormValues) => {
      startTransition(async () => {
        const result = await upsertPorteur(dossierId, values);
        if (result.success) {
          clearDraft(dossierId);
          form.reset(values);
          toast.success("Porteur de projet enregistré avec succès.");
          invalidateControleStores(dossierId);
        } else {
          toast.error(result.error);
        }
      });
    },
    [dossierId, form, clearDraft]
  );

  // Status bar
  const statusNode = (() => {
    if (isPending)
      return (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2Icon className="size-3.5 animate-spin" /> Enregistrement…
        </span>
      );
    if (!isDirty && isSubmitSuccessful)
      return (
        <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2Icon className="size-3.5" /> Enregistré
        </span>
      );
    if (isDirty)
      return (
        <Badge variant="outline" className="text-xs text-amber-600 dark:text-amber-400">
          Modifications non enregistrées
        </Badge>
      );
    return null;
  })();

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex h-full flex-col"
        noValidate
      >
        {/* ── Contenu scrollable ───────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl space-y-8 p-6">

            {/* ── Section Dossier ──────────────────────────────────────── */}
            <section className="space-y-4">
              <SectionTitle>Dossier</SectionTitle>
              <Separator />

              <FieldRow>
                {/* Code dossier */}
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code dossier</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex. : DOS-2024-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Nom de la société */}
                <FormField
                  control={form.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nom de la société{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Boulangerie Dupont" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FieldRow>

              <FieldRow>
                {/* SIRET */}
                <FormField
                  control={form.control}
                  name="siret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SIRET</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="14 chiffres"
                          maxLength={14}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Activité */}
                <FormField
                  control={form.control}
                  name="activiteSociete"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2 lg:col-span-1">
                      <FormLabel>Activité</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex. : Boulangerie-pâtisserie"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FieldRow>
            </section>

            {/* ── Section Responsable ──────────────────────────────────── */}
            <section className="space-y-4">
              <SectionTitle>Responsable</SectionTitle>
              <Separator />

              <FieldRow>
                {/* Civilité */}
                <FormField
                  control={form.control}
                  name="responsableCivilite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Civilité</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CIVILITES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Nom */}
                <FormField
                  control={form.control}
                  name="responsableNom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input placeholder="Dupont" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Prénom */}
                <FormField
                  control={form.control}
                  name="responsablePrenom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input placeholder="Jean" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FieldRow>

              <FieldRow>
                {/* Fonction */}
                <FormField
                  control={form.control}
                  name="responsableFonction"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2 lg:col-span-2">
                      <FormLabel>Fonction</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FONCTIONS.map((f) => (
                            <SelectItem key={f} value={f}>
                              {f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FieldRow>
            </section>

            {/* ── Section Coordonnées ──────────────────────────────────── */}
            <section className="space-y-4">
              <SectionTitle>Coordonnées</SectionTitle>
              <Separator />

              {/* Adresses */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="adresse1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse</FormLabel>
                      <FormControl>
                        <Input placeholder="12 rue de la Paix" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adresse2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Complément d&apos;adresse{" "}
                        <span className="text-muted-foreground text-xs">
                          (optionnel)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Bâtiment A, étage 2…"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FieldRow>
                {/* Code postal */}
                <FormField
                  control={form.control}
                  name="codePostal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code postal</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="75001"
                          maxLength={5}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Ville */}
                <FormField
                  control={form.control}
                  name="ville"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville</FormLabel>
                      <FormControl>
                        <Input placeholder="Paris" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Pays */}
                <FormField
                  control={form.control}
                  name="pays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pays</FormLabel>
                      <FormControl>
                        <Input placeholder="France" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FieldRow>

              <FieldRow>
                {/* Téléphone */}
                <FormField
                  control={form.control}
                  name="telephone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="01 23 45 67 89"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Portable */}
                <FormField
                  control={form.control}
                  name="portable"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Portable</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="06 12 34 56 78"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Télécopie */}
                <FormField
                  control={form.control}
                  name="telecopie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Télécopie</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="01 23 45 67 90"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FieldRow>

              {/* Email */}
              <FieldRow>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="contact@societe.fr"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FieldRow>
            </section>
          </div>
        </div>

        {/* ── Barre d'actions sticky ───────────────────────────────────── */}
        <div className="shrink-0 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">{statusNode}</div>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !isDirty}
              className="gap-1.5"
            >
              {isPending ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <SaveIcon className="size-3.5" />
              )}
              Enregistrer
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

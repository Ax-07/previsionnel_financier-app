"use client";

import { useCallback, useEffect, useMemo, useRef, useTransition } from "react";
import { useFieldArray, useForm, useWatch, type Control, type UseFormSetValue } from "react-hook-form";
import { useEntrepriseStore } from "@/stores/entreprise-store";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SaveIcon, CheckCircle2Icon, Loader2Icon, InfoIcon, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import {
  entrepriseSchema,
  type EntrepriseFormValues,
  type ExerciceFormValues,
  REGIMES_FISCAUX,
  REGIMES_TVA,
  PERIODICITES_TVA,
} from "@/lib/schemas/entreprise";
import { RAISONS_SOCIALES } from "@/lib/schemas/porteur";
import { upsertEntrepriseParams } from "@/app/actions/entreprise";
import { cn } from "@/lib/utils";
import { useReloadScenarioData } from "@/hooks/use-reload-scenario-data";

// ── Types ────────────────────────────────────────────────────────────────────

interface EntrepriseFormProps {
  dossierId: string;
  defaultValues?: Partial<EntrepriseFormValues>;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse une string "YYYY-MM-DD" en Date locale (minuit heure locale).
 * Contrairement à new Date(str), évite tout décalage UTC.
 */
function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Formate une Date en "YYYY-MM-DD" en heure locale (sans UTC).
 * Contrairement à toISOString(), ne décale pas de jour.
 */
function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Calcule la durée en mois entre deux dates (arrondie au mois supérieur).
 * `from` est le 1er jour du premier mois, `to` est le dernier jour du dernier mois.
 */
function diffMois(from: Date, to: Date): number {
  const mois = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1;
  return Math.max(1, mois);
}

/**
 * Génère les exercices par défaut à partir de la date de début et de la durée.
 * Exercice 1 : du dateDebut au 31/12 de l'année de début.
 * Exercices suivants : du 01/01 au 31/12 des années suivantes.
 */
function buildDefaultExercices(dateDebut: string, duree: number): ExerciceFormValues[] {
  const result: ExerciceFormValues[] = [];
  const debut = parseLocalDate(dateDebut);
  let prevFin = debut;

  for (let i = 0; i < duree; i++) {
    const annee = debut.getFullYear() + i;
    const cloture = new Date(annee, 11, 31); // 31 décembre, local
    const from = i === 0 ? debut : new Date(debut.getFullYear() + i, 0, 1);
    const dureeEx = diffMois(from, cloture);
    result.push({
      dateCloture: `${annee}-12-31`,
      duree: dureeEx,
      annee,
    });
    prevFin = cloture;
  }

  void prevFin;
  return result;
}

// ── Sous-composants ──────────────────────────────────────────────────────────

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn("text-sm font-semibold uppercase tracking-wide text-muted-foreground", className)}>{children}</h3>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

// Noms des exercices : N, N+1, N+2, ...
function exerciceLabel(index: number): string {
  return index === 0 ? "Exercice N" : `Exercice N+${index}`;
}

/**
 * Calcule la durée en mois entre une date de début et une date de clôture.
 * Inclut le mois de début et le mois de fin.
 */
function calcDureeDepuis(debut: string, cloture: string): number {
  if (!debut || !cloture) return 0;
  const d = parseLocalDate(debut);
  const c = parseLocalDate(cloture);
  const diff = (c.getFullYear() - d.getFullYear()) * 12 + (c.getMonth() - d.getMonth()) + 1;
  return Math.max(1, diff);
}

/**
 * Calcule la date de clôture à partir d'une date de début et d'une durée en mois.
 * Renvoie le dernier jour du dernier mois concerné.
 */
function calcClotureDateDepuisDuree(debutStr: string, duree: number): string {
  const debut = parseLocalDate(debutStr);
  // new Date(year, month, 0) = dernier jour du mois précédent, en local
  const cloture = new Date(debut.getFullYear(), debut.getMonth() + duree, 0);
  return toDateInputValue(cloture);
}

/**
 * Affiche l'année(s) de l'exercice.
 * Si l'exercice chevauche deux années civiles → "2026/27"
 * Sinon → "2026"
 */
function formatAnneeExercice(debutStr: string, clotureStr: string): string {
  if (!debutStr || !clotureStr) return "—";
  const startYear = parseLocalDate(debutStr).getFullYear();
  const endYear = parseLocalDate(clotureStr).getFullYear();
  if (startYear === endYear) return String(endYear);
  return `${startYear}/${String(endYear).slice(-2)}`;
}

interface ExerciceRowProps {
  index: number;
  control: Control<EntrepriseFormValues>;
  setValue: UseFormSetValue<EntrepriseFormValues>;
  dateDebutExerciceN: string;
  cascadeFrom: (fromIndex: number) => void;
}

function ExerciceRow({ index, control, setValue, dateDebutExerciceN, cascadeFrom }: ExerciceRowProps) {
  const dateCloture = useWatch({ control, name: `exercices.${index}.dateCloture` });
  const duree = useWatch({ control, name: `exercices.${index}.duree` });

  // Surveille la clôture de l'exercice précédent de façon réactive.
  // Pour index === 0 on observe exercices.0.dateCloture mais on l'ignore dans le memo.
  const prevClotureFromForm = useWatch({
    control,
    name: `exercices.${Math.max(0, index - 1)}.dateCloture` as `exercices.${number}.dateCloture`,
  });

  const debutEx = useMemo(() => {
    if (index === 0) return dateDebutExerciceN;
    if (!prevClotureFromForm) return "";
    const prev = parseLocalDate(prevClotureFromForm);
    prev.setDate(prev.getDate() + 1);
    return toDateInputValue(prev);
  }, [index, dateDebutExerciceN, prevClotureFromForm]);

  const anneeDisplay = useMemo(() => formatAnneeExercice(debutEx, dateCloture ?? ""), [debutEx, dateCloture]);

  // Édition de la date de clôture → recalcule la durée et cascade sur les suivants
  const handleDateChange = useCallback(
    (newDate: string) => {
      setValue(`exercices.${index}.dateCloture`, newDate, { shouldDirty: true });
      if (newDate && debutEx) {
        const newDuree = calcDureeDepuis(debutEx, newDate);
        setValue(`exercices.${index}.duree`, newDuree, { shouldDirty: true });
        setValue(`exercices.${index}.annee`, parseLocalDate(newDate).getFullYear(), { shouldDirty: true });
      }
      cascadeFrom(index + 1);
    },
    [index, debutEx, setValue, cascadeFrom],
  );

  // Édition de la durée → recalcule la date de clôture et cascade sur les suivants
  const handleDureeChange = useCallback(
    (newDuree: number) => {
      if (!Number.isFinite(newDuree) || newDuree < 1) return;
      setValue(`exercices.${index}.duree`, newDuree, { shouldDirty: true });
      if (debutEx) {
        const newCloture = calcClotureDateDepuisDuree(debutEx, newDuree);
        setValue(`exercices.${index}.dateCloture`, newCloture, { shouldDirty: true });
        setValue(`exercices.${index}.annee`, parseLocalDate(newCloture).getFullYear(), { shouldDirty: true });
      }
      cascadeFrom(index + 1);
    },
    [index, debutEx, setValue, cascadeFrom],
  );

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-2.5 font-medium text-foreground">{exerciceLabel(index)}</td>
      <td className="px-4 py-2.5">
        <Input
          type="date"
          className="h-8 text-sm"
          value={dateCloture ?? ""}
          onChange={(e) => handleDateChange(e.target.value)}
        />
      </td>
      <td className="px-3 py-2.5">
        <Input
          type="number"
          min={1}
          max={24}
          step={1}
          className="h-8 w-16 text-center text-sm tabular-nums"
          value={duree ?? ""}
          onChange={(e) => handleDureeChange(e.target.valueAsNumber)}
          onBlur={(e) => {
            if (e.target.value === "" && debutEx && dateCloture) {
              handleDureeChange(calcDureeDepuis(debutEx, dateCloture));
            }
          }}
        />
      </td>
      <td className="px-4 py-2.5 text-center tabular-nums text-muted-foreground">{anneeDisplay}</td>
    </tr>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function EntrepriseForm({ dossierId, defaultValues }: EntrepriseFormProps) {
  const [isPending, startTransition] = useTransition();
  const { getDraft, setDraft, clearDraft } = useEntrepriseStore();
  const invalidateControleStores = useReloadScenarioData();

  const form = useForm<EntrepriseFormValues>({
    resolver: standardSchemaResolver(entrepriseSchema),
    defaultValues: {
      formeJuridique: "",
      regimeFiscal: "IS",
      regimeTVA: "REEL_NORMAL",
      periodiciteDeclarationTVA: "mensuel",
      dateDebutExerciceN: "",
      dureePrevisionnelle: 3,
      exercices: [],
      ...defaultValues,
    },
  });

  const {
    formState: { isDirty, isSubmitSuccessful },
    control,
  } = form;

  const { fields: exerciceFields, replace: replaceExercices } = useFieldArray({
    control,
    name: "exercices",
  });

  const { setValue } = form;

  /**
   * Recalcule en cascade les dates de clôture à partir de fromIndex,
   * en conservant les durées existantes de chaque exercice.
   */
  const cascadeFrom = useCallback(
    (fromIndex: number) => {
      const all = form.getValues("exercices") ?? [];
      if (fromIndex >= all.length) return;
      let prevCl = form.getValues(`exercices.${fromIndex - 1}.dateCloture`) ?? "";
      for (let i = fromIndex; i < all.length; i++) {
        const duree = all[i]?.duree ?? 12;
        if (!prevCl) break;
        const prev = parseLocalDate(prevCl);
        prev.setDate(prev.getDate() + 1);
        const debutThis = toDateInputValue(prev);
        const newCloture = calcClotureDateDepuisDuree(debutThis, duree);
        setValue(`exercices.${i}.dateCloture`, newCloture, { shouldDirty: true });
        setValue(`exercices.${i}.annee`, parseLocalDate(newCloture).getFullYear(), { shouldDirty: true });
        prevCl = newCloture;
      }
    },
    [form, setValue],
  );

  // Appliquer le brouillon après le montage (client uniquement) pour éviter le mismatch d'hydratation SSR
  useEffect(() => {
    const draft = getDraft(dossierId);
    if (draft && Object.keys(draft).length > 0) {
      form.reset({ ...form.getValues(), ...draft }, { keepDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync store à chaque modification (uniquement les champs modifiés)
  const watchedValues = useWatch({ control });
  useEffect(() => {
    if (isDirty) {
      const dirtyFields = form.formState.dirtyFields;
      const dirtyValues = Object.fromEntries(
        Object.entries(watchedValues).filter(([key]) => dirtyFields[key as keyof EntrepriseFormValues]),
      );
      setDraft(dossierId, dirtyValues as Partial<EntrepriseFormValues>);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValues, isDirty]);

  const onSubmit = useCallback(
    (values: EntrepriseFormValues) => {
      startTransition(async () => {
        const result = await upsertEntrepriseParams(dossierId, values);
        if (result.success) {
          clearDraft(dossierId);
          form.reset(values);
          toast.success("Paramètres entreprise enregistrés avec succès.");
          invalidateControleStores(dossierId);
        } else {
          toast.error(result.error);
        }
      });
    },
    [dossierId, form, clearDraft],
  );

  // Recalcul automatique des exercices quand la date de début ou la durée change
  const dateDebutWatch = useWatch({ control, name: "dateDebutExerciceN" });
  const dureeWatch = useWatch({ control, name: "dureePrevisionnelle" });
  const prevDureeRef = useRef(dureeWatch);

  useEffect(() => {
    const valid = dateDebutWatch && /^\d{4}-\d{2}-\d{2}$/.test(dateDebutWatch);
    if (!valid) {
      if (dureeWatch < 1) replaceExercices([]);
      return;
    }

    const dureeChanged = dureeWatch !== prevDureeRef.current;
    const firstInit = exerciceFields.length === 0;
    prevDureeRef.current = dureeWatch;

    if (dureeChanged || firstInit) {
      // Changement du nombre d'exercices : reconstruction complète
      replaceExercices(buildDefaultExercices(dateDebutWatch, dureeWatch));
    } else {
      // Seule la date de début a changé : conserver les durées, recalculer les clôtures
      const current = form.getValues("exercices") ?? [];
      let prevCl = dateDebutWatch;
      current.forEach((ex, i) => {
        const duree = ex?.duree ?? 12;
        const debutThis =
          i === 0
            ? dateDebutWatch
            : (() => {
                const prev = parseLocalDate(prevCl);
                prev.setDate(prev.getDate() + 1);
                return toDateInputValue(prev);
              })();
        const newCloture = calcClotureDateDepuisDuree(debutThis, duree);
        setValue(`exercices.${i}.dateCloture`, newCloture, { shouldDirty: true });
        setValue(`exercices.${i}.annee`, parseLocalDate(newCloture).getFullYear(), { shouldDirty: true });
        prevCl = newCloture;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateDebutWatch, dureeWatch]);

  // Affichage conditionnel
  const regimeTVA = useWatch({ control, name: "regimeTVA" });
  const isFranchise = regimeTVA === "FRANCHISE";

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex h-full flex-col" noValidate>
        {/* ── Contenu scrollable ───────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl space-y-8 p-6">
            {/* ── Section Période ──────────────────────────────────────── */}
            <section className="space-y-4">
              <SectionTitle>
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="size-3.5" />
                  Période prévisionnelle
                </span>
              </SectionTitle>
              <Separator />

              <FieldRow>
                {/* Date de début de l'exercice N */}
                <FormField
                  control={form.control}
                  name="dateDebutExerciceN"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Date de début de l&apos;exercice N <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormDescription>Premier jour du premier exercice comptable</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Durée de la prévision */}
                <FormField
                  control={form.control}
                  name="dureePrevisionnelle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Durée de la prévision (exercices) <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          min={1}
                          max={5}
                          placeholder="3"
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </FormControl>
                      <FormDescription>Nombre d&apos;exercices prévisionnels (1 à 5)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FieldRow>
            </section>

            {/* ── Section Exercices prévisionnels ──────────────────────── */}
            {exerciceFields.length > 0 && (
              <section className="space-y-4">
                <SectionTitle>Exercices prévisionnels</SectionTitle>
                <Separator />
                <p className="text-xs text-muted-foreground">
                  La date de début se répercute automatiquement sur tous les exercices en conservant les durées.
                  Modifier la clôture ou la durée d&apos;un exercice recalcule les exercices suivants.
                </p>

                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Exercice</th>
                        <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                          Date de clôture
                          <span className="ml-1 text-xs font-normal opacity-60">← éditable</span>
                        </th>
                        <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">
                          Durée (mois)
                          <span className="ml-1 text-xs font-normal opacity-60">← éditable</span>
                        </th>
                        <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Année</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exerciceFields.map((fieldItem, index) => (
                        <ExerciceRow
                          key={fieldItem.id}
                          index={index}
                          control={form.control}
                          setValue={setValue}
                          dateDebutExerciceN={dateDebutWatch ?? ""}
                          cascadeFrom={cascadeFrom}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ── Section Cadre juridique ──────────────────────────────── */}
            <section className="space-y-4">
              <SectionTitle>Cadre juridique</SectionTitle>
              <Separator />

              <FieldRow>
                {/* Forme juridique */}
                <FormField
                  control={form.control}
                  name="formeJuridique"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2 lg:col-span-1">
                      <FormLabel>Forme juridique</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner…">
                              {field.value ? field.value : undefined}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {RAISONS_SOCIALES.map((rs) => (
                            <SelectItem key={rs.value} value={rs.value} textValue={rs.value}>
                              {rs.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Régime fiscal */}
                <FormField
                  control={form.control}
                  name="regimeFiscal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Régime fiscal <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {REGIMES_FISCAUX.map((rf) => (
                            <SelectItem key={rf.value} value={rf.value}>
                              {rf.label}
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

            {/* ── Section TVA ──────────────────────────────────────────── */}
            <section className="space-y-4">
              <SectionTitle>TVA</SectionTitle>
              <Separator />

              {isFranchise && (
                <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800/40 dark:bg-blue-950/30 dark:text-blue-300">
                  <InfoIcon className="mt-0.5 size-4 shrink-0" />
                  <span>
                    En franchise en base, la TVA n&apos;est pas collectée ni déductible. Les taux renseignés ci-dessous
                    ne seront pas appliqués dans les calculs.
                  </span>
                </div>
              )}

              <FieldRow>
                 {/* Régime TVA */}
                <FormField
                  control={form.control}
                  name="regimeTVA"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Régime TVA <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {REGIMES_TVA.map((rt) => (
                            <SelectItem key={rt.value} value={rt.value}>
                              {rt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Périodicité déclaration TVA */}
                <FormField
                  control={form.control}
                  name="periodiciteDeclarationTVA"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Périodicité de déclaration</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isFranchise}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PERIODICITES_TVA.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
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
          </div>
        </div>

        {/* ── Barre d'actions sticky ───────────────────────────────────── */}
        <div className="shrink-0 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">{statusNode}</div>
            <Button type="submit" size="sm" disabled={isPending || !isDirty} className="gap-1.5">
              {isPending ? <Loader2Icon className="size-3.5 animate-spin" /> : <SaveIcon className="size-3.5" />}
              Enregistrer
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

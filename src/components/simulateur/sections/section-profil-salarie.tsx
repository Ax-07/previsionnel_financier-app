"use client";

import { type UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { type FormValues, HEURES_LEGALES } from "../simulateur-schema";

interface SectionProfilSalarieProps {
  form: UseFormReturn<FormValues>;
  /** Appelé lors du changement des heures contractuelles pour réactiver l'auto-calcul HS */
  onResetHsAutoCalc: () => void;
}

export function SectionProfilSalarie({ form, onResetHsAutoCalc }: SectionProfilSalarieProps) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Profil salarié
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="statut"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="non_cadre">Non-cadre</SelectItem>
                  <SelectItem value="cadre">Cadre</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="typeContrat"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de contrat</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CDI">CDI</SelectItem>
                  <SelectItem value="CDD">CDD</SelectItem>
                  <SelectItem value="apprentissage">Apprentissage</SelectItem>
                  <SelectItem value="contrat_pro">Contrat pro</SelectItem>
                  <SelectItem value="stage">Stage</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="heuresContrat"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Heures contractuelles / mois
              <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                (35h = 151,67 · 39h = 169)
              </span>
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.00001"
                min="1"
                max="300"
                {...field}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || HEURES_LEGALES;
                  field.onChange(val);
                  onResetHsAutoCalc();
                }}
              />
            </FormControl>
            {(form.watch("heuresContrat") ?? 0) > HEURES_LEGALES && (
              <p className="text-[11px] text-muted-foreground">
                {Math.round((form.watch("heuresContrat") - HEURES_LEGALES) * 100) / 100} h/mois
                au-delà du légal ({HEURES_LEGALES} h) — comptées comme heures supplémentaires
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </section>
  );
}

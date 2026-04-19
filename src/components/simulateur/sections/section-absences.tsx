"use client";

import { useState } from "react";
import { type UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { type FormValues } from "../simulateur-schema";

interface SectionAbsencesProps {
  form: UseFormReturn<FormValues>;
}

export function SectionAbsences({ form }: SectionAbsencesProps) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <section className="flex flex-col gap-3">
      <button
        type="button"
        className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
        onClick={() => setOuvert((v) => !v)}
        aria-expanded={ouvert}
      >
        {ouvert ? (
          <ChevronDownIcon className="size-4" />
        ) : (
          <ChevronRightIcon className="size-4" />
        )}
        Absences & proratisation
      </button>

      {ouvert && (
        <div className="flex flex-col gap-4 pl-6 border-l-2 border-muted">
          <FormField
            control={form.control}
            name="absencesNonRemunerees"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Retenue absence non rémunérée (€)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    aria-describedby="help-absences"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <p id="help-absences" className="text-[11px] text-muted-foreground">
                  Déduit du brut soumis (maladie, absence injustifiée, congé sans solde…)
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="dateEntree"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date d&apos;entrée</FormLabel>
                  <FormControl>
                    <Input type="date" aria-describedby="help-date-entree" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <p id="help-date-entree" className="text-[11px] text-muted-foreground">
                    Proratise le PMSS et la RGDU
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateSortie"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de sortie</FormLabel>
                  <FormControl>
                    <Input type="date" aria-describedby="help-date-sortie" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <p id="help-date-sortie" className="text-[11px] text-muted-foreground">
                    Proratise le PMSS et la RGDU
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="moisReference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mois de référence (pour proratisation)</FormLabel>
                <FormControl>
                  <Input type="month" aria-describedby="help-mois-ref" {...field} value={field.value ?? ""} />
                </FormControl>
                <p id="help-mois-ref" className="text-[11px] text-muted-foreground">
                  Laissez vide pour utiliser le mois courant
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="alsaceMoselle"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-md border p-3">
                <FormControl>
                  <Switch
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                    id="alsaceMoselle"
                  />
                </FormControl>
                <div>
                  <Label htmlFor="alsaceMoselle" className="text-sm font-medium leading-none">
                    Régime local Alsace-Moselle
                  </Label>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    +1,50 % maladie salarié (dép. 57, 67, 68)
                  </p>
                </div>
              </FormItem>
            )}
          />
        </div>
      )}
    </section>
  );
}

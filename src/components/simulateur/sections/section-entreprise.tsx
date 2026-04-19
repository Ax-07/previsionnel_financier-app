"use client";

import { type UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type FormValues } from "../simulateur-schema";

interface SectionEntrepriseProps {
  form: UseFormReturn<FormValues>;
}

export function SectionEntreprise({ form }: SectionEntrepriseProps) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Entreprise
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="effectif"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Effectif</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="10"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tauxATMP"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Taux AT/MP (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="2.1"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="tauxMobilite"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Versement mobilité (%)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="30"
                placeholder="0"
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </section>
  );
}

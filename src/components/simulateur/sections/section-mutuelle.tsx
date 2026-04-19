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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { type FormValues } from "../simulateur-schema";

interface SectionMutuelleProps {
  form: UseFormReturn<FormValues>;
}

export function SectionMutuelle({ form }: SectionMutuelleProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Mutuelle obligatoire
        </h3>
        <FormField
          control={form.control}
          name="mutuelleActive"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Switch
                  id="mutuelle-switch"
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                  aria-label="Activer la mutuelle obligatoire"
                />
              </FormControl>
              <Label
                htmlFor="mutuelle-switch"
                className="text-xs text-muted-foreground cursor-pointer"
              >
                {field.value ? "Activée" : "Désactivée"}
              </Label>
            </FormItem>
          )}
        />
      </div>

      {form.watch("mutuelleActive") && (
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="mutuelleMontant"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Forfait mensuel (€)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="60"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mutuellePartEmployeur"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Part employeur (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="1"
                    min="50"
                    max="100"
                    placeholder="50"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 50)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </section>
  );
}

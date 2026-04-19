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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { type FormValues } from "../simulateur-schema";

interface SectionApprentissageProps {
  form: UseFormReturn<FormValues>;
}

export function SectionApprentissage({ form }: SectionApprentissageProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Paramètres apprentissage
        </h3>
        <Badge variant="secondary">Règles spécifiques 2026</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="anneeApprenti"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Année du cycle</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">1re année</SelectItem>
                  <SelectItem value="2">2e année</SelectItem>
                  <SelectItem value="3">3e année</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ageApprenti"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{"Âge de l'apprenti"}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="15"
                  max="35"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 20)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="dateDebutAvantMars2025"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center gap-2 space-y-0">
            <FormControl>
              <Switch
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
                id="dateDebutAvantMars2025"
              />
            </FormControl>
            <Label htmlFor="dateDebutAvantMars2025" className="text-sm leading-none">
              Contrat débuté avant le 1er mars 2025
            </Label>
          </FormItem>
        )}
      />

      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
        {form.watch("dateDebutAvantMars2025")
          ? "Exonération SS salariale + CSG/CRDS jusqu'à 79 % du SMIC (≈ 1 440 €)"
          : "Exonération SS salariale + CSG/CRDS jusqu'à 50 % du SMIC (≈ 912 €)"}
      </p>
    </section>
  );
}

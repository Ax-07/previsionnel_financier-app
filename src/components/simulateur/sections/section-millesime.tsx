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
import { AVAILABLE_MILLESIMES } from "@/lib/paie/params/index";
import { type FormValues } from "../simulateur-schema";

interface SectionMillesimeProps {
  form: UseFormReturn<FormValues>;
}

export function SectionMillesime({ form }: SectionMillesimeProps) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Paramètres réglementaires
      </h3>
      <FormField
        control={form.control}
        name="millesime"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Millésime</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {AVAILABLE_MILLESIMES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Barèmes réglementaires applicables (SMIC, PASS, taux Urssaf)
            </p>
            <FormMessage />
          </FormItem>
        )}
      />
    </section>
  );
}

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { CONVENTION_CATALOG } from "@/lib/paie/conventions/catalog";
import { type FormValues } from "../simulateur-schema";

interface SectionConventionProps {
  form: UseFormReturn<FormValues>;
}

export function SectionConvention({ form }: SectionConventionProps) {
  const [ouvert, setOuvert] = useState(false);

  const conventions = Array.from(CONVENTION_CATALOG.entries()).sort((a, b) =>
    a[1].label.localeCompare(b[1].label, "fr"),
  );

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
        Convention collective
        {form.watch("conventionCode") && (
          <Badge variant="outline" className="ml-auto normal-case font-normal text-[10px]">
            IDCC {form.watch("conventionCode")}
          </Badge>
        )}
      </button>

      {ouvert && (
        <div className="flex flex-col gap-3 pl-6 border-l-2 border-muted">
          <FormField
            control={form.control}
            name="conventionCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Convention applicable</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(v === "__none__" ? undefined : v)}
                  value={field.value ?? "__none__"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Aucune (régime général)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">Aucune (régime général)</SelectItem>
                    {conventions.map(([code, meta]) => (
                      <SelectItem key={code} value={code}>
                        IDCC {code} — {meta.label}
                        {meta.statut === "partial" ? " ●" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Applique la prévoyance obligatoire et la politique de maintien salarial
                  conventionnel. Les conventions marquées ● sont partiellement implémentées.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </section>
  );
}
